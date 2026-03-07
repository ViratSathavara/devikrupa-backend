import { HttpClient } from "../core/http-client";

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export const createAdminAuthApi = (http: HttpClient) => {
  return {
    login<T = unknown>(body: AdminLoginPayload): Promise<T> {
      return http.post<T>("/admin/auth/login", { body });
    },
  };
};

