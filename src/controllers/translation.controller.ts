import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  detectLanguage,
  normalizeLanguage,
} from "../services/languageDetection.service";
import {
  invalidateTranslationReferenceCache,
  translateText,
} from "../services/translation.service";

const parseLimit = (value: unknown, fallback = 100, max = 500): number => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const normalizeStatus = (value: unknown): string => {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized || "NEW";
};

export const listDictionaryWords = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? "").trim();
    const limit = parseLimit(req.query.limit, 250, 1000);

    const words = await prisma.dictionaryWord.findMany({
      where: search
        ? {
            OR: [
              { englishWord: { contains: search, mode: "insensitive" } },
              { gujaratiWord: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { englishWord: "asc" },
      take: limit,
    });

    return res.json(words);
  } catch (error) {
    console.error("List dictionary words error:", error);
    return res.status(500).json({ message: "Failed to fetch dictionary words" });
  }
};

export const createDictionaryWord = async (req: Request, res: Response) => {
  try {
    const englishWord = String(req.body.englishWord ?? "").trim().toLowerCase();
    const gujaratiWord = String(req.body.gujaratiWord ?? "").trim();
    const wordType = String(req.body.wordType ?? "").trim() || null;

    if (!englishWord || !gujaratiWord) {
      return res
        .status(400)
        .json({ message: "englishWord and gujaratiWord are required" });
    }

    const word = await prisma.dictionaryWord.create({
      data: { englishWord, gujaratiWord, wordType },
    });
    invalidateTranslationReferenceCache();

    return res.status(201).json(word);
  } catch (error: any) {
    console.error("Create dictionary word error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Dictionary word already exists" });
    }
    return res.status(500).json({ message: "Failed to create dictionary word" });
  }
};

export const updateDictionaryWord = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid dictionary word id" });
    }

    const englishWord = String(req.body.englishWord ?? "").trim().toLowerCase();
    const gujaratiWord = String(req.body.gujaratiWord ?? "").trim();
    const wordType = req.body.wordType === undefined ? undefined : String(req.body.wordType ?? "").trim() || null;

    if (!englishWord || !gujaratiWord) {
      return res
        .status(400)
        .json({ message: "englishWord and gujaratiWord are required" });
    }

    const word = await prisma.dictionaryWord.update({
      where: { id },
      data: {
        englishWord,
        gujaratiWord,
        ...(wordType !== undefined ? { wordType } : {}),
      },
    });
    invalidateTranslationReferenceCache();

    return res.json(word);
  } catch (error: any) {
    console.error("Update dictionary word error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Dictionary word not found" });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Dictionary word already exists" });
    }
    return res.status(500).json({ message: "Failed to update dictionary word" });
  }
};

export const deleteDictionaryWord = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid dictionary word id" });
    }

    await prisma.dictionaryWord.delete({ where: { id } });
    invalidateTranslationReferenceCache();

    return res.json({ message: "Dictionary word deleted" });
  } catch (error: any) {
    console.error("Delete dictionary word error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Dictionary word not found" });
    }
    return res.status(500).json({ message: "Failed to delete dictionary word" });
  }
};

export const listDictionaryPhrases = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? "").trim();
    const limit = parseLimit(req.query.limit, 250, 1000);

    const phrases = await prisma.dictionaryPhrase.findMany({
      where: search
        ? {
            OR: [
              { englishPhrase: { contains: search, mode: "insensitive" } },
              { gujaratiPhrase: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { englishPhrase: "asc" },
      take: limit,
    });

    return res.json(phrases);
  } catch (error) {
    console.error("List dictionary phrases error:", error);
    return res.status(500).json({ message: "Failed to fetch dictionary phrases" });
  }
};

export const createDictionaryPhrase = async (req: Request, res: Response) => {
  try {
    const englishPhrase = String(req.body.englishPhrase ?? "").trim();
    const gujaratiPhrase = String(req.body.gujaratiPhrase ?? "").trim();
    const context = String(req.body.context ?? "").trim() || null;

    if (!englishPhrase || !gujaratiPhrase) {
      return res
        .status(400)
        .json({ message: "englishPhrase and gujaratiPhrase are required" });
    }

    const phrase = await prisma.dictionaryPhrase.create({
      data: { englishPhrase, gujaratiPhrase, context },
    });
    invalidateTranslationReferenceCache();

    return res.status(201).json(phrase);
  } catch (error: any) {
    console.error("Create dictionary phrase error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Dictionary phrase already exists" });
    }
    return res.status(500).json({ message: "Failed to create dictionary phrase" });
  }
};

