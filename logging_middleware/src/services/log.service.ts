import axios from "axios";
import { env } from "../config/env.js";
import { getAuthToken } from "./auth.service.js";
import { LogPayload } from "../types/log.types.js";

export const sendLog = async (
  payload: LogPayload
): Promise<void> => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${env.BASE_URL}/evaluation-service/logs`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Log created:", response.data);
  } catch (error: any) {
    console.error(
      "Log Service Error:",
      error.response?.data || error.message
    );
  }
};