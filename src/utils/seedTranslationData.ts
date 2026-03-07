import prisma from "../lib/prisma";

const DEFAULT_WORDS: Array<{ englishWord: string; gujaratiWord: string; wordType?: string }> = [
  { englishWord: "switch", gujaratiWord: "સ્વીચ", wordType: "electrical" },
  { englishWord: "wire", gujaratiWord: "વાયર", wordType: "electrical" },
  { englishWord: "fan", gujaratiWord: "પંખો", wordType: "electrical" },
  { englishWord: "bulb", gujaratiWord: "બલ્બ", wordType: "electrical" },
  { englishWord: "socket", gujaratiWord: "સોકેટ", wordType: "electrical" },
  { englishWord: "plug", gujaratiWord: "પ્લગ", wordType: "electrical" },
  { englishWord: "board", gujaratiWord: "બોર્ડ", wordType: "electrical" },
  { englishWord: "cable", gujaratiWord: "કેબલ", wordType: "electrical" },
  { englishWord: "adapter", gujaratiWord: "એડેપ્ટર", wordType: "electrical" },
  { englishWord: "fuse", gujaratiWord: "ફ્યુઝ", wordType: "electrical" },
  { englishWord: "panel", gujaratiWord: "પેનલ", wordType: "electrical" },
];

const DEFAULT_PHRASES: Array<{
  englishPhrase: string;
  gujaratiPhrase: string;
  context?: string;
}> = [
  {
    englishPhrase: "Add to cart",
    gujaratiPhrase: "કાર્ટમાં ઉમેરો",
    context: "frontend",
  },
  {
    englishPhrase: "Place order",
    gujaratiPhrase: "ઓર્ડર કરો",
    context: "frontend",
  },
  {
    englishPhrase: "Submit inquiry",
    gujaratiPhrase: "પૂછપરછ મોકલો",
    context: "frontend",
  },
  {
    englishPhrase: "Low stock",
    gujaratiPhrase: "ઓછો સ્ટોક",
    context: "inventory",
  },
];

const DEFAULT_RULES: Array<{
  name: string;
  sourceLang: "gu" | "en";
  targetLang: "gu" | "en";
  pattern: string;
  replacement: string;
  priority: number;
}> = [
  {
    name: "Mare X joiye",
    sourceLang: "gu",
    targetLang: "en",
    pattern: "^Mare\\s+(.+)\\s+joiye$",
    replacement: "I want $1",
    priority: 10,
  },
  {
    name: "Need X",
    sourceLang: "en",
    targetLang: "gu",
    pattern: "^I\\s+want\\s+(.+)$",
    replacement: "મારે $1 જોઈએ",
    priority: 10,
  },
  {
    name: "Repair request",
    sourceLang: "gu",
    targetLang: "en",
    pattern: "^(.+)\\s+repair\\s+karavvu\\s+che$",
    replacement: "I want to repair $1",
    priority: 20,
  },
];

export const seedTranslationData = async (): Promise<void> => {
  for (const word of DEFAULT_WORDS) {
    await prisma.dictionaryWord.upsert({
      where: { englishWord: word.englishWord },
      create: {
        englishWord: word.englishWord,
        gujaratiWord: word.gujaratiWord,
        wordType: word.wordType ?? null,
      },
      update: {
        gujaratiWord: word.gujaratiWord,
        wordType: word.wordType ?? null,
      },
    });
  }

  for (const phrase of DEFAULT_PHRASES) {
    await prisma.dictionaryPhrase.upsert({
      where: { englishPhrase: phrase.englishPhrase },
      create: {
        englishPhrase: phrase.englishPhrase,
        gujaratiPhrase: phrase.gujaratiPhrase,
        context: phrase.context ?? null,
      },
      update: {
        gujaratiPhrase: phrase.gujaratiPhrase,
        context: phrase.context ?? null,
      },
    });
  }

  for (const rule of DEFAULT_RULES) {
    const existing = await prisma.translationRule.findFirst({
      where: {
        sourceLang: rule.sourceLang,
        targetLang: rule.targetLang,
        pattern: rule.pattern,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.translationRule.update({
        where: { id: existing.id },
        data: {
          name: rule.name,
          replacement: rule.replacement,
          priority: rule.priority,
          isActive: true,
        },
      });
      continue;
    }

    await prisma.translationRule.create({
      data: {
        name: rule.name,
        sourceLang: rule.sourceLang,
        targetLang: rule.targetLang,
        pattern: rule.pattern,
        replacement: rule.replacement,
        priority: rule.priority,
        isActive: true,
      },
    });
  }
};
