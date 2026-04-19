import { Router } from "express";
import { searchProducts, getRelatedProducts } from "../controllers/productSearch.controller";
import { validateQuery } from "../middlewares/validate.middleware";
import { productFilterSchema } from "../utils/validation";

const router = Router();

router.get("/search", validateQuery(productFilterSchema), searchProducts);
router.get("/:productId/related", getRelatedProducts);

export default router;
