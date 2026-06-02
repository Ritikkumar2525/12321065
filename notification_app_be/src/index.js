import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import notificationsRouter from "./routes/notifications.js";
import logsRouter from "./routes/logs.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/notifications", notificationsRouter);
app.use("/api/logs", logsRouter);

app.listen(env.PORT, () => {
  console.log(`Backend server running on http://localhost:${env.PORT}`);
});
