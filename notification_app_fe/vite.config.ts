import react from "@vitejs/plugin-react";
import {
  defineConfig,
  loadEnv,
  type Plugin,
  type PreviewServer,
  type ViteDevServer
} from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

type AuthResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type TokenCache = {
  token: string;
  expiresAtMs: number;
};

type DevEnv = {
  VITE_AFFORDMED_BASE_URL?: string;
  VITE_AFFORDMED_EMAIL?: string;
  VITE_AFFORDMED_NAME?: string;
  VITE_AFFORDMED_ROLL_NO?: string;
  VITE_AFFORDMED_ACCESS_CODE?: string;
  VITE_AFFORDMED_CLIENT_ID?: string;
  VITE_AFFORDMED_CLIENT_SECRET?: string;
};

const json = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const readBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const toExpiryMs = (expiresIn: number) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const rawExpiryMs =
    expiresIn > nowSeconds ? expiresIn * 1000 : Date.now() + expiresIn * 1000;

  return rawExpiryMs - 60_000;
};

const getOriginalUrl = (req: IncomingMessage) => {
  const requestWithOriginal = req as IncomingMessage & { originalUrl?: string };

  return requestWithOriginal.originalUrl ?? req.url ?? "/";
};

const attachEvaluationApiRoutes = (server: ViteDevServer | PreviewServer) => {
  const env = loadEnv(server.config.mode, process.cwd(), "") as DevEnv;
  const baseUrl =
    env.VITE_AFFORDMED_BASE_URL ?? "http://4.224.186.213/evaluation-service";
  let tokenCache: TokenCache | null = null;

  const getToken = async () => {
    if (tokenCache && tokenCache.expiresAtMs > Date.now()) {
      return tokenCache.token;
    }

    const authPayload = {
      email: env.VITE_AFFORDMED_EMAIL,
      name: env.VITE_AFFORDMED_NAME,
      rollNo: env.VITE_AFFORDMED_ROLL_NO,
      accessCode: env.VITE_AFFORDMED_ACCESS_CODE,
      clientID: env.VITE_AFFORDMED_CLIENT_ID,
      clientSecret: env.VITE_AFFORDMED_CLIENT_SECRET
    };

    const missingKeys = Object.entries(authPayload)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      throw new Error(`Missing AffordMed env values: ${missingKeys.join(", ")}`);
    }

    const response = await fetch(`${baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authPayload)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Auth failed with ${response.status}: ${detail}`);
    }

    const auth = (await response.json()) as AuthResponse;
    tokenCache = {
      token: auth.access_token,
      expiresAtMs: toExpiryMs(auth.expires_in)
    };

    return tokenCache.token;
  };

  server.middlewares.use("/api/notifications", async (req, res) => {
    if (req.method !== "GET") {
      json(res, 405, { message: "Method not allowed" });
      return;
    }

    try {
      const token = await getToken();
      const requestUrl = new URL(getOriginalUrl(req), "http://localhost:3000");
      const upstreamUrl = new URL(`${baseUrl}/notifications`);

      ["limit", "page", "notification_type"].forEach((key) => {
        const value = requestUrl.searchParams.get(key);
        if (value) {
          upstreamUrl.searchParams.set(key, value);
        }
      });

      const response = await fetch(upstreamUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.text();

      res.statusCode = response.status;
      res.setHeader(
        "Content-Type",
        response.headers.get("content-type") ?? "application/json"
      );
      res.end(body);
    } catch (error) {
      json(res, 502, {
        message: error instanceof Error ? error.message : "Notification fetch failed"
      });
    }
  });

  server.middlewares.use("/api/logs", async (req, res) => {
    if (req.method !== "POST") {
      json(res, 405, { message: "Method not allowed" });
      return;
    }

    try {
      const token = await getToken();
      const body = await readBody(req);
      const response = await fetch(`${baseUrl}/logs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body
      });

      if (!response.ok) {
        const detail = await response.text();
        json(res, response.status, { message: detail });
        return;
      }

      res.statusCode = 204;
      res.end();
    } catch (error) {
      json(res, 502, {
        message: error instanceof Error ? error.message : "Log submission failed"
      });
    }
  });
};

const evaluationApiPlugin = (): Plugin => ({
  name: "evaluation-api-proxy",
  configureServer(server: ViteDevServer) {
    attachEvaluationApiRoutes(server);
  },
  configurePreviewServer(server: PreviewServer) {
    attachEvaluationApiRoutes(server);
  }
});

export default defineConfig({
  plugins: [react(), evaluationApiPlugin()],
  server: {
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 3000,
    strictPort: true
  }
});
