import { HttpClient } from "../core/http-client";

export const createCategoriesApi = (http: HttpClient) => {
  return {
    list<T = unknown>(): Promise<T> {
      return http.get<T>("/categories");
    },
    create<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/categories", { auth: "admin", body });
    },
    update<T = unknown>(id: string, body: Record<string, unknown>): Promise<T> {
      return http.put<T>(`/categories/${id}`, { auth: "admin", body });
    },
    remove<T = unknown>(id: string): Promise<T> {
      return http.delete<T>(`/categories/${id}`, { auth: "admin" });
    },
  };
};