export const updateDictionaryPhrase = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid dictionary phrase id" });
    }

    const englishPhrase = String(req.body.englishPhrase ?? "").trim();
    const gujaratiPhrase = String(req.body.gujaratiPhrase ?? "").trim();
    const context = req.body.context === undefined ? undefined : String(req.body.context ?? "").trim() || null;

    if (!englishPhrase || !gujaratiPhrase) {
      return res
        .status(400)
        .json({ message: "englishPhrase and gujaratiPhrase are required" });
    }

    const phrase = await prisma.dictionaryPhrase.update({
      where: { id },
      data: {
        englishPhrase,
        gujaratiPhrase,
        ...(context !== undefined ? { context } : {}),
      },
    });
    invalidateTranslationReferenceCache();

    return res.json(phrase);
  } catch (error: any) {
    console.error("Update dictionary phrase error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Dictionary phrase not found" });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Dictionary phrase already exists" });
    }
    return res.status(500).json({ message: "Failed to update dictionary phrase" });
  }
};

export const deleteDictionaryPhrase = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid dictionary phrase id" });
    }

    await prisma.dictionaryPhrase.delete({ where: { id } });
    invalidateTranslationReferenceCache();

    return res.json({ message: "Dictionary phrase deleted" });
  } catch (error: any) {
    console.error("Delete dictionary phrase error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Dictionary phrase not found" });
    }
    return res.status(500).json({ message: "Failed to delete dictionary phrase" });
  }
};

export const listTranslationRules = async (req: Request, res: Response) => {
  try {
    const sourceLang = req.query.sourceLang
      ? normalizeLanguage(req.query.sourceLang)
      : undefined;
    const targetLang = req.query.targetLang
      ? normalizeLanguage(req.query.targetLang)
      : undefined;
    const limit = parseLimit(req.query.limit, 500, 1000);

    const rules = await prisma.translationRule.findMany({
      where: {
        ...(sourceLang ? { sourceLang } : {}),
        ...(targetLang ? { targetLang } : {}),
      },
      orderBy: [{ priority: "asc" }, { id: "asc" }],
      take: limit,
    });

    return res.json(rules);
  } catch (error) {
    console.error("List translation rules error:", error);
    return res.status(500).json({ message: "Failed to fetch translation rules" });
  }
};

export const createTranslationRule = async (req: Request, res: Response) => {
  try {
    const sourceLang = normalizeLanguage(req.body.sourceLang, "en");
    const targetLang = normalizeLanguage(req.body.targetLang, "gu");
    const pattern = String(req.body.pattern ?? "").trim();
    const replacement = String(req.body.replacement ?? "").trim();
    const name = String(req.body.name ?? "").trim() || null;
    const priority = Number.isFinite(Number(req.body.priority))
      ? Number(req.body.priority)
      : 100;
    const isActive = req.body.isActive === undefined ? true : Boolean(req.body.isActive);

    if (!pattern || !replacement) {
      return res.status(400).json({ message: "pattern and replacement are required" });
    }

    const rule = await prisma.translationRule.create({
      data: {
        name,
        sourceLang,
        targetLang,
        pattern,
        replacement,
        priority,
        isActive,
      },
    });
    invalidateTranslationReferenceCache();

    return res.status(201).json(rule);
  } catch (error) {
    console.error("Create translation rule error:", error);
    return res.status(500).json({ message: "Failed to create translation rule" });
  }
};

