import { Request, Response } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import { AdminRequest } from "../types/admin-request";

/**
 * CREATE ADMIN (SUPER ADMIN ONLY)
 */
export const createAdmin = async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (!adminReq.admin || adminReq.admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Only Super Admin allowed" });
  }

  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json(admin);
};

/**
 * GET ADMINS
 */
export const getAdmins = async (_req: Request, res: Response) => {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.json(admins);
};

/**
 * GET ADMIN BY ID
 */
export const getAdminById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const admin = await prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  res.json(admin);
};

/**
 * UPDATE ADMIN
 */
export const updateAdmin = async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (!adminReq.admin || adminReq.admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Only Super Admin allowed" });
  }

  const { id } = req.params;
  const { name, email, password, role } = req.body;

  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);

  const updatedAdmin = await prisma.admin.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.json(updatedAdmin);
};


/**
 * DELETE ADMIN (SUPER ADMIN ONLY)
 */
export const deleteAdmin = async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (!adminReq.admin || adminReq.admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Only Super Admin allowed" });
  }

  const { id } = req.params;

  await prisma.admin.delete({ where: { id } });

  res.json({ message: "Admin deleted successfully" });
};

export const dashboardCardsItem = async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (!adminReq.admin || adminReq.admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Only Super Admin allowed" });
  }

  try {
    const [
      productsCount,
      categoriesCount,
      inquiriesCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.inquiry.count(),
    ]);

    return res.json([
      {
        name: "products",
        count: productsCount,
      },
      {
        name: "categories",
        count: categoriesCount,
      },
      {
        name: "inquiries",
        count: inquiriesCount,
      },
    ]);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res
      .status(500)
      .json({ message: "Failed to load dashboard data" });
  }
};