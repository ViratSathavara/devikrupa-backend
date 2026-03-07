import { HttpClient } from "../core/http-client";

export interface CheckPageSettingPayload {
  path: string;
  label?: string;
}

export interface UpdatePageSettingPayload {
  isUnderConstruction?: boolean;
  message?: string | null;
  label?: string;
}

export const createPageSettingsApi = (http: HttpClient) => {
  return {
    check<T = unknown>(body: CheckPageSettingPayload): Promise<T> {
      return http.post<T>("/page-settings/check", { body });
    },
    list<T = unknown>(): Promise<T> {
      return http.get<T>("/page-settings");
    },
    update<T = unknown>(id: string, body: UpdatePageSettingPayload): Promise<T> {
      return http.patch<T>(`/page-settings/${id}`, {
        auth: "admin",
        body,
      });
    },
  };
};

