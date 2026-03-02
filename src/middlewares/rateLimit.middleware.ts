import { NextFunction, Request, Response } from "express";

type LimitOptions = {
  max: number;
  windowMs: number;
  message: string;
};

type Entry = {
  count: number;
  resetAt: number;
};

const buildKey = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  if (req.ip) {
    return req.ip;
  }

  return "unknown";
};

const createRateLimiter = ({ max, windowMs, message }: LimitOptions) => {
  const store = new Map<string, Entry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = buildKey(req);

    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      return res.status(429).json({ message });
    }

    current.count += 1;
    store.set(key, current);
    return next();
  };
};

export const userAuthRateLimiter = createRateLimiter({
  max: 25,
  windowMs: 15 * 60 * 1000,
  message: "Too many auth requests. Please try again later.",
});

export const adminAuthRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many admin login attempts. Please try again later.",
});
