import { AdminRole } from "@prisma/client";
import { SupportedLanguage } from "../services/languageDetection.service";

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
      requestedLanguage?: SupportedLanguage;
    }
  }
}

export {};
