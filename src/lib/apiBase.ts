import { setBaseUrl } from "@/api-client";

export type BackendId = "ts" | "python" | "custom";

export interface BackendOption {
  id: BackendId;
  label: string;
  description: string;
  url: string;
}

const STORAGE_KEY = "dbsherpa:backend";
const CUSTOM_URL_KEY = "dbsherpa:backend:customUrl";

// All generated client URLs already include the `/api/...` prefix, so the
// "url" here is the *origin* to prepend. Empty string = same-origin (the
// shared Replit proxy already routes /api → the TS api-server).
export const BACKEND_OPTIONS: BackendOption[] = [
  {
    id: "ts",
    label: "TypeScript backend",
    description: "Express server served from this app's /api",
    url: "",
  },
  {
    id: "python",
    label: "Python backend",
    description: "FastAPI rewrite (local at :8000)",
    url: "http://localhost:8000",
  },
  {
    id: "custom",
    label: "Custom URL",
    description: "Point at any compatible backend origin",
    url: "",
  },
];

export function getStoredBackendId(): BackendId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "ts" || raw === "python" || raw === "custom") return raw;
  } catch {}
  return "ts";
}

export function getStoredCustomUrl(): string {
  try {
    return localStorage.getItem(CUSTOM_URL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getActiveBackendUrl(): string {
  const id = getStoredBackendId();
  const raw = id === "custom"
    ? getStoredCustomUrl()
    : (BACKEND_OPTIONS.find(b => b.id === id)?.url ?? "");
  // Normalize: strip trailing slashes so we never get "//api/..."
  return raw.replace(/\/+$/, "");
}

export function setActiveBackend(id: BackendId, customUrl?: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    if (id === "custom" && customUrl != null) {
      localStorage.setItem(CUSTOM_URL_KEY, customUrl);
    }
  } catch {}
  applyBackend();
}

/**
 * Apply the stored backend to the generated React Query client. Call this once
 * at app boot AND any time the user switches backend.
 */
export function applyBackend(): void {
  const url = getActiveBackendUrl();
  // Generated client URLs already begin with `/api/...`. We only override the
  // origin (e.g. "http://localhost:8000"). Empty string = same-origin.
  setBaseUrl(url || null);
}

/**
 * Build a URL for hand-rolled fetches (e.g. the Copilot SSE stream that
 * doesn't go through the generated client). Pass the same `/api/...` path
 * the generated client would use; we'll prepend the active origin.
 */
export function apiUrl(path: string): string {
  const base = getActiveBackendUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
