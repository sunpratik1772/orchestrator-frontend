import { useState } from "react";
import Shell from "@/components/layout/Shell";
import { FileIcon, Plus, Search, Upload, Trash2, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const C = {
  BORDER: "var(--c-border)",
  SURFACE1: "var(--c-surface-1)",
  SURFACE_ACTIVE: "var(--c-surface-active)",
  TEXT_PRIMARY: "var(--c-text-0)",
  TEXT_BODY: "var(--c-text-1)",
  TEXT_SECONDARY: "var(--c-text-2)",
  TEXT_ICON: "var(--c-text-2)",
};

interface FileRow {
  id: string;
  name: string;
  size: string;
  type: string;
  created: string;
  owner: string;
  typeColor: string;
}

const FILES: FileRow[] = [
  { id:"1", name:"Q1 Performance Report.pdf",        size:"2.4 MB",  type:"PDF",   created:"3 hours ago",    owner:"Theo L.",  typeColor:"#f87171" },
  { id:"2", name:"product-screenshots.zip",           size:"18.7 MB", type:"ZIP",   created:"1 day ago",      owner:"Alex M.",  typeColor:"#fbbf24" },
  { id:"3", name:"customer-onboarding-flow.mp4",      size:"142 MB",  type:"MP4",   created:"3 days ago",     owner:"Sarah K.", typeColor:"#a78bfa" },
  { id:"4", name:"brand-assets-2026.zip",             size:"38.1 MB", type:"ZIP",   created:"1 week ago",     owner:"Sarah K.", typeColor:"#fbbf24" },
  { id:"5", name:"lead-generation-analysis.xlsx",     size:"4.9 MB",  type:"XLSX",  created:"1 week ago",     owner:"Jordan P.",typeColor:"#34d399" },
  { id:"6", name:"training-dataset-v2.csv",           size:"67.3 MB", type:"CSV",   created:"March 20, 2026", owner:"Alex M.",  typeColor:"#60a5fa" },
  { id:"7", name:"support-documentation.pdf",         size:"1.1 MB",  type:"PDF",   created:"March 15, 2026", owner:"Theo L.",  typeColor:"#f87171" },
  { id:"8", name:"product-roadmap-q2.pptx",           size:"8.4 MB",  type:"PPTX",  created:"March 10, 2026", owner:"Jordan P.",typeColor:"#fb923c" },
];

function FileTypeBadge({ type, color }: { type: string; color: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
      style={{ backgroundColor: color + "20", color }}
    >
      {type}
    </span>
  );
}

export default function Files() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const filtered = FILES.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <div className="flex items-center gap-2">
            <FileIcon className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
            <span className="text-sm font-medium" style={{ color: C.TEXT_BODY }}>Files</span>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors hover:bg-[var(--c-surface-active)]" style={{ color: C.TEXT_SECONDARY }}>
                  <Download className="w-3.5 h-3.5" />
                  Download ({selected.size})
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors hover:bg-red-500/10" style={{ color: "#f87171" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors hover:opacity-80" style={{ backgroundColor: "#7c3aed" }}>
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--c-text-3)]"
            style={{ color: C.TEXT_BODY }}
          />
        </div>

        {/* Drop zone banner */}
        <div
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
          className={cn("flex-shrink-0 mx-6 my-3 rounded-xl flex items-center justify-center gap-2 transition-all text-[12px] py-3 border-2 border-dashed cursor-pointer", isDragging && "opacity-100")}
          style={{
            borderColor: isDragging ? "#7c3aed" : C.BORDER,
            backgroundColor: isDragging ? "rgba(124,58,237,0.05)" : "transparent",
            color: isDragging ? "#a78bfa" : C.TEXT_ICON,
          }}
        >
          <Upload className="w-3.5 h-3.5" />
          {isDragging ? "Drop files to upload" : "Drag and drop files here, or click Upload"}
        </div>

        {/* File table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: "40%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--c-bg)", boxShadow: `inset 0 -1px 0 ${C.BORDER}` }}>
              <tr>
                <th className="h-10 px-2 align-middle">
                  <input type="checkbox" className="accent-violet-500 w-3.5 h-3.5" />
                </th>
                {["Name", "Type", "Size", "Created", "Owner"].map((h) => (
                  <th key={h} className="h-10 px-4 py-2 text-left align-middle font-normal text-[11px]" style={{ color: C.TEXT_ICON }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  className={cn("h-11 cursor-pointer transition-colors group")}
                  style={{
                    borderBottom: `1px solid ${C.BORDER}`,
                    backgroundColor: selected.has(f.id) ? "rgba(124,58,237,0.06)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!selected.has(f.id)) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--c-surface-1)"; }}
                  onMouseLeave={(e) => { if (!selected.has(f.id)) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  onClick={() => toggleSelect(f.id)}
                >
                  <td className="px-2 align-middle">
                    <input
                      type="checkbox"
                      className="accent-violet-500 w-3.5 h-3.5"
                      checked={selected.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <FileIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: f.typeColor }} />
                      <span className="text-[12px] font-medium truncate" style={{ color: C.TEXT_PRIMARY }}>{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 align-middle"><FileTypeBadge type={f.type} color={f.typeColor} /></td>
                  <td className="px-4 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{f.size}</td>
                  <td className="px-4 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{f.created}</td>
                  <td className="px-4 align-middle">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center text-[9px] font-bold text-violet-300">
                          {f.owner[0]}
                        </div>
                        <span className="text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{f.owner}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-[var(--c-surface-active)] transition-colors" title="Preview" onClick={(e) => e.stopPropagation()}>
                          <Eye className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
                        </button>
                        <button className="p-1 rounded hover:bg-[var(--c-surface-active)] transition-colors" title="Download" onClick={(e) => e.stopPropagation()}>
                          <Download className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-2 flex items-center justify-between" style={{ borderTop: `1px solid ${C.BORDER}` }}>
          <span className="text-[11px]" style={{ color: C.TEXT_ICON }}>{filtered.length} files</span>
          {selected.size > 0 && (
            <span className="text-[11px]" style={{ color: "#a78bfa" }}>{selected.size} selected</span>
          )}
        </div>
      </div>
    </Shell>
  );
}
