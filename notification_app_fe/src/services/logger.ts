type StackType = "frontend";
type LevelType = "debug" | "info" | "warn" | "error" | "fatal";
type PackageType =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style"
  | "auth"
  | "config"
  | "utils";

type LogPayload = {
  stack: StackType;
  level: LevelType;
  package: PackageType;
  message: string;
};

export const Log = async (
  level: LevelType,
  packageName: PackageType,
  message: string
) => {
  const payload: LogPayload = {
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
