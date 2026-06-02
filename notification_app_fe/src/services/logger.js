export const Log = async (
  level,
  packageName,
  message
) => {
  const payload = {
    stack: "frontend",
    level,
    package: packageName,
    message: message.slice(0, 48)
  };

  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Logging middleware failed", error);
  }
};
