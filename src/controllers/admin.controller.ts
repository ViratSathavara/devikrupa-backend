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
