import { useState } from "react";
import Shell from "@/components/layout/Shell";
import { Table2, Plus, Search, ChevronDown, ChevronRight, X, TypeIcon as TypeText, Hash as TypeNumber, ToggleLeft as TypeBoolean } from "lucide-react";
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

const CELL = "border-r border-b px-2 py-[7px] align-middle select-none text-[12px]";
const CELL_HEADER = "border-r border-b bg-[var(--c-surface-3)] p-0 text-left align-middle";
const CELL_CHECKBOX = "border-r border-b px-1 py-[7px] align-middle select-none text-center";

interface Column { id: string; label: string; type: "text" | "number" | "boolean"; width: number }
interface Row { id: string; cells: Record<string, string> }
interface Table { id: string; name: string; columns: number; rows: string; created: string; cols: Column[]; data: Row[] }

const TABLES: Table[] = [
  {
    id: "1", name: "Customer Leads", columns: 5, rows: "2,847", created: "2 days ago",
    cols: [
      { id: "name",      label: "Name",      type: "text",    width: 160 },
      { id: "email",     label: "Email",     type: "text",    width: 200 },
      { id: "company",   label: "Company",   type: "text",    width: 160 },
      { id: "score",     label: "Score",     type: "number",  width: 100 },
      { id: "qualified", label: "Qualified", type: "boolean", width: 120 },
    ],
    data: [
      { id:"1", cells: { name:"Alice Johnson",  email:"alice@acme.com",    company:"Acme Corp",  score:"87", qualified:"true"  }},
      { id:"2", cells: { name:"Bob Williams",   email:"bob@techco.io",     company:"TechCo",     score:"62", qualified:"false" }},
      { id:"3", cells: { name:"Carol Davis",    email:"carol@startup.co",  company:"StartupCo",  score:"94", qualified:"true"  }},
      { id:"4", cells: { name:"Dan Miller",     email:"dan@bigcorp.com",   company:"BigCorp",    score:"71", qualified:"true"  }},
      { id:"5", cells: { name:"Eva Chen",       email:"eva@design.io",     company:"Design IO",  score:"45", qualified:"false" }},
      { id:"6", cells: { name:"Frank Lee",      email:"frank@ventures.co", company:"Ventures",   score:"88", qualified:"true"  }},
    ],
  },
  {
    id: "2", name: "Product Catalog", columns: 5, rows: "1,203", created: "5 days ago",
    cols: [
      { id:"sku",    label:"SKU",        type:"text",    width: 120 },
      { id:"name",   label:"Product",    type:"text",    width: 200 },
      { id:"price",  label:"Price ($)",  type:"number",  width: 110 },
      { id:"stock",  label:"Stock",      type:"number",  width: 100 },
      { id:"active", label:"Active",     type:"boolean", width: 100 },
    ],
    data: [
      { id:"1", cells: { sku:"PRD-001", name:"Wireless Headphones", price:"79.99",  stock:"234", active:"true"  }},
      { id:"2", cells: { sku:"PRD-002", name:"USB-C Hub",           price:"49.99",  stock:"89",  active:"true"  }},
      { id:"3", cells: { sku:"PRD-003", name:"Laptop Stand",        price:"39.99",  stock:"0",   active:"false" }},
      { id:"4", cells: { sku:"PRD-004", name:"Mechanical Keyboard", price:"129.99", stock:"52",  active:"true"  }},
      { id:"5", cells: { sku:"PRD-005", name:"Webcam HD",           price:"89.99",  stock:"17",  active:"true"  }},
      { id:"6", cells: { sku:"PRD-006", name:"Mouse Pad XL",        price:"24.99",  stock:"0",   active:"false" }},
    ],
  },
  {
    id: "3", name: "Campaign Analytics", columns: 5, rows: "534", created: "1 week ago",
    cols: [
      { id:"campaign",     label:"Campaign",       type:"text",   width: 180 },
      { id:"clicks",       label:"Clicks",         type:"number", width: 100 },
      { id:"conversions",  label:"Conversions",    type:"number", width: 140 },
      { id:"spend",        label:"Spend ($)",      type:"number", width: 130 },
    ],
    data: [
      { id:"1", cells: { campaign:"Spring Sale 2026",    clicks:"12,847", conversions:"384", spend:"2,400" }},
      { id:"2", cells: { campaign:"Email Reactivation",  clicks:"3,201",  conversions:"97",  spend:"450"   }},
      { id:"3", cells: { campaign:"Referral Program",    clicks:"8,923",  conversions:"210", spend:"1,100" }},
      { id:"4", cells: { campaign:"Product Launch",      clicks:"24,503", conversions:"891", spend:"5,800" }},
      { id:"5", cells: { campaign:"Retargeting Q1",      clicks:"6,712",  conversions:"143", spend:"980"   }},
    ],
  },
  {
    id: "4", name: "User Profiles", columns: 5, rows: "18,492", created: "2 weeks ago",
    cols: [
      { id:"username", label:"Username", type:"text",    width: 140 },
      { id:"email",    label:"Email",    type:"text",    width: 200 },
      { id:"plan",     label:"Plan",     type:"text",    width: 120 },
      { id:"seats",    label:"Seats",    type:"number",  width: 100 },
      { id:"active",   label:"Active",   type:"boolean", width: 100 },
    ],
    data: [
      { id:"1", cells: { username:"alice_j",   email:"alice@acme.com",    plan:"Pro",        seats:"5",  active:"true"  }},
      { id:"2", cells: { username:"bobw",      email:"bob@techco.io",     plan:"Starter",    seats:"1",  active:"true"  }},
      { id:"3", cells: { username:"carol_d",   email:"carol@startup.co",  plan:"Enterprise", seats:"25", active:"true"  }},
      { id:"4", cells: { username:"dan.m",     email:"dan@bigcorp.com",   plan:"Pro",        seats:"10", active:"false" }},
      { id:"5", cells: { username:"eva_chen",  email:"eva@design.io",     plan:"Starter",    seats:"1",  active:"true"  }},
      { id:"6", cells: { username:"frank_lee", email:"frank@ventures.co", plan:"Enterprise", seats:"50", active:"true"  }},
    ],
  },
  {
    id: "5", name: "Invoice Records", columns: 4, rows: "742", created: "March 15th, 2026",
    cols: [
      { id:"invoice", label:"Invoice #",   type:"text",    width: 140 },
      { id:"client",  label:"Client",      type:"text",    width: 160 },
      { id:"amount",  label:"Amount ($)",  type:"number",  width: 130 },
      { id:"paid",    label:"Paid",        type:"boolean", width: 80  },
    ],
    data: [
      { id:"1", cells: { invoice:"INV-2026-001", client:"Acme Corp",  amount:"4,800.00",  paid:"true"  }},
      { id:"2", cells: { invoice:"INV-2026-002", client:"TechCo",     amount:"1,200.00",  paid:"true"  }},
      { id:"3", cells: { invoice:"INV-2026-003", client:"StartupCo",  amount:"750.00",    paid:"false" }},
      { id:"4", cells: { invoice:"INV-2026-004", client:"BigCorp",    amount:"12,500.00", paid:"true"  }},
      { id:"5", cells: { invoice:"INV-2026-005", client:"Design IO",  amount:"3,300.00",  paid:"false" }},
    ],
  },
];

