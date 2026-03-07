import { HttpClient } from "../core/http-client";

export interface CreateTestimonialPayload {
  name: string;
  role?: string;
  location?: string;
  rating?: number;
  message: string;
}

export const createTestimonialsApi = (http: HttpClient) => {
  return {
    list<T = unknown>(): Promise<T> {
      return http.get<T>("/testimonials");
    },
    create<T = unknown>(body: CreateTestimonialPayload): Promise<T> {
      return http.post<T>("/testimonials", { body });
    },
    remove<T = unknown>(id: string): Promise<T> {
      return http.delete<T>(`/testimonials/${id}`, { auth: "admin" });
    },
  };
};

