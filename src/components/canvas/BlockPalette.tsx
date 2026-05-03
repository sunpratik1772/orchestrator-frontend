import {
  Play, Bot, Code2, GitBranch, Globe, ArrowRight, StickyNote,
  Webhook, Clock, MessageSquare, Mail, Github, Zap,
  Table2, Filter, Download, Layers, Database, FileText,
  Wand2, ArrowUpDown, BarChart3, Copy, Merge, Share2,
  RefreshCw, PauseCircle, FunctionSquare, CheckSquare,
  BookOpen, Cpu, ChevronDown, ChevronRight, FileSpreadsheet,
  Box, Columns,
} from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useBlockRegistry, type RemoteBlockEntry } from "@/lib/blockRegistry";

// ─── Icon resolver ────────────────────────────────────────────────────────────
// The backend stores icon names as strings (e.g. "Filter"). Map them to the
// actual lucide React component. Unknown names fall back to `Box`.
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Play, Bot, Code2, GitBranch, Globe, ArrowRight, StickyNote, Webhook, Clock,
  MessageSquare, Mail, Github, Zap, Table2, Filter, Download, Layers, Database,
  FileText, Wand2, ArrowUpDown, BarChart3, Copy, Merge, Share2, RefreshCw,
  PauseCircle, FunctionSquare, CheckSquare, BookOpen, Cpu, FileSpreadsheet,
  Columns, Box,
};

// ─── Category styling (palette accent colors per section) ─────────────────────
const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  triggers:     { label: "Triggers",     color: "text-violet-400"  },
  data:         { label: "Data",         color: "text-sky-400"     },
  transform:    { label: "Transform",    color: "text-amber-400"   },
  logic:        { label: "Logic",        color: "text-cyan-400"    },
  ai:           { label: "AI",           color: "text-purple-400"  },
  output:       { label: "Output",       color: "text-amber-300"   },
  integrations: { label: "Integrations", color: "text-emerald-400" },
  other:        { label: "Other",        color: "text-slate-400"   },
};

const CATEGORY_ORDER = ["triggers", "data", "transform", "logic", "ai", "output", "integrations", "other"];

// ─── Hardcoded fallback (only used if /api/blocks is unreachable) ─────────────
// Kept intentionally minimal — just enough to keep the canvas usable while
// the user fixes their backend. The live source of truth is the registry.
const FALLBACK: RemoteBlockEntry[] = [
  { type: "manual_trigger", label: "Manual",      description: "Run manually",        category: "triggers",  icon: "Play",     color: "#7c3aed" },
  { type: "csv_extract",    label: "CSV Extract", description: "Load CSV dataset",    category: "data",      icon: "Table2",   color: "#0ea5e9" },
  { type: "filter",         label: "Filter",      description: "Filter rows",         category: "transform", icon: "Filter",   color: "#f59e0b" },
  { type: "agent",          label: "AI Agent",    description: "LLM with rows",       category: "ai",        icon: "Bot",      color: "#8b5cf6" },
  { type: "response",       label: "Response",    description: "Return value",        category: "output",    icon: "ArrowRight", color: "#b45309" },
];

// ─── Group blocks by category, in canonical order ─────────────────────────────
function groupBlocks(blocks: RemoteBlockEntry[]) {
  const byCat = new Map<string, RemoteBlockEntry[]>();
  for (const b of blocks) {
    const cat = b.category || "other";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(b);
  }
  const ordered: { category: string; label: string; color: string; items: RemoteBlockEntry[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    const items = byCat.get(cat);
    if (!items || items.length === 0) continue;
    const style = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.other;
    ordered.push({ category: cat, label: style.label, color: style.color, items });
  }
  // Any unknown categories at the end
  for (const [cat, items] of byCat) {
    if (CATEGORY_ORDER.includes(cat)) continue;
    const style = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.other;
    ordered.push({ category: cat, label: style.label, color: style.color, items });
  }
  return ordered;
}

interface BlockPaletteProps {
  onDragStart: (event: React.DragEvent, blockType: string, label: string) => void;
}

export function BlockPalette({ onDragStart }: BlockPaletteProps) {
  const { data, isError } = useBlockRegistry();
  const blocks = data && data.length > 0 ? data : FALLBACK;
  const groups = useMemo(() => groupBlocks(blocks), [blocks]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (cat: string) =>
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));

  return (
    <div className="w-52 h-full bg-[var(--c-surface-2)] border-r border-[var(--c-border)] flex flex-col flex-shrink-0">
      <div className="px-3 py-2.5 border-b border-[var(--c-border)] flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--c-text-3)]">Blocks</span>
        {isError && (
          <span title="Backend unreachable — showing fallback list" className="text-[8px] font-mono text-amber-400">
            offline
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.category];
          return (
            <div key={group.category}>
              <button
                onClick={() => toggle(group.category)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-widest text-[var(--c-text-3)] hover:text-[var(--c-text-2)] hover:bg-[var(--c-overlay-1)] transition-colors"
              >
                <span className={cn("font-semibold", group.color)}>{group.label}</span>
                {isCollapsed ? <ChevronRight className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mb-1">
                  {group.items.map((block) => {
                    const Icon = ICONS[block.icon] ?? Box;
                    return (
                      <div
                        key={block.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.type, block.label)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--c-surface-3)] hover:bg-[var(--c-surface-1)] border border-transparent hover:border-[var(--c-border)] cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-[var(--c-overlay-1)]">
                          <Icon className={cn("w-3 h-3", group.color)} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-[var(--c-text-1)] group-hover:text-[var(--c-text-0)] transition-colors leading-tight truncate">
                            {block.label}
                          </div>
                          <div className="text-[9px] text-[var(--c-text-4)] leading-tight truncate">{block.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
