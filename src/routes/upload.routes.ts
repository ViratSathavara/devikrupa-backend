import { Router } from "express";
import { upload } from "../middlewares/upload";
import { uploadImage } from "../controllers/upload.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/image", adminMiddleware, upload.single("image"), uploadImage);

export default router;
