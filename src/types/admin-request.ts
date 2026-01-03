import { Request } from "express";
import { AdminRole } from "@prisma/client";

export interface AdminRequest extends Request {
  admin: {
    adminId: string;
    role: AdminRole;
  };
}
