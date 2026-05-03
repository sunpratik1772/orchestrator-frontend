import { useMemo, useState } from "react";
import { Table2, Braces, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  output: Record<string, any> | undefined;
  error?: string | null;
}

type Tab = "rows" | "json" | "logs";

const PREVIEW_ROWS = 25;

function pickRows(output: Record<string, any> | undefined): any[] | null {
  if (!output) return null;
  if (Array.isArray(output.rows)) return output.rows;
  // Condition node: prefer the larger branch by default
  if (output._type === "condition") {
    const t = output.rows_true ?? [];
    const f = output.rows_false ?? [];
    return (t.length >= f.length ? t : f);
  }
  // Router node: flatten all bucket rows
  if (output._type === "router" && output.buckets && typeof output.buckets === "object") {
    return Object.values(output.buckets).flat() as any[];
  }
  if (Array.isArray(output.csv) || typeof output.csv === "string") return null;
  return null;
}

function pickLogs(output: Record<string, any> | undefined): string[] | null {
  if (!output) return null;
  if (Array.isArray(output.logs)) return output.logs.map(String);
  if (typeof output.message === "string") return [output.message];
  if (typeof output.response === "string") return [output.response];
  return null;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

export function StepOutputView({ output, error }: Props) {
  const rows = useMemo(() => pickRows(output), [output]);
  const logs = useMemo(() => pickLogs(output), [output]);

  const initialTab: Tab = error ? "json" : rows && rows.length > 0 ? "rows" : logs ? "logs" : "json";
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: { id: Tab; label: string; icon: any; available: boolean; count?: number }[] = [
    { id: "rows", label: "Rows", icon: Table2, available: !!rows && rows.length > 0, count: rows?.length },
    { id: "logs", label: "Logs", icon: FileText, available: !!logs && logs.length > 0, count: logs?.length },
    { id: "json", label: "JSON", icon: Braces, available: true },
  ];

  return (
    <div
      className="rounded-md mt-1.5 overflow-hidden"
      style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)" }}
    >
      {error && (
        <div
          className="flex items-start gap-2 px-3 py-2 text-[10px] font-mono"
          style={{
            backgroundColor: "var(--c-danger-bg)",
            color: "var(--c-danger-text)",
            borderBottom: "1px solid var(--c-border)",
          }}
        >
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Tab strip */}
      <div className="flex items-center gap-0.5 px-1.5 pt-1.5" style={{ backgroundColor: "var(--c-surface-3)" }}>
        {tabs.filter(t => t.available).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded-t transition-colors",
              tab === t.id
                ? "text-[var(--c-text-1)] bg-[var(--c-bg)]"
                : "text-[var(--c-text-3)] hover:text-[var(--c-text-2)]"
            )}
            style={tab === t.id
              ? { borderTop: "1px solid var(--c-border)", borderLeft: "1px solid var(--c-border)", borderRight: "1px solid var(--c-border)" }
              : undefined}
          >
            <t.icon className="w-2.5 h-2.5" />
            {t.label}
            {typeof t.count === "number" && (
              <span className="text-[9px]" style={{ color: "var(--c-text-4)" }}>· {t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[260px] overflow-auto">
        {tab === "rows" && rows && rows.length > 0 && <RowsTable rows={rows} />}
        {tab === "logs" && logs && (
          <pre className="text-[10px] font-mono p-2.5 whitespace-pre-wrap break-words" style={{ color: "var(--c-text-1)" }}>
            {logs.join("\n")}
          </pre>
        )}
        {tab === "json" && (
          <pre className="text-[10px] font-mono p-2.5 whitespace-pre-wrap break-words" style={{ color: "var(--c-text-1)" }}>
            {JSON.stringify(output ?? {}, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function RowsTable({ rows }: { rows: any[] }) {
  const preview = rows.slice(0, PREVIEW_ROWS);
  const columns = useMemo(() => {
    const seen = new Set<string>();
    for (const r of preview) {
      if (r && typeof r === "object" && !Array.isArray(r)) {
        for (const k of Object.keys(r)) seen.add(k);
      }
    }
    return Array.from(seen).slice(0, 12);
  }, [preview]);

  // Primitive list (numbers, strings) — render as a single-column table
  if (columns.length === 0) {
    return (
      <table className="w-full text-[10px] font-mono">
        <tbody>
          {preview.map((v, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--c-border-soft)" }}>
              <td className="px-2.5 py-1 text-[var(--c-text-4)] w-6 text-right">{i + 1}</td>
              <td className="px-2.5 py-1 text-[var(--c-text-1)]">{formatCell(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <table className="w-full text-[10px] font-mono border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky top-0 z-10 px-2 py-1.5 text-right w-7 text-[var(--c-text-4)]"
                style={{ backgroundColor: "var(--c-surface-3)", borderBottom: "1px solid var(--c-border)" }}>
              #
            </th>
            {columns.map(col => (
              <th key={col} className="sticky top-0 z-10 px-2 py-1.5 text-left text-[var(--c-text-2)] font-semibold whitespace-nowrap"
                  style={{ backgroundColor: "var(--c-surface-3)", borderBottom: "1px solid var(--c-border)" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} className="hover:bg-[var(--c-overlay-1)]">
              <td className="px-2 py-1 text-right text-[var(--c-text-4)] tabular-nums"
                  style={{ borderBottom: "1px solid var(--c-border-soft)" }}>{i + 1}</td>
              {columns.map(col => {
                const cell = formatCell(row?.[col]);
                return (
                  <td
                    key={col}
                    title={cell}
                    className="px-2 py-1 text-[var(--c-text-1)] truncate max-w-[200px]"
                    style={{ borderBottom: "1px solid var(--c-border-soft)" }}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > PREVIEW_ROWS && (
        <div className="px-2.5 py-1.5 text-[9px] font-mono text-[var(--c-text-3)] text-center"
             style={{ borderTop: "1px solid var(--c-border-soft)" }}>
          Showing {PREVIEW_ROWS} of {rows.length} rows · open the JSON tab for the rest
        </div>
      )}
    </div>
  );
}
