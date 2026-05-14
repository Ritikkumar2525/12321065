import type {
  NotificationFilters,
  NotificationItem,
  NotificationResponse,
  NotificationType
} from "../types";
import { Log } from "./logger";

type RawNotification = {
  ID?: string;
  Id?: string;
  id?: string;
  Type?: string;
  type?: string;
  notificationType?: string;
  notification_type?: string;
  Message?: string;
  message?: string;
  Timestamp?: string;
  timestamp?: string;
  createdAt?: string;
};

type RawNotificationResponse =
  | {
      notifications?: RawNotification[];
      total?: number;
      page?: number;
      limit?: number;
    }
  | RawNotification[];

const supportedNotificationTypes = new Set(["Event", "Result", "Placement"]);

const normalizeType = (value: unknown): NotificationType => {
  const normalized = String(value ?? "").trim();

  if (supportedNotificationTypes.has(normalized)) {
    return normalized as NotificationType;
  }

  return "Event";
};

const normalizeNotification = (item: RawNotification): NotificationItem => ({
  id: String(item.ID ?? item.Id ?? item.id ?? crypto.randomUUID()),
  type: normalizeType(
    item.Type ?? item.type ?? item.notificationType ?? item.notification_type
  ),
  message: String(item.Message ?? item.message ?? "Notification"),
  timestamp: String(item.Timestamp ?? item.timestamp ?? item.createdAt ?? "")
});

export const fetchNotifications = async (
  filters: NotificationFilters
): Promise<NotificationResponse> => {
  const params = new URLSearchParams({
    limit: String(filters.limit),
    page: String(filters.page)
  });

  if (filters.notificationType !== "All") {
    params.set("notification_type", filters.notificationType);
  }

  await Log(
    "info",
    "api",
    `Fetching notifications page=${filters.page}, limit=${filters.limit}, type=${filters.notificationType}`
  );

  const response = await fetch(`/api/notifications?${params.toString()}`);

  if (!response.ok) {
    const detail = await response.text();
    await Log(
      "error",
      "api",
      `Notification API failed with status ${response.status}`
    );
    throw new Error(detail || `Notification API failed with ${response.status}`);
  }

  const payload = (await response.json()) as RawNotificationResponse;
  const rawNotifications = Array.isArray(payload)
    ? payload
    : payload.notifications ?? [];
  const notifications = rawNotifications.map(normalizeNotification);

  await Log(
    "info",
    "api",
    `Fetched ${notifications.length} notifications successfully`
  );

  return {
    notifications,
    total: Array.isArray(payload) ? undefined : payload.total,
    page: Array.isArray(payload) ? filters.page : payload.page ?? filters.page,
    limit: Array.isArray(payload) ? filters.limit : payload.limit ?? filters.limit
  };
};
