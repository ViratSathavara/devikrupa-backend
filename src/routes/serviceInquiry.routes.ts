import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  createServiceInquiry,
  getUserServiceInquiries,
  getAllServiceInquiries,
  updateServiceInquiryStatus
} from "../controllers/serviceInquiry.controller";

const router = Router();

// User routes
router.post("/", authMiddleware, createServiceInquiry);
router.get("/my-inquiries", authMiddleware, getUserServiceInquiries);

// Admin routes
router.get("/all", adminMiddleware, getAllServiceInquiries);
router.patch("/:id/status", adminMiddleware, updateServiceInquiryStatus);

export default router;
