import { auth } from "./firebase";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Enhanced fetch wrapper for calling our own Next.js API routes
 * (src/app/api/**). Endpoints are relative (e.g. "/api/wallet") — same
 * origin, no separate backend URL. Every authenticated request carries a
 * real Firebase ID token, verified server-side by the route handler (see
 * src/lib/firebase-admin.ts). This replaced a previous custom-JWT scheme
 * that pointed at a nonexistent external API.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // All our route handlers live under src/app/api/**, so normalize bare
  // paths like "/wallet" to "/api/wallet". This keeps every existing page
  // (history, kyc, bill-payments, etc.) working without touching dozens of
  // call sites — they all already call endpoints like "/wallet",
  // "/transactions", "/kyc/status" from the original mock-API design.
  const url = endpoint.startsWith("/api/") || endpoint.startsWith("http") ? endpoint : `/api${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const response = await fetch(url, { ...options, headers });

  const contentType = response.headers.get("content-type");
  let data: any;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.message || data?.error || "API Request Failed", data);
  }

  if (data && typeof data === "object" && data.success === true && "data" in data) {
    return data.data;
  }

  return data;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => apiFetch(endpoint, { ...options, method: "GET" }),
  post: (endpoint: string, body: any, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => apiFetch(endpoint, { ...options, method: "DELETE" }),
};
