import { Router } from "express";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  getDashboardStats,
  getInquiriesOverTime,
  getTopProducts,
  getUserSignups,
} from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", adminMiddleware, getDashboardStats);
router.get("/inquiries-over-time", adminMiddleware, getInquiriesOverTime);
router.get("/top-products", adminMiddleware, getTopProducts);
router.get("/user-signups", adminMiddleware, getUserSignups);

export default router;
