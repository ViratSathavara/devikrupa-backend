import { Router } from "express";
import { adminLogin, adminRefreshToken, adminLogout } from "../controllers/adminAuth.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { loginSchema } from "../utils/validation";

const router = Router();

router.post("/login", validateBody(loginSchema), adminLogin);
router.post("/refresh", adminRefreshToken);
router.post("/logout", adminLogout);

export default router;
