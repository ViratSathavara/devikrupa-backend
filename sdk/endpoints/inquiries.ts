import { HttpClient } from "../core/http-client";

export type InquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface CreateInquiryPayload {
  productId: string;
  message?: string;
  message_en?: string;
  message_gu?: string;
  quantity?: number;
  colorId?: string;
}

export const createInquiriesApi = (http: HttpClient) => {
  return {
    create<T = unknown>(body: CreateInquiryPayload): Promise<T> {
      return http.post<T>("/inquiries", { auth: "user", body });
    },
    listMine<T = unknown>(): Promise<T> {
      return http.get<T>("/inquiries/my-inquiries", { auth: "user" });
    },
    listAll<T = unknown>(): Promise<T> {
      return http.get<T>("/inquiries/all", { auth: "admin" });
    },
    updateStatus<T = unknown>(id: string, status: InquiryStatus): Promise<T> {
      return http.patch<T>(`/inquiries/${id}/status`, {
        auth: "admin",
        body: { status },
      });
    },
  };
};

