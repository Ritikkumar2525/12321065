import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  AFFORDMED_BASE_URL: process.env.AFFORDMED_BASE_URL || "http://4.224.186.213/evaluation-service",
  AFFORDMED_EMAIL: process.env.AFFORDMED_EMAIL || "",
  AFFORDMED_NAME: process.env.AFFORDMED_NAME || "",
  AFFORDMED_ROLL_NO: process.env.AFFORDMED_ROLL_NO || "",
  AFFORDMED_ACCESS_CODE: process.env.AFFORDMED_ACCESS_CODE || "",
  AFFORDMED_CLIENT_ID: process.env.AFFORDMED_CLIENT_ID || "",
  AFFORDMED_CLIENT_SECRET: process.env.AFFORDMED_CLIENT_SECRET || ""
};
