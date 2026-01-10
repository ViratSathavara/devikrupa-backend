import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  createInquiry,
  getUserInquiries,
  getAllInquiries,
  updateInquiryStatus
} from "../controllers/inquiry.controller";

const router = Router();

// User routes
router.post("/", authMiddleware, createInquiry);
router.get("/my-inquiries", authMiddleware, getUserInquiries);

// Admin routes
router.get("/all", adminMiddleware, getAllInquiries);
router.patch("/:id/status", adminMiddleware, updateInquiryStatus);

export default router;
