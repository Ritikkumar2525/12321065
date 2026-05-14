export const formatDateTime = (value: string) => {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value || "No timestamp";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
};

export const formatRelativeTime = (value: string) => {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const relativeFormatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto"
  });

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  return relativeFormatter.format(Math.round(diffHours / 24), "day");
};
