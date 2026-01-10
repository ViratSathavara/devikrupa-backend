import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
};
