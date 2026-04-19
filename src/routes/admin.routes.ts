import { Router } from "express";
import {
  createAdmin,
  getAdmins,
  deleteAdmin,
  dashboardCardsItem,
  getAdminById,
  updateAdmin
} from "../controllers/admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/", adminMiddleware, createAdmin);
router.get("/", adminMiddleware, getAdmins);
router.get("/admin/:id", adminMiddleware, getAdminById);
router.put("/admin/:id", adminMiddleware, updateAdmin);
router.delete("/:id", adminMiddleware, deleteAdmin);
router.get("/dashboard/cards", adminMiddleware, dashboardCardsItem);

export default router;
