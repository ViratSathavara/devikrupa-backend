import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  deleteProduct
} from "../controllers/product.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/", adminMiddleware, createProduct);
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.delete("/:id", adminMiddleware, deleteProduct);

export default router;
