import { AdminRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        adminId: string;
        role: AdminRole;
      };
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
