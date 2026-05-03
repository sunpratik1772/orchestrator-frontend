import { useState } from "react";
import { useListWorkflows, useDeleteWorkflow, useExecuteWorkflow, getListWorkflowsQueryKey } from "@/api-client";
import { useQueryClient } from "@tanstack/react-query";
import Shell from "@/components/layout/Shell";
import { Link, useLocation } from "wouter";
import {
  Plus, Search, Play, Pencil, Trash2, GitMerge, Clock,
  CheckCircle2, XCircle, Archive, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    draft: { label: "Draft", cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
    archived: { label: "Archived", cls: "bg-zinc-900 text-zinc-600 border-zinc-800" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider border", s.cls)}>
      {s.label}
    </span>
  );
}

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WorkflowList() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const workflows = useListWorkflows();
  const deleteWf = useDeleteWorkflow();
  const executeWf = useExecuteWorkflow();

  const filtered = (workflows.data ?? []).filter(
    (wf) =>
      wf.name.toLowerCase().includes(search.toLowerCase()) ||
      (wf.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete workflow "${name}"?`)) return;
    await deleteWf.mutateAsync({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleRun = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({ title: `Running "${name}"...` });
    await executeWf.mutateAsync({ id, data: {} }, {
      onSuccess: (result) => {
        qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({
          title: `Execution ${result.status}`,
          description: `Completed in ${result.durationMs}ms`,
        });
      },
      onError: () => toast({ title: "Execution failed", variant: "destructive" }),
    });
  };

  return (
    <Shell>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {workflows.data?.length ?? 0} workflow{workflows.data?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/workflows/new">
            <button
              data-testid="button-new-workflow"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Workflow
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-testid="input-search"
            type="search"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Runs</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Last Run</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {workflows.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-4" colSpan={6}>
                      <div className="h-4 bg-border/50 rounded animate-pulse w-2/3" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <GitMerge className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No workflows match your search" : "No workflows yet"}
                    </p>
                    {!search && (
                      <Link href="/workflows/new">
                        <button className="mt-3 text-xs text-primary hover:underline">Create one now</button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((wf) => (
                  <tr
                    key={wf.id}
                    data-testid={`row-workflow-${wf.id}`}
                    onClick={() => setLocation(`/workflows/${wf.id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                            {wf.name}
                          </div>
                          {wf.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{wf.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <StatusBadge status={wf.status} />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                        <Play className="w-3 h-3" /> {wf.runCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(wf.lastRunAt ?? null)}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(wf.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          data-testid={`button-run-${wf.id}`}
                          onClick={(e) => handleRun(wf.id, wf.name, e)}
                          className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                          title="Run"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          data-testid={`button-edit-${wf.id}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLocation(`/workflows/${wf.id}`); }}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          data-testid={`button-delete-${wf.id}`}
                          onClick={(e) => handleDelete(wf.id, wf.name, e)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
