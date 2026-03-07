export type SupportedLanguage = "en" | "gu";

const GUJARATI_UNICODE_REGEX = /[\u0A80-\u0AFF]/;

export const detectLanguage = (text: string): SupportedLanguage => {
  return GUJARATI_UNICODE_REGEX.test(text) ? "gu" : "en";
};

export const normalizeLanguage = (value: unknown, fallback: SupportedLanguage = "en"): SupportedLanguage => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized.startsWith("gu")) {
    return "gu";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return fallback;
};

export const normalizeText = (value: unknown): string => String(value ?? "").trim();
