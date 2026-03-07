import dotenv from "dotenv";
dotenv.config();

const parseCsv = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:4000",
  "https://devikrupaelectricals.in",
  "https://www.devikrupaelectricals.in",
  "https://admin.devikrupaelectricals.in",
  "https://*.devikrupaelectricals.in",
];

const CORS_ORIGINS = Array.from(
  new Set([...DEFAULT_CORS_ORIGINS, ...parseCsv(process.env.CORS_ORIGINS)])
);

export const ENV = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
  CORS_ORIGINS,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};
