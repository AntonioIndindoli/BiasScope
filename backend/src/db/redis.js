import { createClient } from "redis";
import { env } from "../config/env.js";

let redis;

export function getRedis() {
  if (!redis) {
    redis = createClient({ url: env.REDIS_URL });
    redis.on("error", (err) => console.error("Redis error:", err.message));
  }
  return redis;
}

export async function connectRedis() {
  const client = getRedis();
  if (!client.isOpen) await client.connect();
  return client;
}

export async function checkRedis() {
  const client = await connectRedis();
  const pong = await client.ping();
  if (pong !== "PONG") throw new Error("Unexpected Redis ping response");
  return { ok: true };
}

export async function disconnectRedis() {
  if (redis?.isOpen) await redis.quit();
}