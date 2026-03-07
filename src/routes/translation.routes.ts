import { Router } from "express";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  createDictionaryPhrase,
  createDictionaryWord,
  createTranslationRule,
  deleteDictionaryPhrase,
  deleteDictionaryWord,
  deleteTranslationRule,
  listDictionaryPhrases,
  listDictionaryWords,
  listTranslationRules,
  listUnknownWords,
  testTranslation,
  updateDictionaryPhrase,
  updateDictionaryWord,
  updateTranslationRule,
  updateUnknownWord,
} from "../controllers/translation.controller";

const router = Router();

router.get("/words", adminMiddleware, listDictionaryWords);
router.post("/words", adminMiddleware, createDictionaryWord);
router.patch("/words/:id", adminMiddleware, updateDictionaryWord);
router.delete("/words/:id", adminMiddleware, deleteDictionaryWord);

router.get("/phrases", adminMiddleware, listDictionaryPhrases);
router.post("/phrases", adminMiddleware, createDictionaryPhrase);
router.patch("/phrases/:id", adminMiddleware, updateDictionaryPhrase);
router.delete("/phrases/:id", adminMiddleware, deleteDictionaryPhrase);

router.get("/rules", adminMiddleware, listTranslationRules);
router.post("/rules", adminMiddleware, createTranslationRule);
router.patch("/rules/:id", adminMiddleware, updateTranslationRule);
router.delete("/rules/:id", adminMiddleware, deleteTranslationRule);

router.get("/unknown-words", adminMiddleware, listUnknownWords);
router.patch("/unknown-words/:id", adminMiddleware, updateUnknownWord);

router.post("/test", adminMiddleware, testTranslation);

export default router;
