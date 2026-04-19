import { Router } from "express";
import {
  createTestimonial,
  getTestimonials,
  getAllTestimonials,
  approveTestimonial,
  deleteTestimonial,
} from "../controllers/testimonial.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// Public
router.post("/", createTestimonial);
router.get("/", getTestimonials);

// Admin only
router.get("/all", adminMiddleware, getAllTestimonials);
router.patch("/:id/approve", adminMiddleware, approveTestimonial);
router.delete("/:id", adminMiddleware, deleteTestimonial);

export default router;
