import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ConflictError, AuthenticationError, NotFoundError, BadRequestError } from "../utils/errors";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../services/token.service";
import { logger } from "../utils/logger";
import { emailService } from "../services/email.service";
import { generateOTP, getOTPExpiry, verifyOTP } from "../utils/otp.util";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ConflictError(`User with email "${email}" already exists. Please use a different email or login instead.`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = getOTPExpiry();

  // Create user with unverified email
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      isEmailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiry: otpExpiry
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  // Send OTP email
  const emailSent = await emailService.sendOTPEmail(email, otp, name);

  if (!emailSent) {
    logger.error("Failed to send OTP email", { userId: user.id, email });
    // Don't fail the signup, but log the error
  }

  logger.info("User registered, OTP sent", { userId: user.id, email: user.email });

  res.status(201).json({
    message: "User registered successfully. Please verify your email with the OTP sent to your email address.",
    user,
    requiresEmailVerification: true
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

  // Check if email is verified
  if (!user.isEmailVerified) {
    // Generate new OTP if needed
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: otp,
        emailVerificationOtpExpiry: otpExpiry
      }
    });

    // Send OTP email
    await emailService.sendOTPEmail(email, otp, user.name);

    return res.status(403).json({
      message: "Email not verified. A new OTP has been sent to your email.",
      requiresEmailVerification: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified
      }
    });
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

export const verifyEmailOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new BadRequestError("Email and OTP are required");
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.isEmailVerified) {
    return res.json({
      message: "Email already verified",
      alreadyVerified: true
    });
  }

  // Verify OTP
  const otpVerification = verifyOTP(
    otp,
    user.emailVerificationOtp,
    user.emailVerificationOtpExpiry
  );

  if (!otpVerification.valid) {
    throw new BadRequestError(otpVerification.message || "Invalid OTP");
  }

  // Update user as verified and clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationOtp: null,
      emailVerificationOtpExpiry: null
    }
  });

  // Send welcome email
  await emailService.sendWelcomeEmail(email, user.name);

  // Generate tokens for automatic login
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);

  logger.info("Email verified successfully", { userId: user.id, email });

  res.json({
    message: "Email verified successfully",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isEmailVerified: true
    }
  });
});

export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.isEmailVerified) {
    return res.json({
      message: "Email already verified",
      alreadyVerified: true
    });
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = getOTPExpiry();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationOtp: otp,
      emailVerificationOtpExpiry: otpExpiry
    }
  });

  // Send OTP email
  const emailSent = await emailService.sendOTPEmail(email, otp, user.name);

  if (!emailSent) {
    logger.error("Failed to resend OTP email", { userId: user.id, email });
    throw new Error("Failed to send OTP email. Please try again later.");
  }

  logger.info("OTP resent successfully", { userId: user.id, email });

  res.json({
    message: "OTP sent successfully to your email"
  });
});
