import { Router } from "express";
import {
  checkPageConstructionSetting,
  getPageConstructionSettings,
  updatePageConstructionSetting,
} from "../controllers/pageConstruction.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/check", checkPageConstructionSetting);
router.get("/", getPageConstructionSettings);
router.patch("/:id", adminMiddleware, updatePageConstructionSetting);

export default router;
