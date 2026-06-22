import type { ApiEnvelope } from "@/types/capper";

const API_BASE = import.meta.env.VITE_CAPPER_API_URL ?? "/api/v1";

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export type ApiErrorKind =
  | "unauthorized" // 401 — not authenticated
  | "pending" // 403 — SSO user awaiting admin approval (or disabled)
  | "tenant_scope" // 403 — not a member of the requested org/account/project
  | "account_suspended" // 403 — account is suspended
  | "csrf" // 403 — missing/invalid CSRF token
  | "forbidden" // 403 — denied by policy
  | "not_found"
  | "unknown";

/**
 * ApiError carries the HTTP status and a classified `kind` so the UI can react
 * to the auth-edge responses the control plane returns — in particular the
 * tenant-scope 403 ("not authorized for account/org/project …") introduced when
 * the API began validating the X-Capper-* headers against the principal's
 * memberships. Extends Error, so existing `catch (e) { e.message }` callers and
 * the previous `{ status }` shape keep working.
 */
export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = classify(status, message);
    if (this.kind === "tenant_scope") {
      // The selected tenant context is no longer valid for this principal (e.g.
      // stale localStorage from a previous login). Clear it so the next request
      // falls back to the principal's default scope instead of looping on 403.
      clearTenantContext();
    }
  }
}

function classify(status: number, message: string): ApiErrorKind {
  const m = message.toLowerCase();
  if (status === 401) return "unauthorized";
  if (status === 404) return "not_found";
  if (status === 403) {
    if (m.includes("pending approval") || m.includes("account disabled")) return "pending";
    if (m.includes("not authorized for account") ||
        m.includes("not authorized for org") ||
        m.includes("not authorized for project")) return "tenant_scope";
    if (m.includes("account suspended")) return "account_suspended";
    if (m.includes("csrf")) return "csrf";
    return "forbidden";
  }
  return "unknown";
}

function clearTenantContext() {
  localStorage.removeItem("currentAccountID");
  localStorage.removeItem("currentOrgID");
  localStorage.removeItem("currentProjectID");
}

export function isPendingError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.kind === "pending";
}

export function isTenantScopeError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.kind === "tenant_scope";
}

function buildHeaders(options: RequestInit): HeadersInit {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> ?? {}),
  };
  // CSRF token: prefer the in-memory value (set at login), else read the
  // capper_csrf cookie so it survives reloads and the Google redirect.
  const csrf = csrfToken ?? readCookie("capper_csrf");
  if (csrf) {
    headers["X-CSRF-Token"] = csrf;
  }
  const accountID = localStorage.getItem("currentAccountID");
  if (accountID) headers["X-Capper-Account-ID"] = accountID;
  const orgID = localStorage.getItem("currentOrgID");
  if (orgID) headers["X-Capper-Org-ID"] = orgID;
  const projectID = localStorage.getItem("currentProjectID");
  if (projectID) headers["X-Capper-Project-ID"] = projectID;
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
    credentials: "include",
  });

  if (!res.ok) {
    let message = `API request failed: ${res.status}`;
    try {
      const body = (await res.json()) as ApiEnvelope<unknown>;
      if (body.error) message = body.error;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = (await res.json()) as ApiEnvelope<T> | T;
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data as T;
  }
  return body as T;
}

export async function apiFetchWithCaps<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; capabilities?: ApiEnvelope<T>["capabilities"] }> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
    credentials: "include",
  });
  if (!res.ok) {
    let message = `API request failed: ${res.status}`;
    try {
      const body = (await res.json()) as ApiEnvelope<unknown>;
      if (body.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, res.status);
  }
  const body = (await res.json()) as ApiEnvelope<T>;
  return { data: body.data as T, capabilities: body.capabilities };
}

export { API_BASE };
