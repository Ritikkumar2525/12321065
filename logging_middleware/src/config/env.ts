import dotenv from "dotenv";

dotenv.config();

export const env = {
  BASE_URL: process.env.BASE_URL || "",

  EMAIL: process.env.EMAIL || "",
  NAME: process.env.NAME || "",
  ROLL_NO: process.env.ROLL_NO || "",
  ACCESS_CODE: process.env.ACCESS_CODE || "",

  CLIENT_ID: process.env.CLIENT_ID || "",
  CLIENT_SECRET: process.env.CLIENT_SECRET || ""
};