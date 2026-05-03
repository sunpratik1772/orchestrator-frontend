import { useState, useEffect, useRef } from "react";
import { Server, Check, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BACKEND_OPTIONS,
  getStoredBackendId,
  getStoredCustomUrl,
  setActiveBackend,
  type BackendId,
} from "@/lib/apiBase";
import { cn } from "@/lib/utils";

export function BackendSwitcher() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<BackendId>(() => getStoredBackendId());
  const [customUrl, setCustomUrl] = useState<string>(() => getStoredCustomUrl());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function pick(id: BackendId, url?: string) {
    setActive(id);
    setActiveBackend(id, url);
    // Cancel in-flight requests so old-backend responses can't repopulate
    // the cache after the swap, then refetch everything from the new backend.
    await qc.cancelQueries();
    qc.invalidateQueries();
    if (id !== "custom") setOpen(false);
  }

  const activeOption = BACKEND_OPTIONS.find(o => o.id === active);
  const activeLabel = active === "custom" ? "Custom" : (activeOption?.label.split(" ")[0] ?? "Backend");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Switch between TypeScript and Python backends"
        className="mx-0.5 flex h-7 w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]"
      >
        <Server className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--c-text-2)" }} />
        <span
          className="min-w-0 flex-1 truncate text-left text-[13px]"
          style={{ color: "var(--c-text-1)", fontWeight: 450 }}
        >
          Backend: {activeLabel}
        </span>
        <ChevronDown className="h-2.5 w-2.5" style={{ color: "var(--c-text-3)" }} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-lg p-1 z-50 shadow-xl"
          style={{ backgroundColor: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
        >
          {BACKEND_OPTIONS.map(opt => (
            <div key={opt.id}>
              <button
                onClick={() => { void pick(opt.id, opt.id === "custom" ? customUrl : undefined); }}
                className={cn(
                  "w-full flex items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--c-overlay-2)]",
                  active === opt.id && "bg-[var(--c-overlay-1)]"
                )}
              >
                <div className="w-3.5 flex-shrink-0 pt-0.5">
                  {active === opt.id && <Check className="w-3 h-3 text-violet-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px]" style={{ color: "var(--c-text-1)", fontWeight: 500 }}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate font-mono" style={{ color: "var(--c-text-3)" }}>
                    {opt.id === "custom" ? customUrl || "(set URL below)" : opt.url}
                  </div>
                </div>
              </button>
              {opt.id === "custom" && active === "custom" && (
                <div className="px-2 pb-2 pt-1">
                  <input
                    type="text"
                    value={customUrl}
                    placeholder="https://my-backend.example.com"
                    onChange={e => setCustomUrl(e.target.value)}
                    onBlur={() => { void pick("custom", customUrl); }}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        void pick("custom", customUrl);
                        setOpen(false);
                      }
                    }}
                    className="w-full px-2 py-1 text-[11px] font-mono rounded border bg-transparent focus:outline-none focus:ring-1"
                    style={{
                      color: "var(--c-text-1)",
                      borderColor: "var(--c-border)",
                      backgroundColor: "var(--c-bg)",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          <div
            className="px-2 py-1.5 mt-1 text-[10px]"
            style={{ color: "var(--c-text-3)", borderTop: "1px solid var(--c-border)" }}
          >
            Switching reloads all queries from the new backend.
          </div>
        </div>
      )}
    </div>
  );
}
