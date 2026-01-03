import { Router } from "express";
import {
  createAdmin,
  getAdmins,
  deleteAdmin
} from "../controllers/admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/", adminMiddleware, createAdmin);
router.get("/", adminMiddleware, getAdmins);
router.delete("/:id", adminMiddleware, deleteAdmin);

export default router;
