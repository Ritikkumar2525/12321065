import { Router } from "express";
import { env } from "../config/env.js";
import { getToken } from "../services/auth.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const token = await getToken();

    if (token === "mock-token-12345") {
      console.log("Mock log received:", req.body);
      res.status(204).end();
      return;
    }

    const response = await fetch(`${env.AFFORDMED_BASE_URL}/logs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed with ${response.status}`);
    }

    res.status(204).end();
  } catch (error) {
    console.warn("Falling back to mock log submission");
    console.log("Mock log received (fallback):", req.body);
    res.status(204).end();
  }
});

export default router;
