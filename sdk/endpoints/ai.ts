import { HttpClient } from "../core/http-client";

export interface AIChatPayload {
  message: string;
  sessionId?: string;
}

export const createAIApi = (http: HttpClient) => {
  return {
    chat<T = unknown>(body: AIChatPayload): Promise<T> {
      return http.post<T>("/ai/chat", { body });
    },
  };
};

