# Notification System Design

## Stage 1

### Core REST API

The notification platform should expose small, predictable resources. All private routes require a bearer token.

Common request headers:

```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
X-Correlation-Id: <uuid>
```

List notifications for a student:

```http
GET /api/v1/notifications?limit=10&page=1&notification_type=Placement&read=false
```

Response:

```json
{
  "notifications": [
    {
      "id": "9fba6d0c-6100-4d3d-95f5-bd0c6f7e49c5",
      "studentId": 1042,
      "type": "Placement",
      "message": "Amazon.com Inc. hiring",
      "timestamp": "2026-05-14T07:33:00Z",
      "isRead": false,
      "priorityScore": 3017760000
    }
  ],
  "page": 1,
  "limit": 10,
  "hasNextPage": true
}
```

Get one notification:

```http
GET /api/v1/notifications/{notificationId}
```

Mark one notification as read:

```http
PATCH /api/v1/notifications/{notificationId}/read
```

Request:

```json
{
  "isRead": true
}
```

Bulk mark read:

```http
PATCH /api/v1/notifications/read
```

Request:

```json
{
  "notificationIds": [
    "9fba6d0c-6100-4d3d-95f5-bd0c6f7e49c5",
    "83a6d76a-018d-45f8-8578-f2c54694c7b0"
  ],
  "isRead": true
}
```

Create a notification event for one or many students:

```http
POST /api/v1/notifications
```

Request:

```json
{
  "type": "Placement",
  "message": "Amazon.com Inc. hiring",
  "recipientScope": "students",
  "studentIds": [1042, 1043, 1044],
  "channels": ["in_app", "email"],
  "createdBy": "placement-team"
}
```

Response:

```json
{
  "notificationBatchId": "c3ddf5d3-53c7-4c85-94c7-2fb735d8f0f6",
  "acceptedRecipients": 3,
  "status": "queued"
}
```

### JSON Schema Shape

Notification:

```json
{
  "id": "uuid",
  "studentId": "number",
  "type": "Event | Result | Placement",
  "message": "string",
  "timestamp": "ISO-8601 datetime",
  "isRead": "boolean",
  "priorityScore": "number"
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "limit has to be between 5 and 10",
    "details": [{ "field": "limit", "reason": "out_of_range" }]
  }
}
```

### Real-Time Delivery

For in-app updates, use Server-Sent Events when the UI only needs server-to-client notifications:

```http
GET /api/v1/notifications/stream
Authorization: Bearer <access_token>
```

The server publishes an event whenever a new notification is created for the student:

```text
event: notification.created
data: {"id":"...","type":"Placement","message":"Amazon.com Inc. hiring","timestamp":"2026-05-14T07:33:00Z"}
```

SSE is simpler than WebSockets for this use case, reconnects cleanly, and fits notification fanout where the client does not need to send continuous bidirectional messages.

## Stage 2

### Storage Choice

I would use PostgreSQL as the source of truth. Notifications need reliable writes, recipient state, filtering by student and type, pagination by timestamp, and clear transactional boundaries. PostgreSQL gives strong consistency for read/unread state and supports partial indexes that fit the main query paths.

Redis can be added as a cache for unread counts and the newest page, but it should not be the primary store.

### Relational Schema

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');
CREATE TYPE channel_type AS ENUM ('in_app', 'email', 'push');

CREATE TABLE notification_batches (
  id UUID PRIMARY KEY,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  batch_id UUID REFERENCES notification_batches(id),
  student_id BIGINT NOT NULL,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  priority_score BIGINT NOT NULL,
  UNIQUE (batch_id, student_id)
);

CREATE TABLE notification_delivery_attempts (
  id UUID PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id),
  channel channel_type NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### SQL Queries

Unread notifications:

