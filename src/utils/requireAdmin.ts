import { Request } from "express";

export function requireAdmin(req: Request) {
  if (!req.admin) {
    throw new Error("Admin not authenticated");
  }
  return req.admin;
}
