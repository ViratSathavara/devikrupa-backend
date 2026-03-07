import prisma from "../lib/prisma";
import {
  detectLanguage,
  normalizeText,
  SupportedLanguage,
} from "./languageDetection.service";

type TranslateTextOptions = {
  sourceLang?: SupportedLanguage;
  targetLang: SupportedLanguage;
};

type RuleRecord = {
  id: number;
  pattern: string;
  replacement: string;
};

type TranslationResult = {
  translatedText: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  fromCache: boolean;
};

type ResolveBilingualInput = {
  text?: unknown;
  textEn?: unknown;
  textGu?: unknown;
  sourceLang?: SupportedLanguage;
};

type ResolveBilingualResult = {
  textEn: string | null;
  textGu: string | null;
  sourceLang: SupportedLanguage;
};

type TranslationReferenceCache = {
  loadedAt: number;
  loadingPromise: Promise<void> | null;
  wordsEnToGu: Map<string, string>;
  wordsGuToEn: Map<string, string>;
  phrasesEnToGu: Map<string, string>;
  phrasesGuToEn: Map<string, string>;
  rulesByDirection: Map<string, RuleRecord[]>;
};

const REFERENCE_CACHE_TTL_MS = 5 * 60 * 1000;
const TOKEN_SPLIT_REGEX = /(\s+|[.,!?;:()[\]{}"'`])/g;
const WORD_TOKEN_REGEX = /[A-Za-z\u0A80-\u0AFF]/;

const translationReferenceCache: TranslationReferenceCache = {
  loadedAt: 0,
  loadingPromise: null,
  wordsEnToGu: new Map<string, string>(),
  wordsGuToEn: new Map<string, string>(),
  phrasesEnToGu: new Map<string, string>(),
  phrasesGuToEn: new Map<string, string>(),
  rulesByDirection: new Map<string, RuleRecord[]>(),
};

const directionKey = (sourceLang: SupportedLanguage, targetLang: SupportedLanguage): string =>
  `${sourceLang}->${targetLang}`;

const normalizeLookup = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const isWordToken = (token: string): boolean => WORD_TOKEN_REGEX.test(token);

const shouldTrackUnknownWord = (token: string): boolean => {
  const normalized = token.trim();
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return false;
  return normalized.length >= 2;
};

const ensureReferenceDataLoaded = async (forceRefresh = false): Promise<void> => {
  const now = Date.now();
  const hasFreshCache =
    !forceRefresh &&
    translationReferenceCache.loadedAt > 0 &&
    now - translationReferenceCache.loadedAt < REFERENCE_CACHE_TTL_MS;

  if (hasFreshCache) {
    return;
  }

  if (translationReferenceCache.loadingPromise) {
    await translationReferenceCache.loadingPromise;
    return;
  }

  translationReferenceCache.loadingPromise = (async () => {
    const [words, phrases, rules] = await Promise.all([
      prisma.dictionaryWord.findMany(),
      prisma.dictionaryPhrase.findMany(),
      prisma.translationRule.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "asc" }, { id: "asc" }],
      }),
    ]);

    const wordsEnToGu = new Map<string, string>();
    const wordsGuToEn = new Map<string, string>();
    const phrasesEnToGu = new Map<string, string>();
    const phrasesGuToEn = new Map<string, string>();
    const rulesByDirection = new Map<string, RuleRecord[]>();

    for (const word of words) {
      const en = normalizeLookup(word.englishWord);
      const gu = normalizeLookup(word.gujaratiWord);
      if (en) wordsEnToGu.set(en, word.gujaratiWord);
      if (gu) wordsGuToEn.set(gu, word.englishWord);
    }

    for (const phrase of phrases) {
      const en = normalizeLookup(phrase.englishPhrase);
      const gu = normalizeLookup(phrase.gujaratiPhrase);
      if (en) phrasesEnToGu.set(en, phrase.gujaratiPhrase);
      if (gu) phrasesGuToEn.set(gu, phrase.englishPhrase);
    }

    for (const rule of rules) {
      const sourceLang = normalizeLookup(rule.sourceLang) as SupportedLanguage;
      const targetLang = normalizeLookup(rule.targetLang) as SupportedLanguage;
      if (!["en", "gu"].includes(sourceLang) || !["en", "gu"].includes(targetLang)) {
        continue;
      }

      const key = directionKey(sourceLang, targetLang);
      const current = rulesByDirection.get(key) ?? [];
      current.push({
        id: rule.id,
        pattern: rule.pattern,
        replacement: rule.replacement,
      });
      rulesByDirection.set(key, current);
    }

    translationReferenceCache.wordsEnToGu = wordsEnToGu;
    translationReferenceCache.wordsGuToEn = wordsGuToEn;
    translationReferenceCache.phrasesEnToGu = phrasesEnToGu;
    translationReferenceCache.phrasesGuToEn = phrasesGuToEn;
    translationReferenceCache.rulesByDirection = rulesByDirection;
    translationReferenceCache.loadedAt = Date.now();
  })();

  try {
    await translationReferenceCache.loadingPromise;
  } finally {
    translationReferenceCache.loadingPromise = null;
  }
};

