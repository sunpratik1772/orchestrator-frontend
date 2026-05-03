import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Play, Bot, Code2, GitBranch, Globe, ArrowRight, StickyNote,
  Webhook, Clock, MessageSquare, Mail, Github, Zap,
  Table2, Filter, Download, Layers, Database, FileText,
  Wand2, ArrowUpDown, BarChart3, Copy, Merge, Share2,
  RefreshCw, PauseCircle, FunctionSquare, CheckSquare,
  BookOpen, Cpu, FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeMeta = { icon: React.ComponentType<any>; color: string; border: string; label: string; badge?: string };

const NODE_META: Record<string, NodeMeta> = {
  // Triggers
  manual_trigger:  { icon: Play,           color: "text-violet-400", border: "border-l-violet-500",  label: "Trigger"      },
  api_trigger:     { icon: Webhook,         color: "text-violet-400", border: "border-l-violet-500",  label: "API Trigger"  },
  schedule:        { icon: Clock,           color: "text-violet-400", border: "border-l-violet-500",  label: "Schedule"     },
  webhook_trigger: { icon: Zap,            color: "text-violet-400", border: "border-l-violet-500",  label: "Webhook"      },
  // Data
  csv_extract:     { icon: Table2,          color: "text-sky-400",    border: "border-l-sky-500",     label: "CSV"          },
  pdf_extract:     { icon: FileText,        color: "text-sky-400",    border: "border-l-sky-500",     label: "PDF"          },
  db_query:        { icon: Database,        color: "text-sky-400",    border: "border-l-sky-500",     label: "DB Query"     },
  http:            { icon: Globe,           color: "text-sky-400",    border: "border-l-sky-500",     label: "HTTP"         },
  // Transform
  filter:          { icon: Filter,          color: "text-amber-400",  border: "border-l-amber-500",   label: "Filter"       },
  map_transform:   { icon: Wand2,           color: "text-amber-400",  border: "border-l-amber-500",   label: "Map"          },
  select_columns:  { icon: CheckSquare,     color: "text-amber-400",  border: "border-l-amber-500",   label: "Select"       },
  sort:            { icon: ArrowUpDown,     color: "text-amber-400",  border: "border-l-amber-500",   label: "Sort"         },
  group_by:        { icon: BarChart3,       color: "text-amber-400",  border: "border-l-amber-500",   label: "Group By"     },
  deduplicate:     { icon: Copy,            color: "text-amber-400",  border: "border-l-amber-500",   label: "Dedup"        },
  join:            { icon: Merge,           color: "text-amber-400",  border: "border-l-amber-500",   label: "Join"         },
  data_merge:      { icon: Layers,          color: "text-amber-400",  border: "border-l-amber-500",   label: "Merge"        },
  csv_output:      { icon: Download,        color: "text-amber-400",  border: "border-l-amber-500",   label: "CSV Out"      },
  // Logic
  condition:       { icon: GitBranch,       color: "text-cyan-400",   border: "border-l-cyan-500",    label: "Condition"    },
  router:          { icon: Share2,          color: "text-cyan-400",   border: "border-l-cyan-500",    label: "Router"       },
  loop:            { icon: RefreshCw,       color: "text-cyan-400",   border: "border-l-cyan-500",    label: "Loop"         },
  pause:           { icon: PauseCircle,     color: "text-cyan-400",   border: "border-l-cyan-500",    label: "Pause"        },
  code:            { icon: Code2,           color: "text-cyan-400",   border: "border-l-cyan-500",    label: "Code"         },
  function:        { icon: FunctionSquare,  color: "text-cyan-400",   border: "border-l-cyan-500",    label: "Function"     },
  // AI
  agent:           { icon: Bot,             color: "text-purple-400", border: "border-l-purple-500",  label: "AI Agent"     },
  evaluator:       { icon: CheckSquare,     color: "text-purple-400", border: "border-l-purple-500",  label: "Evaluator"    },
  // Output
  response:        { icon: ArrowRight,       color: "text-amber-300",  border: "border-l-amber-400",   label: "Response"      },
  excel_output:    { icon: FileSpreadsheet,  color: "text-emerald-400",border: "border-l-emerald-500", label: "Excel Export"  },
  note:            { icon: StickyNote,       color: "text-zinc-400",   border: "border-l-zinc-600",    label: "Note"          },
  // Integrations
  gmail:           { icon: Mail,            color: "text-red-400",    border: "border-l-red-500",     label: "Gmail",       badge: "integration" },
  github:          { icon: Github,          color: "text-zinc-300",   border: "border-l-zinc-500",    label: "GitHub",      badge: "connected" },
  slack:           { icon: MessageSquare,   color: "text-purple-400", border: "border-l-purple-500",  label: "Slack",       badge: "integration" },
  notion:          { icon: BookOpen,        color: "text-zinc-300",   border: "border-l-zinc-500",    label: "Notion",      badge: "integration" },
  mcp:             { icon: Cpu,             color: "text-teal-400",   border: "border-l-teal-500",    label: "MCP",         badge: "integration" },
};

