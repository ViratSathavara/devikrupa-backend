import { Router } from "express";
import {
  createTestimonial,
  getTestimonials,
  deleteTestimonial,
} from "../controllers/testimonial.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// Public
router.post("/", createTestimonial);
router.get("/", getTestimonials);

// Admin only
router.delete("/:id", adminMiddleware, deleteTestimonial);

export default router;
