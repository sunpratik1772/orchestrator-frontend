import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, SkipForward, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepOutputView } from "./StepOutputView";

interface ExecutionLog {
  nodeId: string;
  nodeLabel: string;
  nodeType?: string;
  status: "running" | "completed" | "failed" | "skipped";
  output?: Record<string, any>;
  error?: string | null;
  durationMs: number;
  startedAt: string;
  parallel?: boolean;
  level?: number;
}

interface ExecutionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isRunning: boolean;
  executionResult: {
    executionId: string;
    status: string;
    logs: ExecutionLog[];
    durationMs: number;
    startedAt: string;
    completedAt?: string | null;
  } | null;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  if (status === "running") return <Loader2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 animate-spin" />;
  return <SkipForward className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
}

function getOutputSummary(log: ExecutionLog): string {
  const o = log.output;
  if (!o || Object.keys(o).length === 0) return "";

  // Row-bearing nodes
  if (typeof o.rowCount === "number" && o.rowCount >= 0) {
    const rows = o.rowCount;
    const type = log.nodeType ?? "";

    if (type === "filter")         return `${rows} rows kept, ${o.removed ?? 0} removed · expr: ${String(o.expression ?? "").slice(0, 40)}`;
    if (type === "sort")           return `${rows} rows sorted by ${o.sortBy} (${o.order})`;
    if (type === "group_by")       return `${rows} groups by ${o.groupBy} · fn: ${o.aggregateFn}`;
    if (type === "deduplicate")    return `${rows} unique rows, ${o.removed ?? 0} duplicates removed`;
    if (type === "join")           return `${rows} rows · ${o.joinType} join on ${o.leftKey}/${o.rightKey}`;
    if (type === "data_merge")     return `${rows} rows merged from ${o.sourceCount} datasets`;
    if (type === "csv_output")     return `Written ${o.rowsWritten} rows → ${o.filename} (${o.byteSize ?? 0} bytes)`;
    if (type === "excel_output")   return `${o.tabs} tabs · ${o.rowsWritten} rows → ${o.filename} (${((o.byteSize ?? 0)/1024).toFixed(1)} KB) · ${(o.tabNames ?? []).join(" | ")}`;
    if (type === "csv_extract")    return `${rows} rows from ${o.source}`;
    if (type === "pdf_extract")    return `${o.pages} pages, ${o.wordCount} words from ${o.source}`;
    if (type === "select_columns") return `${rows} rows · columns: ${(o.columns ?? []).join(", ").slice(0, 60)}`;
    if (type === "map_transform")  return `${rows} rows transformed (${o.mappings ?? 0} mapping${o.mappings !== 1 ? "s" : ""})`;
    if (type === "loop")           return `${o.iterations} iterations over ${rows} rows`;
    if (type === "pause")          return `Paused ${o.duration}ms · rows passed: ${rows}`;
    if (type === "code" || type === "function") return `${rows} rows returned`;
    if (type === "github" && o.pushed) return `Pushed → ${o.repo}/${o.filePath} · commit ${o.commitSha} on ${o.branch}`;
    if (type === "github") return `${o.action} · ${rows} rows · connected`;
    if (type === "evaluator")      return `${o.passed} passed (${o.passRate}), ${o.failed} failed`;
    if (type === "agent")         return o.simulated ? `[sim] ${rows} rows processed` : `${rows} rows · in:${o.tokensIn} out:${o.tokensOut} tokens`;

    return `${rows} rows`;
  }

  // Condition
  if (o._type === "condition") {
    return `${o.trueCount} → true, ${o.falseCount} → false · expr: ${String(o.expression ?? "").slice(0, 30)}`;
  }

  // Router
  if (o._type === "router") {
    const routes = (o.routes ?? []).map((r: any) => `${r.label}:${r.count}`).join(", ");
    return `Routed ${o.rowCount} rows → ${routes}`;
  }

  // Triggers
  if (o.triggered) return `Triggered (${o.trigger ?? "manual"})`;

  // HTTP
  if (o.url) return `${o.method} ${o.url} → ${o.status} (${o.rowCount ?? 0} rows)`;

  // AI Agent response
  if (o.response) return String(o.response).slice(0, 80);

  // Integrations with simulated flag
  if (o.simulated && o.needsIntegration) return `⚠ ${o.needsIntegration}: ${o.message ?? "needs credentials"}`;
  if (o.sent) return `Sent to ${o.to ?? o.channel ?? "destination"}`;

  // Fallback
  const json = JSON.stringify(o);
  return json.slice(0, 80) + (json.length > 80 ? "…" : "");
}

