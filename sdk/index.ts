import { HttpClient } from "./core/http-client";
import { createAdminAuthApi } from "./endpoints/admin-auth";
import { createAdminsApi } from "./endpoints/admins";
import { createAIApi } from "./endpoints/ai";
import { createAuthApi } from "./endpoints/auth";
import { createCategoriesApi } from "./endpoints/categories";
import { createChatApi } from "./endpoints/chat";
import { createFavoritesApi } from "./endpoints/favorites";
import { createInquiriesApi } from "./endpoints/inquiries";
import { createPageSettingsApi } from "./endpoints/page-settings";
import { createProductsApi } from "./endpoints/products";
import { createServiceInquiriesApi } from "./endpoints/service-inquiries";
import { createTestimonialsApi } from "./endpoints/testimonials";
import { createTranslationsApi } from "./endpoints/translations";
import { createUploadApi } from "./endpoints/upload";
import { SdkConfig } from "./types";

export const createDevikrupaSdk = (config: SdkConfig) => {
  const http = new HttpClient(config);

  return {
    http,
    auth: createAuthApi(http),
    adminAuth: createAdminAuthApi(http),
    products: createProductsApi(http),
    categories: createCategoriesApi(http),
    admins: createAdminsApi(http),
    inquiries: createInquiriesApi(http),
    serviceInquiries: createServiceInquiriesApi(http),
    favorites: createFavoritesApi(http),
    testimonials: createTestimonialsApi(http),
    upload: createUploadApi(http),
    pageSettings: createPageSettingsApi(http),
    chat: createChatApi(http),
    ai: createAIApi(http),
    translations: createTranslationsApi(http),
  };
};

export type DevikrupaSdk = ReturnType<typeof createDevikrupaSdk>;

export * from "./types";
export * from "./endpoints/admin-auth";
export * from "./endpoints/admins";
export * from "./endpoints/ai";
export * from "./endpoints/auth";
export * from "./endpoints/categories";
export * from "./endpoints/chat";
export * from "./endpoints/favorites";
export * from "./endpoints/inquiries";
export * from "./endpoints/page-settings";
export * from "./endpoints/products";
export * from "./endpoints/service-inquiries";
export * from "./endpoints/testimonials";
export * from "./endpoints/translations";
export * from "./endpoints/upload";

