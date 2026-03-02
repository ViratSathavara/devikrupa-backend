import { Router } from "express";
import {
  createTestimonial,
  getTestimonials,
  deleteTestimonial,
} from "../controllers/testimonial.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// Public
router.get("/", getTestimonials);

// Admin only
router.post("/", adminMiddleware, createTestimonial);
router.delete("/:id", adminMiddleware, deleteTestimonial);

export default router;
