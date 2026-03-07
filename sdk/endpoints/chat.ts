import { HttpClient } from "../core/http-client";

export type ChatStatusFilter = "ACTIVE" | "CLOSED" | "ALL";

export interface ChatConversationListQuery {
  status?: ChatStatusFilter;
  take?: number;
}

export interface CreateConversationPayload {
  customerName: string;
  mobile: string;
  email?: string;
  message?: string;
}

export interface SendChatMessagePayload {
  message: string;
}

export const createChatApi = (http: HttpClient) => {
  return {
    createConversation<T = unknown>(body: CreateConversationPayload): Promise<T> {
      return http.post<T>("/chat/conversations", { auth: "user", body });
    },
    listMyConversations<T = unknown>(query?: ChatConversationListQuery): Promise<T> {
      return http.get<T>("/chat/conversations/my", { auth: "user", query });
    },
    getMyConversationMessages<T = unknown>(conversationId: string): Promise<T> {
      return http.get<T>(`/chat/conversations/${conversationId}/messages`, {
        auth: "user",
      });
    },
    sendMyMessage<T = unknown>(
      conversationId: string,
      body: SendChatMessagePayload
    ): Promise<T> {
      return http.post<T>(`/chat/conversations/${conversationId}/messages`, {
        auth: "user",
        body,
      });
    },
    markMyConversationRead<T = unknown>(conversationId: string): Promise<T> {
      return http.patch<T>(`/chat/conversations/${conversationId}/read`, {
        auth: "user",
      });
    },
    listAdminConversations<T = unknown>(query?: ChatConversationListQuery): Promise<T> {
      return http.get<T>("/chat/admin/conversations", {
        auth: "admin",
        query,
      });
    },
    getAdminConversationMessages<T = unknown>(conversationId: string): Promise<T> {
      return http.get<T>(`/chat/admin/conversations/${conversationId}/messages`, {
        auth: "admin",
      });
    },
    sendAdminMessage<T = unknown>(
      conversationId: string,
      body: SendChatMessagePayload
    ): Promise<T> {
      return http.post<T>(`/chat/admin/conversations/${conversationId}/messages`, {
        auth: "admin",
        body,
      });
    },
    markAdminConversationRead<T = unknown>(conversationId: string): Promise<T> {
      return http.patch<T>(`/chat/admin/conversations/${conversationId}/read`, {
        auth: "admin",
      });
    },
    closeConversation<T = unknown>(conversationId: string): Promise<T> {
      return http.patch<T>(`/chat/admin/conversations/${conversationId}/close`, {
        auth: "admin",
      });
    },
    reopenConversation<T = unknown>(conversationId: string): Promise<T> {
      return http.patch<T>(`/chat/admin/conversations/${conversationId}/reopen`, {
        auth: "admin",
      });
    },
    convertToInquiry<T = unknown>(conversationId: string): Promise<T> {
      return http.post<T>(
        `/chat/admin/conversations/${conversationId}/convert-to-inquiry`,
        {
          auth: "admin",
        }
      );
    },
  };
};

