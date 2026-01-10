import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  updateStock,
  deleteProduct
} from "../controllers/product.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/", adminMiddleware, createProduct);
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.patch("/:id", adminMiddleware, updateProduct);
router.patch("/:id/stock", adminMiddleware, updateStock);
router.delete("/:id", adminMiddleware, deleteProduct);

export default router;
