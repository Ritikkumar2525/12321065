export type StackType = "backend" | "frontend";

export type LevelType =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export type PackageType =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service"
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style"
  | "auth"
  | "config"
  | "middleware"
  | "utils";

export interface LogPayload {
  stack: StackType;
  level: LevelType;
  package: PackageType;
  message: string;
}