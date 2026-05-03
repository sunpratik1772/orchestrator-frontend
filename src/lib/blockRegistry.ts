// Live block-registry hook. Fetches /api/blocks from whichever backend is
// active (TS or Python) and exposes a typed shape the UI can render directly.
// On any failure (e.g. backend down, schema missing) callers fall back to
// hardcoded constants so the UI never breaks.

import { useQuery } from "@tanstack/react-query";
import { apiUrl, getStoredBackendId, getStoredCustomUrl } from "./apiBase";

export interface RemoteFieldSpec {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  widget?: string;
  placeholder?: string;
  visible_if?: Record<string, unknown>;
}

export interface RemoteBlockEntry {
  type: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  fields?: RemoteFieldSpec[];
}

export function useBlockRegistry() {
  return useQuery<RemoteBlockEntry[]>({
    // Re-fetch when backend switcher changes.
    queryKey: ["block-registry", getStoredBackendId(), getStoredCustomUrl()],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/blocks"));
      if (!res.ok) throw new Error(`/api/blocks → ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });
}
