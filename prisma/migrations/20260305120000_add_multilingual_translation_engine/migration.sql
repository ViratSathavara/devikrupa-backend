-- AlterTable
ALTER TABLE "Category"
ADD COLUMN "name_en" TEXT,
ADD COLUMN "name_gu" TEXT,
ADD COLUMN "description_en" TEXT,
ADD COLUMN "description_gu" TEXT,
ADD COLUMN "seoTitle_en" TEXT,
ADD COLUMN "seoTitle_gu" TEXT;

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "name_en" TEXT,
ADD COLUMN "name_gu" TEXT,
ADD COLUMN "description_en" TEXT,
ADD COLUMN "description_gu" TEXT;

-- AlterTable
ALTER TABLE "ProductColor"
ADD COLUMN "name_en" TEXT,
ADD COLUMN "name_gu" TEXT;

-- AlterTable
ALTER TABLE "Inquiry"
ADD COLUMN "message_en" TEXT,
ADD COLUMN "message_gu" TEXT;

-- AlterTable
ALTER TABLE "ServiceInquiry"
ADD COLUMN "productName_en" TEXT,
ADD COLUMN "productName_gu" TEXT,
ADD COLUMN "productType_en" TEXT,
ADD COLUMN "productType_gu" TEXT,
ADD COLUMN "brand_en" TEXT,
ADD COLUMN "brand_gu" TEXT,
ADD COLUMN "model_en" TEXT,
ADD COLUMN "model_gu" TEXT,
ADD COLUMN "color_en" TEXT,
ADD COLUMN "color_gu" TEXT,
ADD COLUMN "warrantyInfo_en" TEXT,
ADD COLUMN "warrantyInfo_gu" TEXT,
ADD COLUMN "issueDescription_en" TEXT,
ADD COLUMN "issueDescription_gu" TEXT,
ADD COLUMN "additionalDetails_en" TEXT,
ADD COLUMN "additionalDetails_gu" TEXT;

-- CreateTable
CREATE TABLE "DictionaryWord" (
    "id" SERIAL NOT NULL,
    "englishWord" TEXT NOT NULL,
    "gujaratiWord" TEXT NOT NULL,
    "wordType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DictionaryWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictionaryPhrase" (
    "id" SERIAL NOT NULL,
    "englishPhrase" TEXT NOT NULL,
    "gujaratiPhrase" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DictionaryPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TranslationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationCache" (
    "id" SERIAL NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TranslationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnknownWord" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "suggestedTranslation" TEXT,
    "resolvedTranslation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnknownWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryWord_englishWord_key" ON "DictionaryWord"("englishWord");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryWord_gujaratiWord_key" ON "DictionaryWord"("gujaratiWord");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryPhrase_englishPhrase_key" ON "DictionaryPhrase"("englishPhrase");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryPhrase_gujaratiPhrase_key" ON "DictionaryPhrase"("gujaratiPhrase");

-- CreateIndex
CREATE INDEX "TranslationRule_sourceLang_targetLang_priority_idx" ON "TranslationRule"("sourceLang", "targetLang", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "translation_cache_lang_text_key" ON "TranslationCache"("sourceLang", "targetLang", "normalizedText");

-- CreateIndex
CREATE INDEX "TranslationCache_sourceLang_targetLang_lastUsedAt_idx" ON "TranslationCache"("sourceLang", "targetLang", "lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "unknown_word_language_key" ON "UnknownWord"("word", "language");

-- CreateIndex
CREATE INDEX "UnknownWord_status_lastSeenAt_idx" ON "UnknownWord"("status", "lastSeenAt");
