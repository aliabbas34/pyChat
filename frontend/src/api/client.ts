export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

export const tokenStore = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  save(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(formatErrorData(data));
  }
}

/** Turn DRF error bodies ({detail} or {field: [messages]}) into one line. */
function formatErrorData(data: unknown): string {
  if (!data || typeof data !== "object") return "Something went wrong.";
  if ("detail" in data) return String(data.detail);
  return Object.entries(data)
    .map(([field, messages]) => `${field}: ${[messages].flat().join(" ")}`)
    .join(" ");
}

let onUnauthorized: () => void = () => {};

/** Called when the session can no longer be refreshed (e.g. refresh token expired). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

let refreshing: Promise<string | null> | null = null;

/**
 * Get a new access token. Concurrent callers share one request.
 * Resolves to null if the refresh token was rejected; throws if the server could not be reached.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const refresh = tokenStore.refresh();
    if (!refresh) return null;
    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new ApiError(response.status, null);
    const { access } = await response.json();
    tokenStore.save(access);
    return access;
  })().finally(() => (refreshing = null));
  return refreshing;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function request<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  const send = () => {
    const token = tokenStore.access();
    return fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response = await send();
  if (response.status === 401 && tokenStore.refresh()) {
    if (await refreshAccessToken()) {
      response = await send();
    } else {
      onUnauthorized();
    }
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}
