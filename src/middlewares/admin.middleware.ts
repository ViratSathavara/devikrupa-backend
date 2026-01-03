import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      adminId: string;
      role: "ADMIN" | "SUPER_ADMIN";
    };

    // ✅ attach admin safely
    (req as any).admin = {
      adminId: decoded.adminId,
      role: decoded.role
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
