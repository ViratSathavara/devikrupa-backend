import { HttpClient } from "../core/http-client";

export interface ProductListQuery {
  categoryId?: string;
  status?: string;
  search?: string;
}

export interface UpdateStockPayload {
  quantity: number;
  type: "INCREASED" | "DECREASED";
  reason?: string;
}

export const createProductsApi = (http: HttpClient) => {
  return {
    list<T = unknown>(query?: ProductListQuery): Promise<T> {
      return http.get<T>("/products", { query });
    },
    getBySlug<T = unknown>(slug: string): Promise<T> {
      return http.get<T>(`/products/${slug}`);
    },
    create<T = unknown>(body: Record<string, unknown>): Promise<T> {
      return http.post<T>("/products", { auth: "admin", body });
    },
    update<T = unknown>(id: string, body: Record<string, unknown>): Promise<T> {
      return http.patch<T>(`/products/${id}`, { auth: "admin", body });
    },
    updateStock<T = unknown>(id: string, body: UpdateStockPayload): Promise<T> {
      return http.patch<T>(`/products/${id}/stock`, { auth: "admin", body });
    },
    remove<T = unknown>(id: string): Promise<T> {
      return http.delete<T>(`/products/${id}`, { auth: "admin" });
    },
  };
};

