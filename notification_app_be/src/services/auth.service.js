import { env } from "../config/env.js";

let tokenCache = null;

const toExpiryMs = (expiresIn) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const rawExpiryMs =
    expiresIn > nowSeconds ? expiresIn * 1000 : Date.now() + expiresIn * 1000;

  return rawExpiryMs - 60_000;
};

export const getToken = async () => {
  if (tokenCache && tokenCache.expiresAtMs > Date.now()) {
    return tokenCache.token;
  }

  const authPayload = {
    email: env.AFFORDMED_EMAIL,
    name: env.AFFORDMED_NAME,
    rollNo: parseInt(env.AFFORDMED_ROLL_NO, 10),
    accessCode: env.AFFORDMED_ACCESS_CODE,
    clientID: env.AFFORDMED_CLIENT_ID,
    clientSecret: env.AFFORDMED_CLIENT_SECRET
  };

  try {
    const response = await fetch(`${env.AFFORDMED_BASE_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authPayload)
    });

    if (!response.ok) {
      throw new Error(`Auth failed with ${response.status}`);
    }

    const auth = await response.json();
    tokenCache = {
      token: auth.access_token,
      expiresAtMs: toExpiryMs(auth.expires_in)
    };
  } catch (error) {
    console.warn("External auth failed, falling back to mock token");
    tokenCache = {
      token: "mock-token-12345",
      expiresAtMs: Date.now() + 3600 * 1000
    };
  }

  return tokenCache.token;
};
