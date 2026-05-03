import { useState, useMemo } from "react";
import Shell from "@/components/layout/Shell";
import { Link } from "wouter";
import {
  BookOpen, Download, Search, Filter, ArrowUpDown, X, ChevronRight,
  Clock, CheckCircle2, XCircle, Loader2, Copy, ExternalLink, Zap,
  AlertTriangle, Info, Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer, Cell
} from "recharts";
import { useQuery } from "@tanstack/react-query";

const C = {
  BORDER: "var(--c-border)",
  SURFACE1: "var(--c-surface-1)",
  SURFACE2: "var(--c-surface-2)",
  SURFACE_ACTIVE: "var(--c-surface-active)",
  TEXT_PRIMARY: "var(--c-text-0)",
  TEXT_BODY: "var(--c-text-1)",
  TEXT_SECONDARY: "var(--c-text-2)",
  TEXT_ICON: "var(--c-text-2)",
};

const WORKFLOW_COLORS = [
  "#7c3aed","#2563eb","#059669","#d97706","#dc2626",
  "#0891b2","#ea580c","#16a34a","#9333ea","#0d9488",
];

type LogStatus = "completed" | "error" | "running";
type LogTrigger = "manual" | "api" | "schedule" | "webhook" | "copilot";

interface LogEntry {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowColor: string;
  date: string;
  dateISO: string;
  status: LogStatus;
  trigger: LogTrigger;
  duration: string;
  durationMs: number;
  cost: { baseRun: number; modelInput: number; modelOutput: number; total: number; tokensIn: number; tokensOut: number };
  level: "info" | "warning" | "error";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  logs: Array<{ nodeId: string; nodeLabel: string; status: string; durationMs: number; output: unknown; level: number }>;
}

const STATUS_CONFIG: Record<LogStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  completed: { label: "Completed", color: "#4ade80", bg: "rgba(74,222,128,0.1)", icon: CheckCircle2 },
  error:     { label: "Error",     color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: XCircle },
  running:   { label: "Running",   color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  icon: Loader2 },
};

const TRIGGER_CONFIG: Record<LogTrigger, { label: string; color: string; bg: string }> = {
  manual:  { label: "Manual",  color: "var(--c-text-2)", bg: "rgba(179,179,179,0.1)" },
  api:     { label: "API",     color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  schedule:{ label: "Schedule",color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  webhook: { label: "Webhook", color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  copilot: { label: "Copilot", color: "#e879f9", bg: "rgba(232,121,249,0.1)" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(ms: number) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function useAllLogs() {
  return useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const r = await fetch(`${base}/api/logs`);
      if (!r.ok) throw new Error("Failed to fetch logs");
      return r.json();
    },
  });
}

type SortKey = "workflowName" | "dateISO" | "status" | "trigger" | "duration" | "cost";

const COL_HEADERS: { key: SortKey; label: string; w: string }[] = [
  { key: "workflowName", label: "Workflow",  w: "24%" },
  { key: "dateISO",      label: "Date",      w: "18%" },
  { key: "status",       label: "Status",    w: "13%" },
  { key: "cost",         label: "Cost",      w: "12%" },
  { key: "trigger",      label: "Trigger",   w: "13%" },
  { key: "duration",     label: "Duration",  w: "20%" },
];

// Build daily bar chart data from logs
function buildChartData(logs: LogEntry[]) {
  const map = new Map<string, number>();
  for (const l of logs) {
    const d = new Date(l.dateISO).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([date, runs]) => ({ date, runs })).slice(-14);
}

// ─── Detail Drawer ───────────────────────────────────────────────────────────
function DrawerJson({ data, label }: { data: Record<string, unknown>; label: string }) {
  const [open, setOpen] = useState(true);
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 transition-opacity"
        style={{ color: C.TEXT_SECONDARY }}
      >
        <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
        {label}
      </button>
      {open && (
        <div
          className="relative rounded-lg p-3 font-mono text-[11px] overflow-auto max-h-44"
          style={{ backgroundColor: "var(--c-bg)", border: `1px solid ${C.BORDER}`, color: "#a5f3a0", lineHeight: "1.5" }}
        >
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className="absolute top-2 right-2 p-1 rounded hover:opacity-70 transition-opacity"
            title="Copy"
          >
            <Copy className="w-3 h-3" style={{ color: C.TEXT_ICON }} />
          </button>
          <pre className="whitespace-pre-wrap pr-6">{text}</pre>
        </div>
      )}
    </div>
  );
}

function DrawerOutput({ output, label }: { output: Record<string, unknown>; label: string }) {
  const [open, setOpen] = useState(true);
  const text = typeof output?.result === "string"
    ? output.result
    : JSON.stringify(output, null, 2);
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 transition-opacity"
        style={{ color: C.TEXT_SECONDARY }}
      >
        <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
        {label}
      </button>
      {open && (
        <div
          className="relative rounded-lg p-3 text-[11px] overflow-auto max-h-56"
          style={{ backgroundColor: "var(--c-bg)", border: `1px solid ${C.BORDER}`, color: "var(--c-text-1)", lineHeight: "1.6" }}
        >
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className="absolute top-2 right-2 p-1 rounded hover:opacity-70 transition-opacity"
            title="Copy"
          >
            <Copy className="w-3 h-3" style={{ color: C.TEXT_ICON }} />
          </button>
          <pre className="whitespace-pre-wrap pr-6 font-mono">{text}</pre>
        </div>
      )}
    </div>
  );
}

