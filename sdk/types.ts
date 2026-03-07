export type MaybePromise<T> = T | Promise<T>;

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type QueryParams = Record<string, QueryValue>;

export type AuthMode = "none" | "user" | "admin";

export interface SdkConfig {
  baseUrl: string;
  apiPrefix?: string;
  getUserToken?: () => MaybePromise<string | null | undefined>;
  getAdminToken?: () => MaybePromise<string | null | undefined>;
  defaultHeaders?: Record<string, string>;
  fetcher?: typeof fetch;
}

export interface RequestOptions {
  auth?: AuthMode;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

