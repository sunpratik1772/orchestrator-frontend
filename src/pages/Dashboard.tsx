import { useGetStats, useListWorkflows } from "@/api-client";
import Shell from "@/components/layout/Shell";
import { Link } from "wouter";
import { Play, GitMerge, CheckCircle, XCircle, Clock, Plus, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    draft: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    archived: "bg-zinc-900 text-zinc-600 border border-zinc-800",
  };
  return (
    <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider", map[status] ?? map.draft)}>
      {status}
    </span>
  );
}

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const stats = useGetStats();
  const workflows = useListWorkflows();

  const s = stats.data;
  const successRate = s && s.totalExecutions > 0
    ? Math.round((s.successfulExecutions / s.totalExecutions) * 100)
    : 0;

  const statCards = [
    {
      label: "Total Workflows",
      value: s?.totalWorkflows ?? 0,
      icon: GitMerge,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Total Executions",
      value: s?.totalExecutions ?? 0,
      icon: Play,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Avg Duration",
      value: s ? `${(s.avgDurationMs / 1000).toFixed(1)}s` : "—",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <Shell>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">dbSherpa Studio — visual data workflow builder</p>
          </div>
          <Link href="/workflows/new">
            <button
              data-testid="button-create-workflow"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Workflow
            </button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="bg-card border border-border rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.bg)}>
                  <card.icon className={cn("w-4 h-4", card.color)} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground font-mono">
                {stats.isLoading ? <span className="opacity-30">—</span> : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Workflows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Workflows</h2>
            <Link href="/workflows">
              <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          <div className="space-y-2">
            {workflows.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
              ))
            ) : workflows.data && workflows.data.length > 0 ? (
              workflows.data.slice(0, 6).map((wf) => (
                <Link key={wf.id} href={`/workflows/${wf.id}`}>
                  <div
                    data-testid={`workflow-card-${wf.id}`}
                    className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {wf.name}
                        </div>
                        {wf.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{wf.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Play className="w-3 h-3" />
                        {wf.runCount}
                      </div>
                      <div className="font-mono">{timeAgo(wf.lastRunAt ?? null)}</div>
                      <StatusBadge status={wf.status} />
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <GitMerge className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No workflows yet</p>
                <Link href="/workflows/new">
                  <button className="mt-4 text-xs text-primary hover:underline">Create your first workflow</button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Failed executions summary */}
        {s && s.failedExecutions > 0 && (
          <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">
              {s.failedExecutions} failed execution{s.failedExecutions !== 1 ? "s" : ""} across your workflows
            </span>
          </div>
        )}
      </div>
    </Shell>
  );
}
