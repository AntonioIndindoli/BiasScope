import { checkPrisma } from "../db/prisma.js";
import { checkRedis } from "../db/redis.js";

export const healthService = {
  liveness() {
    return {
      ok: true,
      service: "backend",
      timestamp: new Date().toISOString(),
    };
  },

  async readiness() {
    const started = Date.now();

    const [db, redis] = await Promise.allSettled([checkPrisma(), checkRedis()]);

    const dbOk = db.status === "fulfilled";
    const redisOk = redis.status === "fulfilled";
    const ok = dbOk && redisOk;

    return {
      ok,
      service: "backend",
      dependencies: {
        db: dbOk ? { ok: true } : { ok: false, error: db.reason?.message },
        redis: redisOk
          ? { ok: true }
          : { ok: false, error: redis.reason?.message },
      },
      durationMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    };
  },
};