function TraceNode({ log, color }: { log: LogEntry["logs"][0]; color: string }) {
  const [open, setOpen] = useState(false);
  const s = log.status === "completed" ? STATUS_CONFIG.completed : log.status === "error" ? STATUS_CONFIG.error : STATUS_CONFIG.running;
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${C.BORDER}`, backgroundColor: "var(--c-bg)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--c-overlay-2)] transition-colors"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
        <span className="text-[12px] flex-1 text-left" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>{log.nodeLabel}</span>
        <span className="text-[11px] font-mono" style={{ color: C.TEXT_ICON }}>{fmtDuration(log.durationMs)}</span>
        <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} style={{ color: C.TEXT_ICON }} />
      </button>
      {open && log.output !== undefined && (
        <div className="px-3 pb-2">
          <pre
            className="text-[10px] font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-32"
            style={{ backgroundColor: "var(--c-bg)", color: "#a5f3a0", border: `1px solid ${C.BORDER}` }}
          >
            {JSON.stringify(log.output as unknown, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function LogDetailDrawer({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "trace">("overview");
  const s = STATUS_CONFIG[log.status];
  const t = TRIGGER_CONFIG[log.trigger];

  return (
    <div
      className="flex h-full flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 400,
        borderLeft: `1px solid ${C.BORDER}`,
        backgroundColor: "var(--c-bg)",
      }}
    >
      {/* Drawer header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${C.BORDER}` }}
      >
        <div className="flex items-center gap-1">
          {(["overview", "trace"] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={cn(
                "px-3 py-1 rounded-md text-[12px] font-medium transition-colors capitalize",
                tab === t_ ? "text-[#e6e6e6]" : "text-[#939393] hover:text-[#cdcdcd]"
              )}
              style={{ backgroundColor: tab === t_ ? C.SURFACE_ACTIVE : "transparent" }}
            >
              {t_}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" style={{ color: C.TEXT_ICON }} />
        </button>
      </div>

      {/* Drawer body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "overview" && (
          <div className="p-4 space-y-5">
            {/* Meta grid */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Timestamp</span>
                <span className="text-[12px] text-right" style={{ color: C.TEXT_BODY }}>{formatDate(log.dateISO)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Workflow</span>
                <Link href={`/workflows/${log.workflowId}`}>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
                    <div className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: log.workflowColor }} />
                    <span className="text-[12px] font-medium" style={{ color: "#a78bfa" }}>{log.workflowName}</span>
                  </div>
                </Link>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Run ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono" style={{ color: C.TEXT_SECONDARY }}>{log.id.slice(0, 36)}</span>
                  <button onClick={() => navigator.clipboard.writeText(log.id)} className="hover:opacity-70">
                    <Copy className="w-3 h-3" style={{ color: C.TEXT_ICON }} />
                  </button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Level</span>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: log.level === "error" ? "rgba(248,113,113,0.12)" : "rgba(96,165,250,0.12)",
                    color: log.level === "error" ? "#f87171" : "#60a5fa",
                  }}
                >
                  {log.level === "error" ? <AlertTriangle className="w-2.5 h-2.5" /> : <Info className="w-2.5 h-2.5" />}
                  <span className="text-[11px] capitalize">{log.level}</span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Trigger</span>
                <div
                  className="px-2 py-0.5 rounded-md text-[11px]"
                  style={{ backgroundColor: t.bg, color: t.color }}
                >
                  {t.label}
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Duration</span>
                <span className="text-[12px] font-mono" style={{ color: C.TEXT_BODY }}>{fmtDuration(log.durationMs)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Snapshot</span>
                <button className="flex items-center gap-1 text-[12px] hover:opacity-70 transition-opacity" style={{ color: "#a78bfa" }}>
                  <ExternalLink className="w-3 h-3" />
                  View Snapshot
                </button>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: C.BORDER }} />

            {/* Input / Output */}
            <div className="space-y-4">
              <DrawerJson data={log.input} label="Workflow Input" />
              <DrawerOutput output={log.output} label="Workflow Output" />
            </div>

            <div style={{ height: 1, backgroundColor: C.BORDER }} />

            {/* Cost breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
                <span className="text-[12px] font-medium" style={{ color: C.TEXT_SECONDARY }}>Credits</span>
              </div>
              {[
                { label: "Base Run",     val: log.cost.baseRun },
                { label: "Model Input",  val: log.cost.modelInput },
                { label: "Model Output", val: log.cost.modelOutput },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>{label}</span>
                  <span className="text-[12px]" style={{ color: C.TEXT_BODY }}>{val} credit{val !== 1 ? "s" : ""}</span>
                </div>
              ))}
              <div style={{ height: 1, backgroundColor: C.BORDER }} />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{ color: C.TEXT_PRIMARY }}>Total</span>
                <span className="text-[13px] font-semibold" style={{ color: C.TEXT_PRIMARY }}>{log.cost.total} credits</span>
              </div>
              {(log.cost.tokensIn > 0 || log.cost.tokensOut > 0) && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Tokens</span>
                  <span className="text-[11px] font-mono" style={{ color: C.TEXT_SECONDARY }}>
                    {log.cost.tokensIn.toLocaleString()} in · {log.cost.tokensOut.toLocaleString()} out
                  </span>
                </div>
              )}
              {log.cost.tokensIn > 0 && (
                <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>
                  Total includes a 1-credit base charge plus model and tool usage.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "trace" && (
          <div className="p-4 space-y-2">
            {log.logs.length === 0 ? (
              <p className="text-[12px] text-center py-8" style={{ color: C.TEXT_ICON }}>No trace data available</p>
            ) : (
              log.logs.map((step, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: C.SURFACE2, color: C.TEXT_ICON }}
                    >
                      {i + 1}
                    </div>
                    {i < log.logs.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ backgroundColor: C.BORDER }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <TraceNode log={step} color={log.workflowColor} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Logs page ──────────────────────────────────────────────────────────
export default function Logs() {
  const logsQuery = useAllLogs();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dateISO");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "dashboard">("logs");

  const logs: LogEntry[] = logsQuery.data ?? [];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const data = q
      ? logs.filter(
          (l) =>
            l.workflowName.toLowerCase().includes(q) ||
            l.trigger.toLowerCase().includes(q) ||
            l.status.toLowerCase().includes(q)
        )
      : logs;
    return [...data].sort((a, b) => {
      let av: string | number = a[sortKey as keyof typeof a] as string | number;
      let bv: string | number = b[sortKey as keyof typeof b] as string | number;
      if (sortKey === "cost") { av = a.cost.total; bv = b.cost.total; }
      if (sortKey === "duration") { av = a.durationMs; bv = b.durationMs; }
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [logs, search, sortKey, sortDir]);

  const chartData = useMemo(() => buildChartData(logs), [logs]);

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-2.5"
          style={{ borderBottom: `1px solid ${C.BORDER}` }}
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
            <span className="text-sm font-medium" style={{ color: C.TEXT_BODY }}>Logs</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors hover:bg-[var(--c-surface-active)]" style={{ color: C.TEXT_SECONDARY }}>
              <Download className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
              Export
            </button>
            {(["logs", "dashboard"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-2 py-1 rounded-md text-[12px] font-medium transition-colors capitalize"
                style={{
                  backgroundColor: activeTab === t ? C.SURFACE_ACTIVE : "transparent",
                  color: activeTab === t ? C.TEXT_BODY : C.TEXT_SECONDARY,
                }}
              >
                {t === "logs" ? "Logs" : "Dashboard"}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard tab */}
        {activeTab === "dashboard" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Runs",    val: logs.length,                              icon: Zap,          color: "#7c3aed" },
                { label: "Completed",     val: logs.filter(l => l.status==="completed").length, icon: CheckCircle2, color: "#4ade80" },
                { label: "Errors",        val: logs.filter(l => l.status==="error").length,     icon: XCircle,      color: "#f87171" },
                { label: "Avg Duration",  val: logs.length
                    ? fmtDuration(Math.round(logs.reduce((s,l)=>s+l.durationMs,0)/logs.length))
                    : "—",                                                               icon: Clock,         color: "#fbbf24" },
              ].map(({ label, val, icon: Icon, color }) => (
                <div key={label} className="rounded-xl p-4 space-y-2" style={{ backgroundColor: C.SURFACE1, border: `1px solid ${C.BORDER}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>{label}</span>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: C.TEXT_PRIMARY }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: C.SURFACE1, border: `1px solid ${C.BORDER}` }}>
              <h3 className="text-[13px] font-medium mb-4" style={{ color: C.TEXT_SECONDARY }}>Executions per day</h3>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[12px]" style={{ color: C.TEXT_ICON }}>
                  No execution data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barSize={20}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.TEXT_ICON }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.TEXT_ICON }} axisLine={false} tickLine={false} />
                    <RechartTooltip
                      contentStyle={{ backgroundColor: "var(--c-surface-2)", border: `1px solid ${C.BORDER}`, borderRadius: 8, color: C.TEXT_BODY, fontSize: 12 }}
                      cursor={{ fill: "var(--c-surface-2)" }}
                    />
                    <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="#7c3aed" opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Logs tab */}
        {activeTab === "logs" && (
          <>
            {/* Search/filter bar */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-6 py-2.5"
              style={{ borderBottom: `1px solid ${C.BORDER}` }}
            >
              <div className="flex flex-1 items-center gap-2.5">
                <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--c-text-3)]"
                  style={{ color: C.TEXT_BODY }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors hover:bg-[var(--c-surface-active)]" style={{ color: C.TEXT_SECONDARY }}>
                  <Filter className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
                  Filter
                </button>
                <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors hover:bg-[var(--c-surface-active)]" style={{ color: C.TEXT_SECONDARY }}>
                  <ArrowUpDown className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
                  Sort
                </button>
              </div>
            </div>

            {/* Main area: table + drawer */}
            <div className="flex flex-1 overflow-hidden">
              {/* Table */}
              <div className="flex-1 overflow-auto">
                {logsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-20 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.TEXT_ICON }} />
                    <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>Loading logs…</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <BookOpen className="w-10 h-10 opacity-20" style={{ color: C.TEXT_ICON }} />
                    <p className="text-[13px]" style={{ color: C.TEXT_ICON }}>
                      {search ? "No logs match your search" : "No executions yet — run a workflow to see logs here"}
                    </p>
                  </div>
                ) : (
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      {COL_HEADERS.map((h) => <col key={h.key} style={{ width: h.w }} />)}
                    </colgroup>
                    <thead
                      className="sticky top-0 z-10"
                      style={{ backgroundColor: "var(--c-bg)", boxShadow: `inset 0 -1px 0 ${C.BORDER}` }}
                    >
                      <tr>
                        {COL_HEADERS.map(({ key, label }) => (
                          <th key={key} className="h-10 px-4 py-2 text-left align-middle font-normal">
                            <button
                              onClick={() => handleSort(key)}
                              className={cn(
                                "flex items-center gap-1 text-[11px] transition-colors hover:text-[#b3b3b3]",
                                sortKey === key ? "text-[#b3b3b3]" : "text-[#6b6b6b]"
                              )}
                            >
                              {label}
                              {sortKey === key && <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((log) => {
                        const s = STATUS_CONFIG[log.status];
                        const t = TRIGGER_CONFIG[log.trigger];
                        const isSelected = selected?.id === log.id;
                        return (
                          <tr
                            key={log.id}
                            onClick={() => setSelected(isSelected ? null : log)}
                            className="h-11 cursor-pointer transition-colors hover:bg-[var(--c-surface-1)]"
                            style={{
                              borderBottom: `1px solid ${C.BORDER}`,
                              backgroundColor: isSelected ? "var(--c-surface-1)" : "transparent",
                            }}
                          >
                            {/* Workflow */}
                            <td className="px-4 align-middle">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 flex-shrink-0 rounded-[3px]"
                                  style={{ backgroundColor: log.workflowColor }}
                                />
                                <span className="min-w-0 truncate text-[12px] font-medium" style={{ color: C.TEXT_PRIMARY }}>
                                  {log.workflowName}
                                </span>
                              </div>
                            </td>
                            {/* Date */}
                            <td className="px-4 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>
                              {formatDate(log.dateISO)}
                            </td>
                            {/* Status */}
                            <td className="px-4 align-middle">
                              <div
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: s.bg, color: s.color }}
                              >
                                <s.icon className={cn("w-2.5 h-2.5", log.status === "running" && "animate-spin")} />
                                <span className="text-[11px]">{s.label}</span>
                              </div>
                            </td>
                            {/* Cost */}
                            <td className="px-4 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>
                              {log.cost.total > 0 ? `${log.cost.total} credits` : "—"}
                            </td>
                            {/* Trigger */}
                            <td className="px-4 align-middle">
                              <div
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
                                style={{ backgroundColor: t.bg, color: t.color }}
                              >
                                {t.label}
                              </div>
                            </td>
                            {/* Duration */}
                            <td className="px-4 align-middle text-[12px] font-mono" style={{ color: C.TEXT_SECONDARY }}>
                              {fmtDuration(log.durationMs)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Detail drawer */}
              {selected && (
                <LogDetailDrawer log={selected} onClose={() => setSelected(null)} />
              )}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
