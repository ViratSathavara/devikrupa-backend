import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getUserInquiries, getUserServiceInquiries, getInquiryNotifications } from "../controllers/user.controller";

const router = Router();

router.get("/inquiries", authMiddleware, getUserInquiries);
router.get("/service-inquiries", authMiddleware, getUserServiceInquiries);
router.get("/inquiry-notifications", authMiddleware, getInquiryNotifications);

export default router;
