import { Router } from "express";
import { chatWithAI } from "../controllers/ai.controller";

const router = Router();

router.post("/chat", chatWithAI);

export default router;
