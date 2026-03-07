import { ApiError, QueryParams, RequestOptions, SdkConfig } from "../types";

const normalizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.replace(/\/+$/, "");
};

const normalizeApiPrefix = (apiPrefix?: string): string => {
  if (!apiPrefix) return "/api";
  const trimmed = apiPrefix.trim();
  if (!trimmed) return "/api";
  return trimmed.startsWith("/") ? trimmed.replace(/\/+$/, "") : `/${trimmed.replace(/\/+$/, "")}`;
};

const normalizePath = (path: string): string => {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
};

const appendQueryParams = (url: URL, query?: QueryParams): void => {
  if (!query) return;

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }
};

const isFormData = (value: unknown): value is FormData => {
  return typeof FormData !== "undefined" && value instanceof FormData;
};

const toErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }
  return fallback;
};

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly getUserToken?: SdkConfig["getUserToken"];
  private readonly getAdminToken?: SdkConfig["getAdminToken"];
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetcher: typeof fetch;

  constructor(config: SdkConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiPrefix = normalizeApiPrefix(config.apiPrefix);
    this.getUserToken = config.getUserToken;
    this.getAdminToken = config.getAdminToken;
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.fetcher = config.fetcher ?? fetch;
  }

  private async resolveToken(auth: RequestOptions["auth"]): Promise<string | null> {
    if (auth === "user" && this.getUserToken) {
      const token = await this.getUserToken();
      return token ?? null;
    }

    if (auth === "admin" && this.getAdminToken) {
      const token = await this.getAdminToken();
      return token ?? null;
    }

    return null;
  }

  private buildUrl(path: string, query?: QueryParams): URL {
    const fullPath = `${this.baseUrl}${this.apiPrefix}${normalizePath(path)}`;
    const url = new URL(fullPath);
    appendQueryParams(url, query);
    return url;
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const token = await this.resolveToken(options.auth ?? "none");

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers ?? {}),
    };

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      if (isFormData(options.body)) {
        body = options.body;
      } else {
        headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
        body = JSON.stringify(options.body);
      }
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await this.fetcher(url.toString(), {
      method,
      headers,
      body,
      signal: options.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = toErrorMessage(payload, `Request failed with status ${response.status}`);
      throw new ApiError(response.status, message, payload);
    }

    return payload as T;
  }

  get<T>(path: string, options: Omit<RequestOptions, "body"> = {}): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  post<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>("POST", path, options);
  }

  put<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>("PUT", path, options);
  }

  patch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>("PATCH", path, options);
  }

  delete<T>(path: string, options: Omit<RequestOptions, "body"> = {}): Promise<T> {
    return this.request<T>("DELETE", path, options);
  }
}

