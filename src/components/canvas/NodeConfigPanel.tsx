import { useState, useEffect, useMemo } from "react";
import { type Node } from "@xyflow/react";
import { X, Save, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlockRegistry, type RemoteFieldSpec } from "@/lib/blockRegistry";

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, data: Record<string, any>) => void;
}

const DATASETS = ["leads.csv", "products.csv", "orders.csv", "employees.csv", "transactions.csv"];
const PDF_SOURCES = ["default", "contract.pdf", "report.pdf"];
const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "gemini-1.5-pro"];

type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "code"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "info"; content: string };

const FIELDS: Record<string, FieldDef[]> = {
  // ── Triggers
  manual_trigger: [],
  api_trigger: [
    { key: "path",   label: "Webhook Path",   type: "text",   placeholder: "/webhook" },
    { key: "method", label: "HTTP Method",    type: "select", options: [{ value:"POST",label:"POST" },{ value:"GET",label:"GET" }] },
  ],
  schedule: [
    { key: "cron",     label: "Cron Expression", type: "text", placeholder: "0 9 * * *" },
    { key: "timezone", label: "Timezone",         type: "text", placeholder: "UTC" },
  ],
  webhook_trigger: [
    { key: "path",   label: "Path",   type: "text",   placeholder: "/inbound" },
    { key: "secret", label: "Secret", type: "text",   placeholder: "Verify signature secret" },
  ],

  // ── Data Sources
  csv_extract: [
    { key: "source",  label: "Dataset",          type: "select", options: DATASETS.map((d) => ({ value: d, label: d })) },
    { key: "columns", label: "Columns (optional, comma-sep)", type: "text", placeholder: "email,score,stage" },
    { key: "limit",   label: "Row Limit",         type: "text",   placeholder: "Leave empty for all rows" },
  ],
  pdf_extract: [
    { key: "source", label: "PDF Document", type: "select", options: PDF_SOURCES.map((s) => ({ value: s, label: s })) },
  ],
  db_query: [
    { key: "connectionString", label: "Connection String (env: DB_QUERY_CONNECTION)", type: "text", placeholder: "postgresql://user:pass@host/db" },
    { key: "query", label: "SQL Query (SELECT only)", type: "code", placeholder: "SELECT * FROM users LIMIT 100" },
  ],
  http: [
    { key: "url",     label: "URL",          type: "text",   placeholder: "https://api.example.com/data" },
    { key: "method",  label: "Method",       type: "select", options: [{ value:"GET",label:"GET" },{ value:"POST",label:"POST" },{ value:"PUT",label:"PUT" },{ value:"DELETE",label:"DELETE" }] },
    { key: "headers", label: "Headers (JSON)", type: "code", placeholder: '{"Authorization": "Bearer TOKEN"}' },
    { key: "body",    label: "Body (JSON)",  type: "code",   placeholder: '{"key": "value"}' },
  ],

  // ── Transform
  filter: [
    { key: "expression", label: "Filter Expression", type: "code", placeholder: "score > 70 && stage !== 'new'" },
    { key: "info", label: "", type: "info", content: "Use column names as variables. Examples:\n  score >= 80\n  country === 'US'\n  active === true" },
  ],
  map_transform: [
    { key: "mappings", label: "Mappings (JSON array)", type: "code",
      placeholder: '[{"from":"first_name","to":"fname"},{"to":"full_name","expression":"first_name + \\" \\" + last_name"},{"to":"score_pct","expression":"score / 100"}]' },
    { key: "info", label: "", type: "info", content: "Each mapping: {from, to} to rename, or {to, expression} to compute. Column names are available as variables." },
  ],
  select_columns: [
    { key: "columns", label: "Columns (comma-separated)", type: "text", placeholder: "lead_id,email,score,stage" },
  ],
  sort: [
    { key: "sortBy", label: "Sort Column",  type: "text",   placeholder: "score" },
    { key: "order",  label: "Sort Order",   type: "select", options: [{ value:"asc",label:"Ascending (A→Z, 0→9)" },{ value:"desc",label:"Descending (Z→A, 9→0)" }] },
  ],
  group_by: [
    { key: "groupBy",      label: "Group By Column",  type: "text", placeholder: "stage" },
    { key: "aggregateCol", label: "Aggregate Column", type: "text", placeholder: "score" },
    { key: "aggregateFn",  label: "Function",         type: "select", options: [{ value:"count",label:"COUNT" },{ value:"sum",label:"SUM" },{ value:"avg",label:"AVG" },{ value:"min",label:"MIN" },{ value:"max",label:"MAX" }] },
    { key: "alias",        label: "Output Column Name", type: "text", placeholder: "avg_score" },
  ],
  deduplicate: [
    { key: "key", label: "Unique Key Column", type: "text", placeholder: "email  (leave empty = full row)" },
  ],
  join: [
    { key: "leftKey",  label: "Left Key Column",  type: "text",   placeholder: "product_sku" },
    { key: "rightKey", label: "Right Key Column", type: "text",   placeholder: "sku" },
    { key: "joinType", label: "Join Type",        type: "select", options: [{ value:"inner",label:"INNER — matching rows only" },{ value:"left",label:"LEFT — all left rows" },{ value:"right",label:"RIGHT — all right rows" },{ value:"outer",label:"OUTER — all rows both sides" }] },
  ],
  data_merge: [
    { key: "strategy", label: "Merge Strategy", type: "select", options: [{ value:"concat",label:"Concatenate (keep duplicates)" },{ value:"union",label:"Union (deduplicate by full row)" }] },
  ],
  csv_output: [
    { key: "filename",       label: "Output Filename",   type: "text",   placeholder: "output.csv" },
    { key: "delimiter",      label: "Delimiter",         type: "text",   placeholder: "," },
    { key: "includeHeaders", label: "Include Header Row", type: "select", options: [{ value:"true",label:"Yes" },{ value:"false",label:"No" }] },
  ],

  // ── Logic
  condition: [
    { key: "condition", label: "Branch Expression", type: "code", placeholder: "score >= 80" },
    { key: "info", label: "", type: "info", content: "Rows where expression is truthy → TRUE handle (green)\nOther rows → FALSE handle (red)\nConnect each handle to different downstream nodes." },
  ],
  router: [
    { key: "routes", label: "Routes (JSON array)", type: "code",
      placeholder: '[{"label":"High Score","condition":"score >= 80"},{"label":"Medium","condition":"score >= 50"},{"label":"Low","condition":"true"}]' },
    { key: "info", label: "", type: "info", content: "Routes are evaluated in order. Each row matches the first true route. Connect handles route-0, route-1, route-2 to downstream nodes." },
  ],
  loop: [
    { key: "maxIterations", label: "Max Iterations", type: "text", placeholder: "100" },
    { key: "info", label: "", type: "info", content: "Iterates over each row from upstream. Connect downstream nodes to process each row." },
  ],
  pause: [
    { key: "duration",  label: "Duration (ms)",       type: "text", placeholder: "1000" },
    { key: "condition", label: "Condition (optional)", type: "code", placeholder: "input.ready === true" },
    { key: "info", label: "", type: "info", content: "If condition is set, waits only if condition is truthy. Max 10 seconds." },
  ],
  code: [
    { key: "code", label: "JavaScript Code", type: "code",
      placeholder: "// rows = array of objects from upstream\n// return modified rows array\nconst filtered = rows.filter(r => r.score > 50);\nreturn filtered.map(r => ({ ...r, grade: r.score > 80 ? 'A' : 'B' }));" },
    { key: "info", label: "", type: "info", content: "Available: rows (array), input (trigger input), prevOutput (all node outputs). Return an array to pass rows downstream." },
  ],
  function: [
    { key: "code", label: "JavaScript Code", type: "code",
      placeholder: "// input = trigger input, prevOutput = all outputs\nreturn { processed: true, count: rows.length };" },
  ],

  // ── AI
  agent: [
    { key: "model",     label: "Model",        type: "select", options: MODELS.map((m) => ({ value: m, label: m })) },
    { key: "prompt",    label: "System Prompt", type: "textarea", placeholder: "You are a data analyst. Analyze the provided rows and return insights." },
    { key: "message",   label: "User Message (optional)", type: "textarea", placeholder: "Defaults to: 'Process these rows: [first 5 rows]'" },
    { key: "maxTokens", label: "Max Tokens",   type: "text", placeholder: "1024" },
    { key: "apiKey",    label: "API Key (env: OPENAI_API_KEY)", type: "text", placeholder: "sk-... (leave empty to use env var)" },
    { key: "info", label: "", type: "info", content: "Without an API key the node runs in simulation mode — rows still flow downstream with _ai_processed flag." },
  ],
  evaluator: [
    { key: "criteria", label: "Pass Criteria", type: "code", placeholder: "score >= 70 && active === true" },
    { key: "label",    label: "Pass Label",    type: "text", placeholder: "passed" },
    { key: "info", label: "", type: "info", content: "Rows matching the criteria flow downstream. Failed rows are dropped. Check rowCount vs passed/failed in execution logs." },
  ],

  // ── Output
  response: [
    { key: "content",  label: "Response Template", type: "textarea", placeholder: "Leave empty to pass upstream rows through" },
  ],
  excel_output: [
    { key: "filename",  label: "Output Filename",          type: "text",   placeholder: "output.xlsx" },
    { key: "tabNames",  label: "Tab Names (comma-separated, in order)", type: "text", placeholder: "Sheet1, Sheet2, Sheet3" },
    { key: "info", label: "", type: "info", content: "Connect multiple upstream nodes — each node's rows become one tab.\nTab names are matched to incoming connections left-to-right.\nThe file is returned as base64 in the execution output." },
  ],
  note: [
    { key: "content", label: "Note", type: "textarea", placeholder: "Describe what this part of the workflow does…" },
  ],

  // ── Integrations
  gmail: [
    { key: "to",      label: "To",      type: "text",     placeholder: "recipient@example.com" },
    { key: "subject", label: "Subject", type: "text",     placeholder: "Workflow notification" },
    { key: "body",    label: "Body",    type: "textarea", placeholder: "Hello, here are your results…" },
    { key: "apiKey",  label: "Gmail Client Secret (env: GMAIL_CLIENT_SECRET)", type: "text", placeholder: "Add to env to send real emails" },
    { key: "info", label: "", type: "info", content: "Without credentials the node is skipped but rows pass through. Add GMAIL_CLIENT_SECRET to your environment secrets to send real emails." },
  ],
  github: [
    { key: "action", label: "Action", type: "select", options: [
      { value: "list-repos",   label: "List my repositories" },
      { value: "list-issues",  label: "List issues" },
      { value: "list-prs",     label: "List pull requests" },
      { value: "list-commits", label: "List commits" },
      { value: "get-repo",     label: "Get repository info" },
      { value: "create-issue", label: "Create issue" },
      { value: "push-file",    label: "Push file to repo" },
    ]},
    { key: "repo",          label: "Repository (owner/repo)",              type: "text",     placeholder: "octocat/Hello-World" },
    { key: "state",         label: "State filter (issues / PRs)",          type: "select",   options: [{ value:"open",label:"Open" },{ value:"closed",label:"Closed" },{ value:"all",label:"All" }] },
    { key: "title",         label: "Issue Title       (create-issue)",     type: "text",     placeholder: "Bug: …" },
    { key: "body",          label: "Issue Body        (create-issue)",     type: "textarea", placeholder: "Steps to reproduce…" },
    { key: "labels",        label: "Labels CSV         (create-issue)",    type: "text",     placeholder: "bug, workflow" },
    { key: "filePath",      label: "File Path          (push-file)",       type: "text",     placeholder: "data/output.json" },
    { key: "fileFormat",    label: "Format             (push-file)",       type: "select",   options: [{ value:"json",label:"JSON (upstream rows)" },{ value:"csv",label:"CSV (upstream rows)" }] },
    { key: "fileContent",   label: "Static content     (push-file, overrides rows)", type: "textarea", placeholder: "Leave empty to use upstream rows" },
    { key: "commitMessage", label: "Commit message     (push-file)",       type: "text",     placeholder: "dbSherpa: update data/output.json" },
    { key: "branch",        label: "Branch             (push-file)",       type: "text",     placeholder: "main" },
    { key: "info", label: "", type: "info", content: "GitHub is connected via OAuth — no token needed.\npush-file writes upstream rows as JSON/CSV directly to your repo." },
  ],
  slack: [
    { key: "channel",    label: "Channel",      type: "text",     placeholder: "#notifications" },
    { key: "message",    label: "Message",      type: "textarea", placeholder: "Workflow result: {{rows}}" },
    { key: "webhookUrl", label: "Webhook URL (env: SLACK_WEBHOOK_URL)", type: "text", placeholder: "https://hooks.slack.com/..." },
  ],
  notion: [
    { key: "databaseId", label: "Database ID",       type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
    { key: "action",     label: "Action",            type: "select", options: [{ value:"query",label:"Query database" },{ value:"create",label:"Create page" }] },
    { key: "apiKey",     label: "API Key (env: NOTION_API_KEY)", type: "text", placeholder: "secret_..." },
  ],
  mcp: [
    { key: "serverUrl", label: "MCP Server URL (env: MCP_SERVER_URL)", type: "text",   placeholder: "http://localhost:3001" },
    { key: "tool",      label: "Tool Name",       type: "text",   placeholder: "search_docs" },
    { key: "params",    label: "Params (JSON)",   type: "code",   placeholder: '{"query": "{{input.query}}"}' },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const base = "w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[11px] text-[var(--c-text-1)] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-[var(--c-text-4)] transition-colors";

  if (field.type === "info") {
    return (
      <div className="px-2.5 py-2 rounded-lg bg-[var(--c-overlay-1)] border border-[var(--c-border-soft)] text-[10px] text-[var(--c-text-3)] font-mono whitespace-pre-wrap leading-relaxed">
        {field.content}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value ?? field.options[0]?.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(base, "cursor-pointer")}
        
      >
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={cn(base, "resize-none")}
      />
    );
  }

  if (field.type === "code") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={5}
        spellCheck={false}
        className={cn(base, "resize-y font-mono text-[10px] leading-relaxed")}
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={base}
    />
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

// Map a backend-provided RemoteFieldSpec to the local FieldDef shape used by
// the existing renderer below. Widget hints map to the closest input type.
function remoteFieldToFieldDef(p: RemoteFieldSpec): FieldDef {
  const label = p.description?.trim() || p.name;
  const placeholder = p.placeholder ?? (p.default != null ? String(p.default) : "");
  const widget = p.widget ?? "";
  if (Array.isArray(p.enum) && p.enum.length > 0) {
    return {
      key: p.name,
      label,
      type: "select",
      options: p.enum.map((v) => ({ value: String(v), label: String(v) })),
    };
  }
  if (widget === "select" || p.type === "enum") {
    return { key: p.name, label, type: "text", placeholder };
  }
  if (widget === "textarea") return { key: p.name, label, type: "textarea", placeholder };
  if (widget === "code_editor" || p.type === "expression" || p.type === "object") {
    return { key: p.name, label, type: "code", placeholder };
  }
  return { key: p.name, label, type: "text", placeholder };
}

export function NodeConfigPanel({ node, onClose, onSave }: NodeConfigPanelProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<string, any>>({});

  const { data: remoteBlocks } = useBlockRegistry();
  const remoteByType = useMemo(() => {
    const m = new Map<string, RemoteFieldSpec[]>();
    for (const b of remoteBlocks ?? []) m.set(b.type, b.fields ?? []);
    return m;
  }, [remoteBlocks]);

  useEffect(() => {
    if (node) {
      setLabel((node.data.label as string) ?? "");
      setDescription((node.data.description as string) ?? "");
      setConfig((node.data.config as Record<string, any>) ?? {});
    }
  }, [node?.id]);

  // Hook order MUST be stable across renders — compute `type` and `fields`
  // BEFORE any conditional return. When `node` is null, fall back to a safe
  // default so the hooks still run; the early return below skips the markup.
  const type = (node?.data.type as string) ?? "agent";
  // Field definitions: hardcoded FIELDS map is the proven UX (info blocks,
  // worked-example placeholders, integration-specific labels). For any node
  // NOT in the local map, fall through to the live registry so newly-added
  // YAML nodes appear automatically without a UI edit.
  const fields = useMemo<FieldDef[]>(() => {
    const local = FIELDS[type];
    if (local && local.length > 0) return local;
    const remote = remoteByType.get(type);
    if (remote && remote.length > 0) return remote.map(remoteFieldToFieldDef);
    return local ?? [];
  }, [type, remoteByType]);

  if (!node) return null;

  const setField = (key: string, value: any) => setConfig((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => onSave(node.id, { label, description, config });

  // Integration badge
  const isIntegration = ["gmail", "github", "slack", "notion", "mcp"].includes(type);

  return (
    <div className="w-72 h-full bg-[var(--c-bg)] border-l border-[var(--c-border)] flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--c-border)]">
        <div>
          <div className="text-[11px] font-semibold text-[var(--c-text-1)] font-mono">Node Config</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="text-[9px] text-[var(--c-text-3)] font-mono uppercase tracking-wider">{type}</div>
            {isIntegration && (
              <span className="text-[8px] font-mono uppercase tracking-wider text-teal-400/70 border border-teal-400/20 rounded px-1 py-0.5">
                plug-in ready
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--c-overlay-2)] text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-wider text-[var(--c-text-3)]">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[11px] text-[var(--c-text-1)] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-[var(--c-text-4)]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-wider text-[var(--c-text-3)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[11px] text-[var(--c-text-1)] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none placeholder:text-[var(--c-text-4)]"
          />
        </div>

        {/* Type-specific fields */}
        {fields.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--c-text-3)] border-t border-[var(--c-border-soft)] pt-3">
              Configuration
            </div>
            {fields.map((field, i) => (
              <div key={field.key + i} className="space-y-1.5">
                {field.type !== "info" && field.label && (
                  <label className="text-[9px] font-mono text-[var(--c-text-3)] leading-tight">{field.label}</label>
                )}
                <Field field={field} value={config[field.key]} onChange={(v) => setField(field.key, v)} />
              </div>
            ))}
          </div>
        )}

        {/* Integration link hint */}
        {isIntegration && (
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-teal-500/15 bg-teal-500/5">
            <ExternalLink className="w-3 h-3 text-teal-400/60 flex-shrink-0" />
            <span className="text-[9px] font-mono text-teal-400/60">
              Set env vars or add credentials above to activate
            </span>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="p-4 border-t border-[var(--c-border)]">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-mono py-2.5 rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
