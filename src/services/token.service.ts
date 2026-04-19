import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

type TokenPayload = {
  userId?: string;
  adminId?: string;
  email?: string;
  role?: string;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = async (
  userId?: string,
  adminId?: string
): Promise<string> => {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      adminId,
      expiresAt,
    },
  });

  return token;
};

export const verifyRefreshToken = async (
  token: string
): Promise<{ userId?: string; adminId?: string } | null> => {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    if (refreshToken) {
      await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
    }
    return null;
  }

  return {
    userId: refreshToken.userId || undefined,
    adminId: refreshToken.adminId || undefined,
  };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

export const revokeAllAdminTokens = async (adminId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { adminId } });
};

export const cleanupExpiredTokens = async (): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};
