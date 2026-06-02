import axios from "axios";
import { env } from "../config/env.js";
import { getAuthToken } from "./auth.service.js";

export const sendLog = async (
  payload
) => {
  try {
    const token = await getAuthToken();

    if (token === "mock-token-12345") {
      console.log("Mock log created (fallback):", payload);
      return;
    }

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
  } catch (error) {
    console.error(
      "Log Service Error:",
      error.response?.data || error.message
    );
  }
};
