import axios from "axios";
import { env } from "../config/env.js";

export const getAuthToken = async () => {
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
  } catch (error) {
    console.warn("Authentication Error (fallback to mock):", error.response?.data || error.message);
    return "mock-token-12345";
  }
};
