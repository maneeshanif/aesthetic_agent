/**
 * Thin fetch wrapper around the FastAPI backend.
 *
 * Commit 1 provides the transport + error envelope contract only. Typed
 * resource methods (patients, knowledge, chat, tenant) are added in Commit 3.
 */
import { apiBaseUrl } from "@/lib/utils";

export interface ApiError {
  code: string;
  message: string;
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.status = status;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Supabase access token; forwarded as `Authorization: Bearer`. */
  token?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const err: ApiError = payload?.error ?? { code: "unknown", message: res.statusText };
    throw new ApiClientError(res.status, err);
  }

  return payload as T;
}
