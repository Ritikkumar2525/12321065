import { Router } from "express";
import { env } from "../config/env.js";
import { getToken } from "../services/auth.service.js";

const router = Router();

const mockNotifications = [
  {
    id: "9fba6d0c-6100-4d3d-95f5-bd0c6f7e49c5",
    studentId: 1042,
    type: "Placement",
    message: "Amazon.com Inc. hiring for SDE-1",
    timestamp: new Date().toISOString(),
    isRead: false,
    priorityScore: 3017760000
  },
  {
    id: "5b8f9e2d-3a1b-4e6c-9d8e-1f2a3b4c5d6e",
    studentId: 1042,
    type: "Alert",
    message: "Library books due tomorrow",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    priorityScore: 2517760000
  },
  {
    id: "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    studentId: 1042,
    type: "Event",
    message: "Annual Tech Symposium starts next week",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
    priorityScore: 1017760000
  },
  {
    id: "83a6d76a-018d-45f8-8578-f2c54694c7b0",
    studentId: 1042,
    type: "Result",
    message: "Semester 6 results declared",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    priorityScore: 2017760000
  },
  {
    id: "f1e2d3c4-b5a6-9f8e-7d6c-5b4a39281726",
    studentId: 1042,
    type: "Alert",
    message: "Hostel fee payment deadline approaching",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
    priorityScore: 2217760000
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    studentId: 1042,
    type: "Placement",
    message: "Google coding round scheduled",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    isRead: true,
    priorityScore: 3517760000
  },
  {
    id: "d4c3b2a1-6f5e-b8a7-d0c9-d6c5b4a3f2e1",
    studentId: 1042,
    type: "Event",
    message: "Alumni meet & greet tonight at auditorium",
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    isRead: true,
    priorityScore: 1217760000
  },
  {
    id: "4d3c2b1a-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    studentId: 1042,
    type: "Result",
    message: "Mid-semester marks updated for CS301",
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    isRead: true,
    priorityScore: 1517760000
  }
];

router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    if (token === "mock-token-12345") {
      res.json({
        notifications: mockNotifications,
        page: 1,
        limit: 10,
        hasNextPage: false
      });
      return;
    }

    const upstreamUrl = new URL(`${env.AFFORDMED_BASE_URL}/notifications`);

    ["limit", "page", "notification_type"].forEach((key) => {
      const value = req.query[key];
      if (value) {
        upstreamUrl.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed with ${response.status}`);
    }

    const body = await response.text();

    res.status(response.status)
      .set("Content-Type", response.headers.get("content-type") || "application/json")
      .send(body);
  } catch (error) {
    console.warn("Falling back to mock notifications data");
    res.json({
      notifications: mockNotifications,
      page: 1,
      limit: 10,
      hasNextPage: false
    });
  }
});

export default router;
