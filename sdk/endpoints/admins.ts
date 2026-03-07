import { HttpClient } from "../core/http-client";

export const createAdminsApi = (http: HttpClient) => {
  return {
    list<T = unknown>(): Promise<T> {
      return http.get<T>("/admins", { auth: "admin" });
    },
    getById<T = unknown>(id: string): Promise<T> {
      return http.get<T>(`/admins/admin/${id}`, { auth: "admin" });
    },
    create<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/admins", { auth: "admin", body });
    },
    update<T = unknown>(id: string, body: Record<string, unknown>): Promise<T> {
      return http.put<T>(`/admins/admin/${id}`, { auth: "admin", body });
    },
    remove<T = unknown>(id: string): Promise<T> {
      return http.delete<T>(`/admins/${id}`, { auth: "admin" });
    },
    dashboardCards<T = unknown>(): Promise<T> {
      return http.get<T>("/admins/dashboard/cards", { auth: "admin" });
    },
  };
};
