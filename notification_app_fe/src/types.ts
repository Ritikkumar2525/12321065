export type NotificationType = "Event" | "Result" | "Placement";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
};

export type NotificationFilters = {
  limit: number;
  page: number;
  notificationType: NotificationType | "All";
};

export type NotificationResponse = {
  notifications: NotificationItem[];
  total?: number;
  page?: number;
  limit?: number;
};

export type AppView = "inbox" | "priority";