const getDictionaryTranslation = (
  token: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): string | null => {
  const normalizedToken = normalizeLookup(token);
  const dictionary =
    sourceLang === "en" && targetLang === "gu"
      ? translationReferenceCache.wordsEnToGu
      : translationReferenceCache.wordsGuToEn;

  const direct = dictionary.get(normalizedToken);
  if (direct) {
    return direct;
  }

  if (sourceLang === "en") {
    if (normalizedToken.endsWith("es")) {
      const baseWord = normalizedToken.slice(0, -2);
      const baseTranslation = dictionary.get(baseWord);
      if (baseTranslation) {
        return baseTranslation;
      }
    }
    if (normalizedToken.endsWith("s")) {
      const baseWord = normalizedToken.slice(0, -1);
      const baseTranslation = dictionary.get(baseWord);
      if (baseTranslation) {
        return baseTranslation;
      }
    }
  }

  return null;
};

const applyRuleTranslation = (
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): string | null => {
  const rules = translationReferenceCache.rulesByDirection.get(
    directionKey(sourceLang, targetLang)
  );

  if (!rules || rules.length === 0) {
    return null;
  }

  for (const rule of rules) {
    try {
      const pattern = new RegExp(rule.pattern, "i");
      if (!pattern.test(text)) {
        continue;
      }
      return text.replace(pattern, rule.replacement).trim();
    } catch (error) {
      console.warn(
        `[translation] Invalid regex pattern in rule ${rule.id}: ${rule.pattern}`,
        error
      );
    }
  }

  return null;
};

const applyDictionaryTranslation = (
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): { translatedText: string; unknownWords: Set<string> } => {
  const unknownWords = new Set<string>();
  const parts = text.split(TOKEN_SPLIT_REGEX);
  const translatedParts: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (!isWordToken(part)) {
      translatedParts.push(part);
      continue;
    }

    const translatedWord = getDictionaryTranslation(part, sourceLang, targetLang);
    if (translatedWord) {
      translatedParts.push(translatedWord);
      continue;
    }

    translatedParts.push(part);
    if (shouldTrackUnknownWord(part)) {
      unknownWords.add(normalizeLookup(part));
    }
  }

  return {
    translatedText: translatedParts.join(""),
    unknownWords,
  };
};

const trackUnknownWords = async (
  words: Set<string>,
  language: SupportedLanguage
): Promise<void> => {
  if (words.size === 0) {
    return;
  }

  const now = new Date();
  await Promise.all(
    Array.from(words).map((word) =>
      prisma.unknownWord.upsert({
        where: {
          word_language: {
            word,
            language,
          },
        },
        create: {
          word,
          language,
          occurrences: 1,
          lastSeenAt: now,
        },
        update: {
          occurrences: {
            increment: 1,
          },
          lastSeenAt: now,
        },
      })
    )
  );
};

const upsertTranslationCache = async (
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage,
  originalText: string,
  normalizedText: string,
  translatedText: string
): Promise<void> => {
  const now = new Date();
  await prisma.translationCache.upsert({
    where: {
      sourceLang_targetLang_normalizedText: {
        sourceLang,
        targetLang,
        normalizedText,
      },
    },
    create: {
      sourceLang,
      targetLang,
      originalText,
      normalizedText,
      translatedText,
      lastUsedAt: now,
    },
    update: {
      translatedText,
      originalText,
      hitCount: {
        increment: 1,
      },
      lastUsedAt: now,
    },
  });
};

