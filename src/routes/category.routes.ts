import { Router } from "express";
import {
  createCategory,
  getCategories,
  deleteCategory
} from "../controllers/category.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/", adminMiddleware, createCategory);
router.get("/", getCategories);
router.delete("/:id", adminMiddleware, deleteCategory);

export default router;
