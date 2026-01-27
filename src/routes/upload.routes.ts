import { Router } from "express";
import { upload } from "../middlewares/upload";
import { uploadImage } from "../controllers/upload.controller";

const router = Router();

router.post("/image", upload.single("image"), uploadImage);

export default router;