```sql
SELECT id, type, message, created_at, is_read
FROM notifications
WHERE student_id = $1
  AND is_read = false
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

Type-filtered notifications:

```sql
SELECT id, type, message, created_at, is_read
FROM notifications
WHERE student_id = $1
  AND ($2::notification_type IS NULL OR type = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

Mark read:

```sql
UPDATE notifications
SET is_read = true,
    read_at = now()
WHERE student_id = $1
  AND id = $2;
```

Top priority unread notifications:

```sql
SELECT id, type, message, created_at, priority_score
FROM notifications
WHERE student_id = $1
  AND is_read = false
ORDER BY priority_score DESC, created_at DESC
LIMIT $2;
```

### NoSQL Alternative

A DynamoDB-style table can work if the access pattern is fixed:

Partition key: `student_id`

Sort key: `created_at#notification_id`

Attributes: `type`, `message`, `is_read`, `priority_score`

Global secondary index for unread priority:

`GSI1PK = student_id#unread`, `GSI1SK = priority_score#created_at`

This is fast for known queries but less flexible for reporting and ad hoc filters than PostgreSQL.

### Growth Problems

At higher volume, the main pressure points are write amplification during large broadcasts, slow offset pagination on deep pages, unread count contention, and old notification storage. The solutions are batch inserts, cursor pagination, partial indexes, async delivery workers, Redis counters, and monthly partitioning or archival after retention expires.

## Stage 3

Given query:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt ASC;
```

This query is incomplete for "all unread placement notifications in the last 7 days" because it does not filter by `notification_type = 'Placement'` or by a seven-day window. It also sorts oldest-first, while a notification inbox normally needs newest-first.

Correct query:

```sql
SELECT id, type, message, created_at, is_read
FROM notifications
WHERE student_id = 1042
  AND is_read = false
  AND type = 'Placement'
  AND created_at >= now() - interval '7 days'
ORDER BY created_at DESC
LIMIT 50;
```

Without a useful index, the database may scan a large portion of the notifications table, filter rows one by one, then sort the remaining rows. That is roughly `O(n log n)` because of the sort after scanning candidate rows.

With a composite partial index, the query can jump to the right student/type/unread subset and read rows in timestamp order:

```sql
CREATE INDEX idx_notifications_unread_student_type_created
ON notifications (student_id, type, created_at DESC)
WHERE is_read = false;
```

Likely cost becomes `O(log n + k)`, where `k` is the number of returned rows.

Adding indexes on every column is not a good strategy. It increases storage, slows every insert/update, hurts cache locality, and often creates indexes that the optimizer will not use. Indexes should follow access patterns, especially high-cardinality filters and sort columns used together.

Useful supporting indexes:

```sql
CREATE INDEX idx_notifications_student_created
ON notifications (student_id, created_at DESC);

CREATE INDEX idx_notifications_unread_priority
ON notifications (student_id, priority_score DESC, created_at DESC)
WHERE is_read = false;
```

## Stage 4

Fetching all notifications on every page load overloads both the API and database because the same user repeatedly asks for data that usually has not changed.

Recommended approach:

- Client cache the last successful response and render it immediately.
- Use cursor pagination instead of deep offset pagination.
- Add conditional requests with `ETag` or `If-Modified-Since`.
- Add a small unread count endpoint: `GET /notifications/unread-count`.
- Use SSE for new notification events, then fetch only the new item or newest page.
- Cache hot unread-count and first-page queries in Redis with short TTLs.
- Keep database queries narrow with `student_id`, `type`, `is_read`, and `created_at` filters.
- Use request coalescing so multiple browser components do not trigger duplicate fetches.

Tradeoffs:

- SSE adds connection management but greatly reduces wasteful polling.
- Redis improves read load but introduces cache invalidation work.
- Cursor pagination is more stable and faster than offset pagination, but the client must pass a cursor instead of arbitrary page numbers.
- Client caching improves UX but must clearly reconcile stale data when the server reports new events.

## Stage 5

The original synchronous approach has several problems:

- A single email failure interrupts the whole broadcast.
- There is no retry model for the 200 failed students.
- Email, database insert, and app push are tightly coupled.
- A long loop can time out and create partial delivery with no audit trail.
- Re-running the function may duplicate notifications without idempotency.

The reliable design should store the notification first, enqueue delivery jobs, and let workers send email or push independently. The database write and external email send should not happen in one synchronous transaction. The DB is the durable source of truth; email is a side effect with retries.

Revised pseudocode:

```text
function notify_all(student_ids, message, type):
    batch_id = uuid()

    begin transaction
        insert notification_batches(batch_id, type, message, created_by)

        for chunk in chunks(student_ids, 1000):
            bulk insert notifications(
                id=uuid(),
                batch_id=batch_id,
                student_id,
                type,
                message,
                is_read=false,
                priority_score=score(type, now)
            )
            enqueue delivery_job(batch_id, chunk, channels=["email", "push"])
    commit transaction

    return { batch_id, status: "queued" }

worker delivery_job(batch_id, student_ids, channels):
    notifications = fetch notifications by batch_id and student_ids

    for notification in notifications:
        for channel in channels:
            attempt = get_or_create_delivery_attempt(notification.id, channel)
            if attempt.status == "sent":
                continue

            try:
                provider.send(
                    idempotency_key=notification.id + ":" + channel,
                    recipient=notification.student_id,
                    message=notification.message
                )
                mark attempt as sent
            catch temporary_error:
                increment attempt_count
                set next_retry_at = now + exponential_backoff(attempt_count)
                requeue attempt
            catch permanent_error:
                mark attempt as failed
                send to dead_letter_queue
```

If email fails for 200 students midway, only those delivery attempts remain in `retry` or `failed` state. The in-app notifications still exist because they were inserted before delivery. A retry worker can process the failed attempts later without duplicating notifications.

## Stage 6

Priority is determined by type weight and recency. Placement is most important, then Result, then Event. For a stream or in-memory collection, maintain the top `m` notifications with a min-heap. That keeps memory bounded and costs `O(n log m)` instead of sorting everything with `O(n log n)`.

Actual TypeScript implementation:

```ts
type NotificationType = "Event" | "Result" | "Placement";

type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
};

