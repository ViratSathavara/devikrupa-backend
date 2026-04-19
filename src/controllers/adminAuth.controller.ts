import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticationError, NotFoundError } from "../utils/errors";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../services/token.service";
import { logger } from "../utils/logger";

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new AuthenticationError("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, admin.password);

  if (!isValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  const accessToken = generateAccessToken({
    adminId: admin.id,
    role: admin.role,
  });
  const refreshToken = await generateRefreshToken(undefined, admin.id);

  logger.info("Admin logged in successfully", { adminId: admin.id, email: admin.email });

  return res.json({
    accessToken,
    refreshToken,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

export const adminRefreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthenticationError("Refresh token is required");
  }

  const tokenData = await verifyRefreshToken(refreshToken);

  if (!tokenData || !tokenData.adminId) {
    throw new AuthenticationError("Invalid or expired refresh token");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: tokenData.adminId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  const accessToken = generateAccessToken({ adminId: admin.id, role: admin.role });

  res.json({
    accessToken,
    admin
  });
});

export const adminLogout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  logger.info("Admin logged out", { adminId: (req as any).admin?.adminId });

  res.json({ message: "Logged out successfully" });
});
