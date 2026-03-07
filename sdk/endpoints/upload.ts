import { HttpClient } from "../core/http-client";

export const createUploadApi = (http: HttpClient) => {
  return {
    uploadImage<T = unknown>(image: Blob, fileName = "image.jpg"): Promise<T> {
      const formData = new FormData();
      formData.append("image", image, fileName);
      return http.post<T>("/upload/image", { body: formData });
    },
    uploadImageFormData<T = unknown>(formData: FormData): Promise<T> {
      return http.post<T>("/upload/image", { body: formData });
    },
  };
};

