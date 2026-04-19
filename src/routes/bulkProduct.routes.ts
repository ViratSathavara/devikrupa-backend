import { Router } from "express";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { bulkProductAction, exportInquiries } from "../controllers/bulkProduct.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { bulkProductActionSchema } from "../utils/validation";

const router = Router();

router.post("/bulk-action", adminMiddleware, validateBody(bulkProductActionSchema), bulkProductAction);
router.get("/export-inquiries", adminMiddleware, exportInquiries);

export default router;