export function ExecutionPanel({ isOpen, onToggle, isRunning, executionResult }: ExecutionPanelProps) {
  const logs = executionResult?.logs ?? [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const levelGroups: ExecutionLog[][] = [];
  for (const log of logs) {
    const lvl = log.level ?? 0;
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(log);
  }

  const toggleStep = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div
      className={cn(
        "border-t border-[var(--c-border)] bg-[var(--c-bg)] transition-all duration-200 flex flex-col flex-shrink-0",
        isOpen ? "h-[420px]" : "h-9"
      )}
    >
      {/* Toggle bar */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-4 h-9 w-full text-left hover:bg-[var(--c-overlay-1)] transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--c-text-3)]">Execution Logs</span>
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-yellow-400">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Running…
            </span>
          )}
          {executionResult && !isRunning && (
            <span className={cn("text-[10px] font-mono", executionResult.status === "completed" ? "text-emerald-400" : "text-red-400")}>
              {executionResult.status} · {executionResult.durationMs}ms · {logs.length} step{logs.length !== 1 ? "s" : ""}
              {levelGroups.some((g) => g?.length > 1) && " · parallel"}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[var(--c-text-3)]" /> : <ChevronUp className="w-3.5 h-3.5 text-[var(--c-text-3)]" />}
      </button>

      {isOpen && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
          {logs.length === 0 && !isRunning && (
            <div className="text-[11px] text-[var(--c-text-4)] font-mono py-6 text-center">
              Run the workflow to see execution logs
            </div>
          )}

          {levelGroups.map((group, levelIdx) => {
            if (!group || group.length === 0) return null;
            const isParallel = group.length > 1;
            return (
              <div key={levelIdx}>
                {isParallel && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Zap className="w-2.5 h-2.5 text-violet-400/50" />
                    <span className="text-[8px] font-mono uppercase tracking-widest text-violet-400/50">
                      Parallel · Level {levelIdx}
                    </span>
                    <div className="flex-1 border-t border-violet-500/10" />
                  </div>
                )}
                <div className={cn(isParallel && "pl-3 border-l border-violet-500/15 space-y-1", !isParallel && "space-y-1")}>
                  {group.map((log) => {
                    const isExpanded = !!expanded[log.nodeId];
                    const hasDetail = !!log.output && Object.keys(log.output).length > 0;
                    return (
                      <div key={log.nodeId} className="rounded-lg overflow-hidden bg-[var(--c-overlay-1)]">
                        <button
                          onClick={() => hasDetail && toggleStep(log.nodeId)}
                          disabled={!hasDetail}
                          className="w-full flex items-start gap-2.5 py-1.5 px-2.5 text-left hover:bg-[var(--c-overlay-2)] transition-colors disabled:cursor-default"
                        >
                          {hasDetail
                            ? (isExpanded
                                ? <ChevronDown className="w-3 h-3 mt-0.5 text-[var(--c-text-3)] flex-shrink-0" />
                                : <ChevronRight className="w-3 h-3 mt-0.5 text-[var(--c-text-3)] flex-shrink-0" />)
                            : <span className="w-3 flex-shrink-0" />}
                          <StatusIcon status={log.status} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[var(--c-text-1)] font-semibold truncate">{log.nodeLabel}</span>
                              {log.nodeType && (
                                <span className="text-[8px] font-mono text-[var(--c-text-4)] flex-shrink-0">
                                  {log.nodeType}
                                </span>
                              )}
                              <span className="text-[9px] font-mono text-[var(--c-text-4)] flex-shrink-0 ml-auto">{log.durationMs}ms</span>
                              {log.output?.needsIntegration && (
                                <span className="text-[8px] font-mono text-amber-400/70 border border-amber-400/20 rounded px-1 flex-shrink-0">
                                  needs creds
                                </span>
                              )}
                            </div>
                            {log.error && (
                              <div className="text-[9px] text-red-400 font-mono mt-0.5 break-words">{log.error}</div>
                            )}
                            {!log.error && log.output && (
                              <div className="text-[9px] text-[var(--c-text-3)] font-mono mt-0.5 truncate">
                                {getOutputSummary(log)}
                              </div>
                            )}
                          </div>
                        </button>
                        {isExpanded && hasDetail && (
                          <div className="px-2.5 pb-2">
                            <StepOutputView output={log.output} error={log.error} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
