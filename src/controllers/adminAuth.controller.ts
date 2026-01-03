import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({
    where: { email }
  });

  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, admin.password);

  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      adminId: admin.id,
      role: admin.role
    },
    ENV.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }
  });
};
