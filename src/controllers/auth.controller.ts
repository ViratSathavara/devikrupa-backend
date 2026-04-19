import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ConflictError, AuthenticationError, NotFoundError } from "../utils/errors";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../services/token.service";
import { logger } from "../utils/logger";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ConflictError(`User with email "${email}" already exists. Please use a different email or login instead.`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true
    }
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);

  logger.info("User registered successfully", { userId: user.id, email: user.email });

  res.status(201).json({
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);

  logger.info("User logged in successfully", { userId: user.id, email: user.email });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone
    }
  });
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthenticationError("Refresh token is required");
  }

  const tokenData = await verifyRefreshToken(refreshToken);

  if (!tokenData || !tokenData.userId) {
    throw new AuthenticationError("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });

  res.json({
    accessToken,
    user
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  logger.info("User logged out", { userId: (req as any).user?.userId });

  res.json({ message: "Logged out successfully" });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.json({ user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { name, phone } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      updatedAt: true
    }
  });

  logger.info("User profile updated", { userId });

  res.json({
    message: "Profile updated successfully",
    user
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new AuthenticationError("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  logger.info("User password changed", { userId });

  res.json({ message: "Password changed successfully" });
});
