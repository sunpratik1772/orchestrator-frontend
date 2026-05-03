import { useState } from "react";
import Shell from "@/components/layout/Shell";
import { Database, Plus, Search, BookOpen, Trash2, Upload, ChevronRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface KBEntry {
  id: string;
  name: string;
  documents: string;
  tokens: string;
  created: string;
  connectors: { label: string; color: string }[];
  description: string;
}

const KBS: KBEntry[] = [
  {
    id: "1", name: "Product Documentation", documents: "847", tokens: "1,284,392", created: "2 days ago",
    connectors: [{ label: "Asana", color: "#f87171" }, { label: "Google Docs", color: "#4ade80" }],
    description: "Complete API reference, guides, and release notes for the product platform.",
  },
  {
    id: "2", name: "Customer Support KB", documents: "234", tokens: "892,104", created: "1 week ago",
    connectors: [{ label: "Zendesk", color: "#60a5fa" }, { label: "Slack", color: "#a78bfa" }],
    description: "Frequently asked questions, troubleshooting articles, and support escalation paths.",
  },
  {
    id: "3", name: "Engineering Wiki", documents: "1,203", tokens: "2,847,293", created: "March 12, 2026",
    connectors: [{ label: "Confluence", color: "#60a5fa" }, { label: "Jira", color: "#3b82f6" }],
    description: "Architecture docs, runbooks, on-call guides, and system design documents.",
  },
  {
    id: "4", name: "Marketing Assets", documents: "189", tokens: "634,821", created: "March 5, 2026",
    connectors: [{ label: "Google Drive", color: "#4ade80" }, { label: "Airtable", color: "#34d399" }],
    description: "Brand guidelines, campaign briefs, copy templates, and competitor analysis.",
  },
  {
    id: "5", name: "Sales Playbook", documents: "92", tokens: "418,570", created: "February 28, 2026",
    connectors: [{ label: "Salesforce", color: "#60a5fa" }],
    description: "Discovery call frameworks, objection handling, pricing guides, and case studies.",
  },
];

function KBCard({ kb }: { kb: KBEntry }) {
  return (
    <div
      className="group flex flex-col gap-3 p-4 rounded-xl cursor-pointer transition-all hover:opacity-90"
      style={{ backgroundColor: C.SURFACE1, border: `1px solid ${C.BORDER}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(124,58,237,0.15)" }}>
            <Database className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: C.TEXT_PRIMARY }}>{kb.name}</div>
            <div className="text-[11px] mt-0.5" style={{ color: C.TEXT_ICON }}>{kb.documents} documents · {kb.tokens} tokens</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.TEXT_ICON }} />
      </div>

      <p className="text-[12px] leading-relaxed" style={{ color: C.TEXT_SECONDARY }}>{kb.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Link2 className="w-3 h-3" style={{ color: C.TEXT_ICON }} />
          <div className="flex gap-1">
            {kb.connectors.map((c) => (
              <span key={c.label} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: c.color + "18", color: c.color }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[11px]" style={{ color: C.TEXT_ICON }}>{kb.created}</span>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = KBS.filter((kb) =>
    !search || kb.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
            <span className="text-sm font-medium" style={{ color: C.TEXT_BODY }}>Knowledge Base</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors hover:opacity-80" style={{ backgroundColor: "#7c3aed" }}>
            <Plus className="w-3.5 h-3.5" />
            New base
          </button>
        </div>

        {/* Search + view toggle */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <div className="flex flex-1 items-center gap-2.5">
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge bases..."
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--c-text-3)]"
              style={{ color: C.TEXT_BODY }}
            />
          </div>
          <div className="flex items-center gap-1" style={{ borderLeft: `1px solid ${C.BORDER}`, paddingLeft: 12, marginLeft: 12 }}>
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-2 py-1 rounded-md text-[11px] transition-colors capitalize"
                style={{
                  backgroundColor: view === v ? C.SURFACE_ACTIVE : "transparent",
                  color: view === v ? C.TEXT_BODY : C.TEXT_ICON,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Database className="w-10 h-10 opacity-20" style={{ color: C.TEXT_ICON }} />
              <p className="text-[13px]" style={{ color: C.TEXT_ICON }}>No knowledge bases found</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((kb) => <KBCard key={kb.id} kb={kb} />)}
            </div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "32%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--c-bg)", boxShadow: `inset 0 -1px 0 ${C.BORDER}` }}>
                <tr>
                  {["Name", "Documents", "Tokens", "Connectors", "Created"].map((h) => (
                    <th key={h} className="h-10 px-5 py-2 text-left align-middle font-normal text-[11px]" style={{ color: C.TEXT_ICON }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((kb) => (
                  <tr key={kb.id} className="h-11 cursor-pointer transition-colors hover:bg-[var(--c-surface-1)]" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
                    <td className="px-5 align-middle">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
                        <span className="text-[13px] font-medium" style={{ color: C.TEXT_PRIMARY }}>{kb.name}</span>
                      </div>
                    </td>
                    <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{kb.documents}</td>
                    <td className="px-5 align-middle text-[12px] font-mono" style={{ color: C.TEXT_SECONDARY }}>{kb.tokens}</td>
                    <td className="px-5 align-middle">
                      <div className="flex gap-1">
                        {kb.connectors.map((c) => (
                          <span key={c.label} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: c.color + "18", color: c.color }}>{c.label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{kb.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Upload zone */}
          <div
            className="mt-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 cursor-pointer transition-colors hover:opacity-80"
            style={{ borderColor: C.BORDER }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: C.SURFACE1 }}>
              <Upload className="w-5 h-5" style={{ color: C.TEXT_ICON }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium" style={{ color: C.TEXT_SECONDARY }}>Upload documents to your knowledge base</p>
              <p className="text-[11px] mt-1" style={{ color: C.TEXT_ICON }}>Supports PDF, DOCX, TXT, MD, and more</p>
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex-shrink-0 px-6 py-2 flex items-center gap-4" style={{ borderTop: `1px solid ${C.BORDER}` }}>
          <span className="text-[11px]" style={{ color: C.TEXT_ICON }}>{KBS.length} knowledge bases</span>
          <span className="text-[11px]" style={{ color: C.TEXT_ICON }}>·</span>
          <span className="text-[11px]" style={{ color: C.TEXT_ICON }}>
            {KBS.reduce((s, k) => s + parseInt(k.documents.replace(",", "")), 0).toLocaleString()} total documents
          </span>
        </div>
      </div>
    </Shell>
  );
}
