import { HttpClient } from "../core/http-client";

export interface DictionaryListQuery {
  search?: string;
  limit?: number;
}

export interface TranslationRulesQuery {
  sourceLang?: string;
  targetLang?: string;
  limit?: number;
}

export interface UnknownWordsQuery {
  status?: string;
  limit?: number;
}

export const createTranslationsApi = (http: HttpClient) => {
  return {
    listWords<T = unknown>(query?: DictionaryListQuery): Promise<T> {
      return http.get<T>("/translations/words", { auth: "admin", query });
    },
    createWord<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/translations/words", { auth: "admin", body });
    },
    updateWord<T = unknown>(id: number | string, body: Record<string, unknown>): Promise<T> {
      return http.patch<T>(`/translations/words/${id}`, { auth: "admin", body });
    },
    deleteWord<T = unknown>(id: number | string): Promise<T> {
      return http.delete<T>(`/translations/words/${id}`, { auth: "admin" });
    },
    listPhrases<T = unknown>(query?: DictionaryListQuery): Promise<T> {
      return http.get<T>("/translations/phrases", { auth: "admin", query });
    },
    createPhrase<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/translations/phrases", { auth: "admin", body });
    },
    updatePhrase<T = unknown>(id: number | string, body: Record<string, unknown>): Promise<T> {
      return http.patch<T>(`/translations/phrases/${id}`, { auth: "admin", body });
    },
    deletePhrase<T = unknown>(id: number | string): Promise<T> {
      return http.delete<T>(`/translations/phrases/${id}`, { auth: "admin" });
    },
    listRules<T = unknown>(query?: TranslationRulesQuery): Promise<T> {
      return http.get<T>("/translations/rules", { auth: "admin", query });
    },
    createRule<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/translations/rules", { auth: "admin", body });
    },
    updateRule<T = unknown>(id: number | string, body: Record<string, unknown>): Promise<T> {
      return http.patch<T>(`/translations/rules/${id}`, { auth: "admin", body });
    },
    deleteRule<T = unknown>(id: number | string): Promise<T> {
      return http.delete<T>(`/translations/rules/${id}`, { auth: "admin" });
    },
    listUnknownWords<T = unknown>(query?: UnknownWordsQuery): Promise<T> {
      return http.get<T>("/translations/unknown-words", { auth: "admin", query });
    },
    updateUnknownWord<T = unknown>(
      id: number | string,
      body: Record<string, unknown>
    ): Promise<T> {
      return http.patch<T>(`/translations/unknown-words/${id}`, {
        auth: "admin",
        body,
      });
    },
    test<T = unknown>(body: { text: string; sourceLang?: string; targetLang?: string }): Promise<T> {
      return http.post<T>("/translations/test", { auth: "admin", body });
    },
  };
};

