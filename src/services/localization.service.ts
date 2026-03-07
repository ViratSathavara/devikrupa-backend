import { SupportedLanguage } from "./languageDetection.service";

const pickLocalizedText = (
  defaultText: unknown,
  englishText: unknown,
  gujaratiText: unknown,
  language: SupportedLanguage
): string | null => {
  const fallback = String(defaultText ?? "").trim();
  const english = String(englishText ?? "").trim();
  const gujarati = String(gujaratiText ?? "").trim();

  if (language === "gu") {
    return gujarati || fallback || english || null;
  }

  return english || fallback || gujarati || null;
};

export const localizeCategory = <T extends Record<string, any>>(
  category: T,
  language: SupportedLanguage
): T => ({
  ...category,
  name: pickLocalizedText(category.name, category.name_en, category.name_gu, language),
  description: pickLocalizedText(
    category.description,
    category.description_en,
    category.description_gu,
    language
  ),
  seoTitle: pickLocalizedText(
    category.seoTitle,
    category.seoTitle_en,
    category.seoTitle_gu,
    language
  ),
});

export const localizeColor = <T extends Record<string, any>>(
  color: T,
  language: SupportedLanguage
): T => ({
  ...color,
  name: pickLocalizedText(color.name, color.name_en, color.name_gu, language),
});

export const localizeProduct = <T extends Record<string, any>>(
  product: T,
  language: SupportedLanguage
): T => ({
  ...product,
  name: pickLocalizedText(product.name, product.name_en, product.name_gu, language),
  description: pickLocalizedText(
    product.description,
    product.description_en,
    product.description_gu,
    language
  ),
  category: product.category ? localizeCategory(product.category, language) : product.category,
  colors: Array.isArray(product.colors)
    ? product.colors.map((color: Record<string, any>) => localizeColor(color, language))
    : product.colors,
});

export const localizeInquiry = <T extends Record<string, any>>(
  inquiry: T,
  language: SupportedLanguage
): T => ({
  ...inquiry,
  message: pickLocalizedText(inquiry.message, inquiry.message_en, inquiry.message_gu, language),
  product: inquiry.product ? localizeProduct(inquiry.product, language) : inquiry.product,
  color: inquiry.color ? localizeColor(inquiry.color, language) : inquiry.color,
});

export const localizeServiceInquiry = <T extends Record<string, any>>(
  inquiry: T,
  language: SupportedLanguage
): T => ({
  ...inquiry,
  productName: pickLocalizedText(
    inquiry.productName,
    inquiry.productName_en,
    inquiry.productName_gu,
    language
  ),
  productType: pickLocalizedText(
    inquiry.productType,
    inquiry.productType_en,
    inquiry.productType_gu,
    language
  ),
  brand: pickLocalizedText(inquiry.brand, inquiry.brand_en, inquiry.brand_gu, language),
  model: pickLocalizedText(inquiry.model, inquiry.model_en, inquiry.model_gu, language),
  color: pickLocalizedText(inquiry.color, inquiry.color_en, inquiry.color_gu, language),
  warrantyInfo: pickLocalizedText(
    inquiry.warrantyInfo,
    inquiry.warrantyInfo_en,
    inquiry.warrantyInfo_gu,
    language
  ),
  issueDescription: pickLocalizedText(
    inquiry.issueDescription,
    inquiry.issueDescription_en,
    inquiry.issueDescription_gu,
    language
  ),
  additionalDetails: pickLocalizedText(
    inquiry.additionalDetails,
    inquiry.additionalDetails_en,
    inquiry.additionalDetails_gu,
    language
  ),
});
