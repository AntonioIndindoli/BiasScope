// src/server.js
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectRedis, disconnectRedis } from "./db/redis.js";
import { disconnectPrisma } from "./db/prisma.js";

const app = createApp();
const server = app.listen(env.PORT, async () => {
  console.log(`API running on port ${env.PORT}`);
  // optional eager warm-up
  await connectRedis().catch((err) => {
    console.error("Redis warm-up failed:", err.message);
  });
});

async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down...`);
  server.close(async () => {
    await Promise.allSettled([disconnectPrisma(), disconnectRedis()]);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));