export const invalidateTranslationReferenceCache = (): void => {
  translationReferenceCache.loadedAt = 0;
};

export const translateText = async (
  textInput: unknown,
  options: TranslateTextOptions
): Promise<TranslationResult> => {
  const text = normalizeText(textInput);
  const targetLang = options.targetLang;

  if (!text) {
    return {
      translatedText: "",
      sourceLang: options.sourceLang ?? targetLang,
      targetLang,
      fromCache: false,
    };
  }

  const sourceLang = options.sourceLang ?? detectLanguage(text);
  if (sourceLang === targetLang) {
    return {
      translatedText: text,
      sourceLang,
      targetLang,
      fromCache: false,
    };
  }

  await ensureReferenceDataLoaded();

  const normalizedInput = normalizeLookup(text);
  const cached = await prisma.translationCache.findUnique({
    where: {
      sourceLang_targetLang_normalizedText: {
        sourceLang,
        targetLang,
        normalizedText: normalizedInput,
      },
    },
  });

  if (cached) {
    await prisma.translationCache.update({
      where: { id: cached.id },
      data: {
        hitCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
    });

    return {
      translatedText: cached.translatedText,
      sourceLang,
      targetLang,
      fromCache: true,
    };
  }

  const phraseMap =
    sourceLang === "en" && targetLang === "gu"
      ? translationReferenceCache.phrasesEnToGu
      : translationReferenceCache.phrasesGuToEn;

  const phraseTranslation = phraseMap.get(normalizedInput);
  if (phraseTranslation) {
    await upsertTranslationCache(
      sourceLang,
      targetLang,
      text,
      normalizedInput,
      phraseTranslation
    );

    return {
      translatedText: phraseTranslation,
      sourceLang,
      targetLang,
      fromCache: false,
    };
  }

  const ruleTranslation = applyRuleTranslation(text, sourceLang, targetLang);
  if (ruleTranslation) {
    await upsertTranslationCache(
      sourceLang,
      targetLang,
      text,
      normalizedInput,
      ruleTranslation
    );

    return {
      translatedText: ruleTranslation,
      sourceLang,
      targetLang,
      fromCache: false,
    };
  }

  const { translatedText, unknownWords } = applyDictionaryTranslation(
    text,
    sourceLang,
    targetLang
  );
  const finalText = normalizeText(translatedText) || text;

  await Promise.all([
    upsertTranslationCache(sourceLang, targetLang, text, normalizedInput, finalText),
    trackUnknownWords(unknownWords, sourceLang),
  ]);

  return {
    translatedText: finalText,
    sourceLang,
    targetLang,
    fromCache: false,
  };
};

export const resolveBilingualText = async (
  input: ResolveBilingualInput
): Promise<ResolveBilingualResult> => {
  const rawText = normalizeText(input.text);
  let englishText = normalizeText(input.textEn);
  let gujaratiText = normalizeText(input.textGu);

  let sourceLang: SupportedLanguage;
  if (input.sourceLang) {
    sourceLang = input.sourceLang;
  } else if (rawText) {
    sourceLang = detectLanguage(rawText);
  } else if (gujaratiText && !englishText) {
    sourceLang = "gu";
  } else {
    sourceLang = "en";
  }

  if (rawText) {
    if (sourceLang === "gu" && !gujaratiText) {
      gujaratiText = rawText;
    } else if (sourceLang === "en" && !englishText) {
      englishText = rawText;
    }
  }

  if (!englishText && gujaratiText) {
    englishText = (
      await translateText(gujaratiText, { sourceLang: "gu", targetLang: "en" })
    ).translatedText;
  }

  if (!gujaratiText && englishText) {
    gujaratiText = (
      await translateText(englishText, { sourceLang: "en", targetLang: "gu" })
    ).translatedText;
  }

  return {
    textEn: englishText || null,
    textGu: gujaratiText || null,
    sourceLang,
  };
};
