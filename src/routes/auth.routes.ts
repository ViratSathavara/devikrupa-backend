import { Router } from "express";
import { 
  login, 
  signup, 
  refreshAccessToken, 
  logout, 
  getProfile, 
  updateProfile, 
  changePassword 
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { signupSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "../utils/validation";

const router = Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, validateBody(updateProfileSchema), updateProfile);
router.post("/change-password", authMiddleware, validateBody(changePasswordSchema), changePassword);

export default router;
