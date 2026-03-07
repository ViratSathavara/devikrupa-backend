import { HttpClient } from "../core/http-client";

export const createFavoritesApi = (http: HttpClient) => {
  return {
    list<T = unknown>(): Promise<T> {
      return http.get<T>("/favorites", { auth: "user" });
    },
    add<T = unknown>(productId: string): Promise<T> {
      return http.post<T>("/favorites", {
        auth: "user",
        body: { productId },
      });
    },
    remove<T = unknown>(productId: string): Promise<T> {
      return http.delete<T>(`/favorites/${productId}`, { auth: "user" });
    },
  };
};

