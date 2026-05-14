console.log("Logging middleware started...");import { Log } from "./logger/logger.js";

const startApp = async () => {
  console.log("Application started...");

  await Log(
    "backend",
    "info",
    "service",
    "Logging middleware is working successfully"
  );
};

startApp();