const TYPE_ICONS: Record<string, React.ElementType> = { text: TypeText, number: TypeNumber, boolean: TypeBoolean };

function SpreadsheetView({ table, onBack }: { table: Table; onBack: () => void }) {
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string } | null>(null);
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
        <button onClick={onBack} className="flex items-center gap-2 px-2 py-1 rounded-md text-[12px] font-medium transition-colors hover:bg-[var(--c-surface-active)]" style={{ color: C.TEXT_SECONDARY }}>
          <Table2 className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
          Tables
        </button>
        <span className="text-[12px]" style={{ color: C.TEXT_ICON }}>/</span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium" style={{ color: C.TEXT_BODY }}>
          {table.name}
          <ChevronDown className="w-2 h-2 opacity-50" style={{ color: C.TEXT_ICON }} />
        </div>
      </div>
      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto overscroll-none">
        <table className="table-fixed border-separate border-spacing-0" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <colgroup>
            <col style={{ width: 40 }} />
            {table.cols.map((c) => <col key={c.id} style={{ width: c.width }} />)}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={CELL_CHECKBOX} style={{ borderColor: C.BORDER, backgroundColor: "var(--c-surface-3)" }} />
              {table.cols.map((col) => {
                const Icon = TYPE_ICONS[col.type] ?? TypeText;
                return (
                  <th key={col.id} className={CELL_HEADER} style={{ borderColor: C.BORDER }}>
                    <div className="flex h-full w-full min-w-0 items-center px-2 py-[7px] gap-1.5">
                      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                      <span className="min-w-0 overflow-clip text-ellipsis whitespace-nowrap text-[12px] font-medium" style={{ color: C.TEXT_PRIMARY }}>
                        {col.label}
                      </span>
                      <ChevronDown className="ml-auto w-2 h-2 flex-shrink-0 opacity-40" style={{ color: C.TEXT_ICON }} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {table.data.map((row, rowIdx) => (
              <tr key={row.id}>
                <td className={cn(CELL_CHECKBOX, "text-[11px] font-mono tabular-nums")} style={{ borderColor: C.BORDER, color: C.TEXT_ICON, backgroundColor: "var(--c-surface-3)" }}>
                  {rowIdx + 1}
                </td>
                {table.cols.map((col) => {
                  const isSelected = selectedCell?.row === row.id && selectedCell?.col === col.id;
                  const val = row.cells[col.id] ?? "";
                  return (
                    <td
                      key={col.id}
                      onClick={() => setSelectedCell({ row: row.id, col: col.id })}
                      className={cn(CELL, "relative cursor-default")}
                      style={{
                        borderColor: C.BORDER,
                        color: C.TEXT_BODY,
                        backgroundColor: isSelected ? "rgba(124,58,237,0.06)" : "transparent",
                        outline: isSelected ? "2px solid rgba(124,58,237,0.5)" : "none",
                        outlineOffset: -2,
                      }}
                    >
                      {col.type === "boolean" ? (
                        <div className="flex justify-center">
                          <div
                            className="w-3.5 h-3.5 rounded border flex items-center justify-center"
                            style={{
                              borderColor: val === "true" ? "#7c3aed" : C.BORDER,
                              backgroundColor: val === "true" ? "#7c3aed" : "transparent",
                            }}
                          >
                            {val === "true" && <span className="text-white text-[8px] font-bold">✓</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0 overflow-clip text-ellipsis whitespace-nowrap">{val}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Tables() {
  const [search, setSearch] = useState("");
  const [openTable, setOpenTable] = useState<Table | null>(null);

  const filtered = TABLES.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (openTable) {
    return (
      <Shell>
        <SpreadsheetView table={openTable} onBack={() => setOpenTable(null)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <div className="flex items-center gap-2">
            <Table2 className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
            <span className="text-sm font-medium" style={{ color: C.TEXT_BODY }}>Tables</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors hover:opacity-80" style={{ backgroundColor: "#7c3aed" }}>
            <Plus className="w-3.5 h-3.5" />
            New table
          </button>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--c-text-3)]"
            style={{ color: C.TEXT_BODY }}
          />
        </div>

        {/* Table list */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "32%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--c-bg)", boxShadow: `inset 0 -1px 0 ${C.BORDER}` }}>
              <tr>
                {["Name", "Columns", "Rows", "Created", ""].map((h, i) => (
                  <th key={i} className="h-10 px-5 py-2 text-left align-middle font-normal text-[11px]" style={{ color: C.TEXT_ICON }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="h-11 cursor-pointer transition-colors hover:bg-[var(--c-surface-1)]"
                  style={{ borderBottom: `1px solid ${C.BORDER}` }}
                  onClick={() => setOpenTable(t)}
                >
                  <td className="px-5 align-middle">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7c3aed" }} />
                      <span className="text-[13px] font-medium" style={{ color: C.TEXT_PRIMARY }}>{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{t.columns}</td>
                  <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{t.rows}</td>
                  <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{t.created}</td>
                  <td className="px-5 align-middle">
                    <button
                      className="flex items-center gap-1 text-[12px] hover:opacity-70 transition-opacity"
                      style={{ color: "#7c3aed" }}
                      onClick={(e) => { e.stopPropagation(); setOpenTable(t); }}
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
