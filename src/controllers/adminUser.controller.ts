import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError, NotFoundError, ConflictError } from "../utils/errors";
import { logActivity } from "../services/activityLog.service";
import { logger } from "../utils/logger";

// Get all users with pagination and filters
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { email: { contains: search as string, mode: "insensitive" } },
      { phone: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inquiries: true,
            serviceInquiries: true,
            favoriteProducts: true,
          },
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// Get single user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      inquiries: {
        select: {
          id: true,
          message: true,
          status: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              name_en: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      serviceInquiries: {
        select: {
          id: true,
          productName: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          inquiries: true,
          serviceInquiries: true,
          favoriteProducts: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.json({ user });
});

// Create new user (admin)
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  const adminId = (req as any).admin.adminId;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError(`User with email "${email}" already exists`);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  // Log activity
  await logActivity({
    adminId,
    action: "CREATE_USER",
    entityType: "User",
    entityId: user.id,
    details: { email: user.email, name: user.name },
    req,
  });

  logger.info("User created by admin", { userId: user.id, adminId });

  res.status(201).json({
    message: "User created successfully",
    user,
  });
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, password } = req.body;
  const adminId = (req as any).admin.adminId;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    });

    if (emailTaken) {
      throw new ConflictError(`Email "${email}" is already taken`);
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone || null;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      updatedAt: true,
    },
  });

  // Log activity
  await logActivity({
    adminId,
    action: "UPDATE_USER",
    entityType: "User",
    entityId: user.id,
    details: { updates: Object.keys(updateData) },
    req,
  });

  logger.info("User updated by admin", { userId: user.id, adminId });

  res.json({
    message: "User updated successfully",
    user,
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = (req as any).admin.adminId;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id },
  });

  // Log activity
  await logActivity({
    adminId,
    action: "DELETE_USER",
    entityType: "User",
    entityId: id,
    details: { email: user.email, name: user.name },
    req,
  });

  logger.info("User deleted by admin", { userId: id, adminId });

  res.json({
    message: "User deleted successfully",
  });
});

// Get user statistics
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const [totalUsers, activeUsers, usersWithInquiries, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        inquiries: {
          some: {},
        },
      },
    }),
    prisma.user.count({
      where: {
        inquiries: {
          some: {
            status: { in: ["NEW", "CONTACTED"] },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    usersWithInquiries,
    recentUsers,
  });
});
