import axios from "axios";
import { env } from "../config/env.js";

export const getAuthToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${env.BASE_URL}/evaluation-service/auth`,
      {
        email: env.EMAIL,
        name: env.NAME,
        rollNo: env.ROLL_NO,
        accessCode: env.ACCESS_CODE,
        clientID: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "Authentication Error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to generate auth token");
  }
};