const TYPE_WEIGHT: Record<NotificationType, number> = {
  Event: 1,
  Result: 2,
  Placement: 3
};

const priorityScore = (notification: NotificationItem) => {
  const createdAt = Date.parse(notification.timestamp);
  const safeCreatedAt = Number.isNaN(createdAt) ? 0 : createdAt;

  return TYPE_WEIGHT[notification.type] * 1_000_000_000_000 + safeCreatedAt;
};

class MinHeap {
  private values: NotificationItem[] = [];

  constructor(private readonly limit: number) {}

  push(notification: NotificationItem) {
    if (this.values.length < this.limit) {
      this.values.push(notification);
      this.bubbleUp(this.values.length - 1);
      return;
    }

    if (priorityScore(notification) <= priorityScore(this.values[0])) {
      return;
    }

    this.values[0] = notification;
    this.bubbleDown(0);
  }

  toSortedDescending() {
    return [...this.values].sort(
      (left, right) => priorityScore(right) - priorityScore(left)
    );
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (priorityScore(this.values[parent]) <= priorityScore(this.values[index])) {
        break;
      }

      [this.values[parent], this.values[index]] = [
        this.values[index],
        this.values[parent]
      ];
      index = parent;
    }
  }

  private bubbleDown(index: number) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (
        left < this.values.length &&
        priorityScore(this.values[left]) < priorityScore(this.values[smallest])
      ) {
        smallest = left;
      }

      if (
        right < this.values.length &&
        priorityScore(this.values[right]) < priorityScore(this.values[smallest])
      ) {
        smallest = right;
      }

      if (smallest === index) {
        return;
      }

      [this.values[index], this.values[smallest]] = [
        this.values[smallest],
        this.values[index]
      ];
      index = smallest;
    }
  }
}

export function topPriorityNotifications(
  notifications: NotificationItem[],
  viewedIds: Set<string>,
  m = 10
) {
  const heap = new MinHeap(m);

  for (const notification of notifications) {
    if (!viewedIds.has(notification.id)) {
      heap.push(notification);
    }
  }

  return heap.toSortedDescending();
}
```

New notifications keep coming in through the API or real-time stream. Each new unread notification is pushed into the same heap. When a notification is viewed, remove it from the candidate set and rebuild the heap from the current unread page or stream buffer. For `m = 10`, rebuilding is cheap, and the frontend still avoids storing read state in the backend.

## Stage 7

The React implementation is in `notification_app_fe`. It uses Material UI components, runs on `http://localhost:3000`, fetches the protected API through a Vite localhost proxy, refreshes short-lived bearer tokens from environment variables, logs frontend actions through the logging endpoint, supports `limit`, `page`, and `notification_type`, and keeps viewed/new state in local storage only.
