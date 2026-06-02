const notificationTypeWeight = {
  Placement: 3,
  Result: 2,
  Event: 1
};

export const getNotificationTypeWeight = (notification) =>
  notificationTypeWeight[notification.type] ?? 1;

export const getNotificationTimestamp = (notification) => {
  const timestamp = Date.parse(notification.timestamp);

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const getPriorityScore = (notification) =>
  getNotificationTypeWeight(notification) * 1_000_000_000_000 +
  getNotificationTimestamp(notification);

export const getTopPriorityNotifications = (
  notifications,
  viewedIds,
  limit
) =>
  notifications
    .filter((notification) => !viewedIds.has(notification.id))
    .sort((left, right) => {
      const scoreDelta = getPriorityScore(right) - getPriorityScore(left);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return right.id.localeCompare(left.id);
    })
    .slice(0, limit);
