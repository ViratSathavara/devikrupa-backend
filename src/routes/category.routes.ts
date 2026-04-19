import { Router } from "express";
import {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  importCategories,
} from "../controllers/category.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/", adminMiddleware, createCategory);
router.post(
  "/upload",
  adminMiddleware,
  upload.single("file"),
  importCategories
);
router.get("/", getCategories);
router.put("/:id", adminMiddleware, updateCategory);
router.delete("/:id", adminMiddleware, deleteCategory);

export default router;
