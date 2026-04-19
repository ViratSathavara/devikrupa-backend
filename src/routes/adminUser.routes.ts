import { Router } from "express";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/adminUser.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { z } from "zod";

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number").optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number").optional().nullable(),
});

// All routes require admin authentication
router.use(adminMiddleware);

// Get user statistics
router.get("/stats", getUserStats);

// Get all users (with pagination and search)
router.get("/", getAllUsers);

// Get single user by ID
router.get("/:id", getUserById);

// Create new user
router.post("/", validateBody(createUserSchema), createUser);

// Update user
router.put("/:id", validateBody(updateUserSchema), updateUser);

// Delete user
router.delete("/:id", deleteUser);

export default router;