const TRIGGER_TYPES = new Set(["manual_trigger", "api_trigger", "schedule", "webhook_trigger"]);
const CONDITION_TYPES = new Set(["condition"]);
const ROUTER_TYPES = new Set(["router"]);
const SINK_TYPES = new Set(["response", "excel_output"]);

export function CustomNode({ data, selected }: NodeProps) {
  const type = (data.type as string) ?? "agent";
  const meta = NODE_META[type] ?? { icon: Zap, color: "text-primary", border: "border-l-primary", label: type };
  const Icon = meta.icon;
  const isTrigger = TRIGGER_TYPES.has(type);
  const isCondition = CONDITION_TYPES.has(type);
  const isRouter = ROUTER_TYPES.has(type);
  const isSink = SINK_TYPES.has(type);

  // Config preview: pick the most informative key
  const cfg = (data.config as Record<string, any>) ?? {};
  const previewKeys = Object.keys(cfg).filter((k) => cfg[k] && String(cfg[k]).trim().length > 0).slice(0, 2);

  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[260px] bg-[var(--c-surface-3)] border border-[var(--c-border)] border-l-2 rounded-xl shadow-xl transition-all",
        meta.border,
        selected && "border-[var(--c-border)] ring-1 ring-primary/50 shadow-primary/10 shadow-xl"
      )}
    >
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-[var(--c-overlay-2)]">
            <Icon className={cn("w-3 h-3", meta.color)} />
          </div>
          <span className={cn("text-[9px] font-mono uppercase tracking-wider font-semibold", meta.color)}>
            {meta.label}
          </span>
          {meta.badge === "integration" && (
            <span className="ml-auto text-[8px] font-mono uppercase tracking-wider text-[var(--c-text-4)] border border-[var(--c-border)] rounded px-1 py-0.5">
              plug-in
            </span>
          )}
        </div>
        <div className="text-[11px] font-semibold text-[var(--c-text-0)] font-mono leading-tight">
          {(data.label as string) || meta.label}
        </div>
        {Boolean(data.description) && (
          <div className="text-[10px] text-[var(--c-text-3)] mt-0.5 leading-snug line-clamp-2">
            {String(data.description)}
          </div>
        )}
      </div>

      {/* Config preview */}
      {previewKeys.length > 0 && (
        <div className="mx-3 mb-2.5 px-2 py-1.5 bg-[var(--c-overlay-3)] rounded-md border border-[var(--c-border-soft)] space-y-0.5">
          {previewKeys.map((k) => (
            <div key={k} className="flex items-center gap-1.5 text-[9px] font-mono">
              <span className="text-[var(--c-text-3)] flex-shrink-0">{k}:</span>
              <span className="text-[var(--c-text-2)] truncate">{String(cfg[k]).slice(0, 30)}{String(cfg[k]).length > 30 ? "…" : ""}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "#7c3aed", border: "2px solid var(--c-bg)", width: 9, height: 9 }}
        />
      )}

      {/* Output handles */}
      {!isSink && (
        <>
          {isCondition ? (
            <>
              <Handle id="true"  type="source" position={Position.Right}
                style={{ background: "#10b981", border: "2px solid var(--c-bg)", width: 9, height: 9, top: "33%" }} />
              <Handle id="false" type="source" position={Position.Right}
                style={{ background: "#ef4444", border: "2px solid var(--c-bg)", width: 9, height: 9, top: "67%" }} />
            </>
          ) : isRouter ? (
            <>
              <Handle id="route-0" type="source" position={Position.Right}
                style={{ background: "#06b6d4", border: "2px solid var(--c-bg)", width: 9, height: 9, top: "25%" }} />
              <Handle id="route-1" type="source" position={Position.Right}
                style={{ background: "#f59e0b", border: "2px solid var(--c-bg)", width: 9, height: 9, top: "50%" }} />
              <Handle id="route-2" type="source" position={Position.Right}
                style={{ background: "#8b5cf6", border: "2px solid var(--c-bg)", width: 9, height: 9, top: "75%" }} />
            </>
          ) : (
            <Handle type="source" position={Position.Right}
              style={{ background: "#7c3aed", border: "2px solid var(--c-bg)", width: 9, height: 9 }} />
          )}
        </>
      )}
    </div>
  );
}
