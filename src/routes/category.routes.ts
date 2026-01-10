import { Router } from "express";
import {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory
} from "../controllers/category.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/", adminMiddleware, createCategory);
router.get("/", getCategories);
router.put("/:id", adminMiddleware, updateCategory);
router.delete("/:id", adminMiddleware, deleteCategory);


export default router;
