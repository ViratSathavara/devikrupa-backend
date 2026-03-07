import { HttpClient } from "../core/http-client";

export type ServiceInquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export const createServiceInquiriesApi = (http: HttpClient) => {
  return {
    create<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/service-inquiries", { auth: "user", body });
    },
    listMine<T = unknown>(): Promise<T> {
      return http.get<T>("/service-inquiries/my-inquiries", { auth: "user" });
    },
    listAll<T = unknown>(): Promise<T> {
      return http.get<T>("/service-inquiries/all", { auth: "admin" });
    },
    updateStatus<T = unknown>(id: string, status: ServiceInquiryStatus): Promise<T> {
      return http.patch<T>(`/service-inquiries/${id}/status`, {
        auth: "admin",
        body: { status },
      });
    },
  };
};