export const updateTranslationRule = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid translation rule id" });
    }

    const updateData: any = {};
    if (req.body.name !== undefined) {
      updateData.name = String(req.body.name ?? "").trim() || null;
    }
    if (req.body.sourceLang !== undefined) {
      updateData.sourceLang = normalizeLanguage(req.body.sourceLang, "en");
    }
    if (req.body.targetLang !== undefined) {
      updateData.targetLang = normalizeLanguage(req.body.targetLang, "gu");
    }
    if (req.body.pattern !== undefined) {
      updateData.pattern = String(req.body.pattern ?? "").trim();
    }
    if (req.body.replacement !== undefined) {
      updateData.replacement = String(req.body.replacement ?? "").trim();
    }
    if (req.body.priority !== undefined) {
      updateData.priority = Number.isFinite(Number(req.body.priority))
        ? Number(req.body.priority)
        : 100;
    }
    if (req.body.isActive !== undefined) {
      updateData.isActive = Boolean(req.body.isActive);
    }

    if (
      updateData.pattern !== undefined &&
      String(updateData.pattern).trim() === ""
    ) {
      return res.status(400).json({ message: "pattern cannot be empty" });
    }
    if (
      updateData.replacement !== undefined &&
      String(updateData.replacement).trim() === ""
    ) {
      return res.status(400).json({ message: "replacement cannot be empty" });
    }

    const rule = await prisma.translationRule.update({
      where: { id },
      data: updateData,
    });
    invalidateTranslationReferenceCache();

    return res.json(rule);
  } catch (error: any) {
    console.error("Update translation rule error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Translation rule not found" });
    }
    return res.status(500).json({ message: "Failed to update translation rule" });
  }
};

export const deleteTranslationRule = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid translation rule id" });
    }

    await prisma.translationRule.delete({ where: { id } });
    invalidateTranslationReferenceCache();

    return res.json({ message: "Translation rule deleted" });
  } catch (error: any) {
    console.error("Delete translation rule error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Translation rule not found" });
    }
    return res.status(500).json({ message: "Failed to delete translation rule" });
  }
};

export const listUnknownWords = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status ?? "").trim();
    const limit = parseLimit(req.query.limit, 200, 1000);

    const unknownWords = await prisma.unknownWord.findMany({
      where: status ? { status: normalizeStatus(status) } : undefined,
      orderBy: [{ lastSeenAt: "desc" }, { occurrences: "desc" }],
      take: limit,
    });

    return res.json(unknownWords);
  } catch (error) {
    console.error("List unknown words error:", error);
    return res.status(500).json({ message: "Failed to fetch unknown words" });
  }
};

export const updateUnknownWord = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid unknown word id" });
    }

    const updateData: any = {};
    if (req.body.status !== undefined) {
      updateData.status = normalizeStatus(req.body.status);
    }
    if (req.body.suggestedTranslation !== undefined) {
      updateData.suggestedTranslation =
        String(req.body.suggestedTranslation ?? "").trim() || null;
    }
    if (req.body.resolvedTranslation !== undefined) {
      updateData.resolvedTranslation =
        String(req.body.resolvedTranslation ?? "").trim() || null;
    }

    const unknownWord = await prisma.unknownWord.update({
      where: { id },
      data: updateData,
    });

    if (unknownWord.resolvedTranslation) {
      const englishWord =
        unknownWord.language === "en"
          ? unknownWord.word
          : unknownWord.resolvedTranslation;
      const gujaratiWord =
        unknownWord.language === "gu"
          ? unknownWord.word
          : unknownWord.resolvedTranslation;

      const existingByEnglish = await prisma.dictionaryWord.findUnique({
        where: { englishWord },
      });

      if (existingByEnglish) {
        await prisma.dictionaryWord.update({
          where: { id: existingByEnglish.id },
          data: {
            gujaratiWord,
          },
        });
      } else {
        await prisma.dictionaryWord.create({
          data: {
            englishWord,
            gujaratiWord,
            wordType: "learned",
          },
        });
      }

      invalidateTranslationReferenceCache();
    }

    return res.json(unknownWord);
  } catch (error: any) {
    console.error("Update unknown word error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Unknown word not found" });
    }
    if (error?.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Resolved translation conflicts with existing dictionary entry" });
    }
    return res.status(500).json({ message: "Failed to update unknown word" });
  }
};

export const testTranslation = async (req: Request, res: Response) => {
  try {
    const text = String(req.body.text ?? "").trim();
    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    const detectedSource = detectLanguage(text);
    const sourceLang = req.body.sourceLang
      ? normalizeLanguage(req.body.sourceLang, detectedSource)
      : detectedSource;
    const targetLang = req.body.targetLang
      ? normalizeLanguage(req.body.targetLang, sourceLang === "en" ? "gu" : "en")
      : sourceLang === "en"
        ? "gu"
        : "en";

    const result = await translateText(text, { sourceLang, targetLang });

    return res.json({
      text,
      sourceLang,
      targetLang,
      translatedText: result.translatedText,
      fromCache: result.fromCache,
    });
  } catch (error) {
    console.error("Test translation error:", error);
    return res.status(500).json({ message: "Failed to test translation" });
  }
};
