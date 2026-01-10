import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  addToFavorite,
  removeFromFavorite,
  getUserFavorites
} from "../controllers/favorite.controller";

const router = Router();

router.post("/", authMiddleware, addToFavorite);
router.delete("/:productId", authMiddleware, removeFromFavorite);
router.get("/", authMiddleware, getUserFavorites);

export default router;
