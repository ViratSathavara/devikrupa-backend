import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors, { CorsOptions } from "cors";
import { ENV } from "./config/env";
import { seedDefaultAdmin } from "./utils/seedAdmin";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import adminAuthRoutes from "./routes/adminAuth.routes";
import adminRoutes from "./routes/admin.routes";
import inquiryRoutes from "./routes/inquiry.routes";
import serviceInquiryRoutes from "./routes/serviceInquiry.routes";
import favoriteRoutes from "./routes/favorite.routes";
import testimonialRoutes from "./routes/testimonial.routes";
import uploadRoutes from "./routes/upload.routes";
import pageConstructionRoutes from "./routes/pageConstruction.routes";
import chatRoutes from "./routes/chat.routes";
import productSearchRoutes from "./routes/productSearch.routes";
import userRoutes from "./routes/user.routes";
import bulkProductRoutes from "./routes/bulkProduct.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import activityLogRoutes from "./routes/activityLog.routes";
import adminUserRoutes from "./routes/adminUser.routes";
import { securityHeadersMiddleware } from "./middlewares/security.middleware";
import {
  adminAuthRateLimiter,
  userAuthRateLimiter,
  aiChatRateLimiter,
} from "./middlewares/rateLimit.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware";
import { initializeSocketServer } from "./lib/socket";
import aiRoutes from "./routes/ai.routes";
import { languageMiddleware } from "./middlewares/language.middleware";
import translationRoutes from "./routes/translation.routes";
import { logger } from "./utils/logger";
import { cleanupExpiredTokens } from "./services/token.service";

const app = express();
require("dotenv").config();
const LOCALHOST_HOSTNAMES = new Set(["localhost", "www.localhost", "127.0.0.1", "::1", "0.0.0.0"]);
const PRIVATE_IPV4_HOSTNAME_REGEX =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
const WILDCARD_ORIGIN_REGEX = /^(https?):\/\/\*\.(.+)$/i;

type WildcardOriginRule = {
  protocol: "http:" | "https:";
  hostnameSuffix: string;
};

const normalizeOrigin = (origin: string): string | null => {
  try {
    const parsed = new URL(origin);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    const defaultPort = protocol === "https:" ? "443" : "80";
    const hasCustomPort = parsed.port !== "" && parsed.port !== defaultPort;
    const normalizedPort = hasCustomPort ? `:${parsed.port}` : "";

    return `${protocol}//${hostname}${normalizedPort}`;
  } catch {
    return null;
  }
};

const wildcardOriginRules: WildcardOriginRule[] = [];
const exactAllowedOrigins = new Set<string>();

for (const configuredOrigin of ENV.CORS_ORIGINS) {
  const wildcardMatch = configuredOrigin.match(WILDCARD_ORIGIN_REGEX);
  if (wildcardMatch) {
    wildcardOriginRules.push({
      protocol: `${wildcardMatch[1].toLowerCase()}:` as WildcardOriginRule["protocol"],
      hostnameSuffix: wildcardMatch[2].toLowerCase(),
    });
    continue;
  }

  const normalizedOrigin = normalizeOrigin(configuredOrigin);
  if (normalizedOrigin) {
    exactAllowedOrigins.add(normalizedOrigin);
  }
}

const isOriginAllowed = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  const parsedOrigin = new URL(normalizedOrigin);
  if (LOCALHOST_HOSTNAMES.has(parsedOrigin.hostname)) {
    return true;
  }

  const isPrivateNetworkHost =
    PRIVATE_IPV4_HOSTNAME_REGEX.test(parsedOrigin.hostname) ||
    parsedOrigin.hostname.endsWith(".local");
  if (isPrivateNetworkHost) {
    return true;
  }

  if (exactAllowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  return wildcardOriginRules.some((rule) => {
    if (parsedOrigin.protocol !== rule.protocol) {
      return false;
    }

    return (
      parsedOrigin.hostname === rule.hostnameSuffix ||
      parsedOrigin.hostname.endsWith(`.${rule.hostnameSuffix}`)
    );
  });
};

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204,
};

/* Middlewares */
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(languageMiddleware);
app.use("/api/ai", aiChatRateLimiter, aiRoutes);

/* Routes */
app.use("/api/auth", userAuthRateLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products", productSearchRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/auth", adminAuthRateLimiter, adminAuthRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/admin/bulk", bulkProductRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/activity-logs", activityLogRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/service-inquiries", serviceInquiryRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/page-settings", pageConstructionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api/users", userRoutes);

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof Error && error.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({
      message: "CORS blocked for this origin",
      origin: req.headers.origin ?? null,
    });
  }

  return next(error);
});

/* Error Handlers */
app.use(notFoundHandler);
app.use(errorHandler);

/* Health Check */
app.get("/", (_, res) => {
  res.send("Devikrupa Backend is running 🚀");
});

const httpServer = createServer(app);
initializeSocketServer(httpServer, corsOptions);

httpServer.listen(ENV.PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${ENV.PORT}`);
  
  // Seed default admin
  seedDefaultAdmin();
  
  // Cleanup expired tokens every hour
  setInterval(() => {
    cleanupExpiredTokens().catch((err) => {
      logger.error("Failed to cleanup expired tokens", { error: err });
    });
  }, 60 * 60 * 1000);
});
