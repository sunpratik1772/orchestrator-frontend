import Shell from "@/components/layout/Shell";
import {
  Play, Bot, Code2, GitBranch, Globe, ArrowRight, StickyNote,
  Webhook, Clock, MessageSquare, Mail, Github, FileText,
  Database, Filter, TableIcon, Download, Upload, Merge, Zap
} from "lucide-react";

const ALL_BLOCKS = [
  {
    category: "Triggers",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      { type: "manual_trigger", label: "Manual Trigger", description: "Start the workflow manually from the UI or API", icon: Play },
      { type: "api_trigger", label: "API Trigger", description: "Receive an incoming HTTP webhook to start the workflow", icon: Webhook },
      { type: "schedule", label: "Schedule", description: "Run the workflow on a cron schedule automatically", icon: Clock },
    ],
  },
  {
    category: "Data Blocks",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    items: [
      { type: "csv_extract", label: "CSV Extract", description: "Read and extract rows from a CSV data source", icon: TableIcon },
      { type: "data_highlight", label: "Data Highlight", description: "Select and highlight top N rows from a dataset", icon: Filter },
      { type: "csv_output", label: "CSV Output", description: "Combine datasets and write a CSV output file", icon: Download },
      { type: "data_merge", label: "Data Merge", description: "Merge two or more datasets into one", icon: Merge },
      { type: "db_query", label: "DB Query", description: "Run a SQL query against a connected database", icon: Database },
    ],
  },
  {
    category: "AI Blocks",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    items: [
      { type: "agent", label: "AI Agent", description: "Run an AI language model with a system prompt", icon: Bot },
      { type: "function", label: "Function", description: "Execute custom JavaScript code inline", icon: Code2 },
      { type: "condition", label: "Condition", description: "Branch workflow execution based on a boolean expression", icon: GitBranch },
      { type: "response", label: "Response", description: "Return a value as the workflow output", icon: ArrowRight },
      { type: "note", label: "Note", description: "Add an annotation or comment to the canvas", icon: StickyNote },
    ],
  },
  {
    category: "Tools",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: [
      { type: "http", label: "HTTP Request", description: "Make an outbound HTTP API call with any method", icon: Globe },
      { type: "slack", label: "Slack", description: "Post a message to a Slack channel or user", icon: MessageSquare },
      { type: "gmail", label: "Gmail", description: "Send an email via Gmail integration", icon: Mail },
      { type: "github", label: "GitHub", description: "Interact with GitHub repos, issues, and PRs", icon: Github },
      { type: "notion", label: "Notion", description: "Read and write Notion databases and pages", icon: FileText },
    ],
  },
];

export default function Blocks() {
  return (
    <Shell>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Block Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All available blocks you can drag onto the workflow canvas
          </p>
        </div>

        {ALL_BLOCKS.map((group) => (
          <div key={group.category} className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{group.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {group.items.map((block) => {
                const Icon = block.icon;
                return (
                  <div
                    key={block.type}
                    className={`bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-all group cursor-default`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${group.bg} border ${group.border}`}>
                        <Icon className={`w-4 h-4 ${group.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground font-mono">{block.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{block.description}</div>
                        <div className="mt-2 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider border border-border rounded px-1.5 py-0.5 inline-block">
                          {block.type}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
