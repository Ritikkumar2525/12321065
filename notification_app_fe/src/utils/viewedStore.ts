const viewedKey = "campus-notifications-viewed-ids";

export const loadViewedIds = () => {
  try {
    const rawValue = localStorage.getItem(viewedKey);
    const parsedValue = rawValue ? (JSON.parse(rawValue) as string[]) : [];

    return new Set(parsedValue);
  } catch {
    return new Set<string>();
  }
};

export const saveViewedIds = (viewedIds: Set<string>) => {
  localStorage.setItem(viewedKey, JSON.stringify([...viewedIds]));
};
