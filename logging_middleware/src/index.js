import { connectMongo, closeMongo } from "./config/mongo.js";
import { Log } from "./logger/logger.js";

const startApp = async () => {
  console.log("Logging middleware started...");

  await connectMongo();

  console.log("Application started...");

  await Log(
    "backend",
    "info",
    "service",
    "Logging middleware is working successfully"
  );
};

startApp().catch(async (error) => {
  console.error("Application startup failed:", error);
  await closeMongo();
  process.exit(1);
});
