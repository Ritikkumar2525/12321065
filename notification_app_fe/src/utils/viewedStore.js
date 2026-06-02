const viewedKey = "campus-notifications-viewed-ids";

export const loadViewedIds = () => {
  try {
    const rawValue = localStorage.getItem(viewedKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return new Set(parsedValue);
  } catch {
    return new Set();
  }
};

export const saveViewedIds = (viewedIds) => {
  localStorage.setItem(viewedKey, JSON.stringify([...viewedIds]));
};
