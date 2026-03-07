import { HttpClient } from "../core/http-client";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const createAuthApi = (http: HttpClient) => {
  return {
    signup<T = unknown>(body: SignupPayload): Promise<T> {
      return http.post<T>("/auth/signup", { body });
    },
    login<T = unknown>(body: LoginPayload): Promise<T> {
      return http.post<T>("/auth/login", { body });
    },
  };
};

