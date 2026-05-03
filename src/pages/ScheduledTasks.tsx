import { useState } from "react";
import Shell from "@/components/layout/Shell";
import { Calendar, Plus, Search, Play, Pause, Trash2, Clock, MoreHorizontal, ChevronDown, ToggleLeft, ToggleRight } from "lucide-react";
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

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  enabled: boolean;
  workflowName: string;
  workflowColor: string;
  runCount: number;
}

const TASKS: ScheduledTask[] = [
  {
    id:"1", name:"Sync CRM contacts",          schedule:"Every day at 9:00 AM",         nextRun:"Tomorrow",    lastRun:"2 hours ago",  enabled: true,  workflowName:"Customer Support Agent",  workflowColor:"#7c3aed", runCount: 142,
  },
  {
    id:"2", name:"Generate weekly report",      schedule:"Every Monday at 8:00 AM",      nextRun:"In 5 days",   lastRun:"6 days ago",   enabled: true,  workflowName:"Data Processing Pipeline",workflowColor:"#2563eb", runCount: 28,
  },
  {
    id:"3", name:"Clean up stale files",        schedule:"Every Sunday at midnight",     nextRun:"In 2 days",   lastRun:"6 days ago",   enabled: true,  workflowName:"Data Processing Pipeline",workflowColor:"#2563eb", runCount: 8,
  },
  {
    id:"4", name:"Send performance digest",     schedule:"Every Friday at 5:00 PM",      nextRun:"In 3 days",   lastRun:"3 days ago",   enabled: false, workflowName:"Content Generation",      workflowColor:"#059669", runCount: 3,
  },
  {
    id:"5", name:"Backup production data",      schedule:"Every 4 hours",                nextRun:"In 2 hours",  lastRun:"2 hours ago",  enabled: true,  workflowName:"Data Processing Pipeline",workflowColor:"#2563eb", runCount: 168,
  },
  {
    id:"6", name:"Scrape competitor pricing",   schedule:"Every Tuesday at 6:00 AM",     nextRun:"In 6 days",   lastRun:"1 week ago",   enabled: false, workflowName:"Content Generation",      workflowColor:"#059669", runCount: 5,
  },
  {
    id:"7", name:"Lead score enrichment",       schedule:"Every weekday at 11:00 PM",    nextRun:"Tonight",     lastRun:"Yesterday",    enabled: true,  workflowName:"Customer Support Agent",  workflowColor:"#7c3aed", runCount: 63,
  },
];

function getBorderColor(hex: string) {
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  return `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},1)`;
}

function NewTaskModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="w-[480px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--c-surface-3)", border: `1px solid ${C.BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <h2 className="text-[15px] font-semibold" style={{ color: C.TEXT_PRIMARY }}>New Scheduled Task</h2>
          <p className="text-[12px] mt-1" style={{ color: C.TEXT_ICON }}>Schedule a workflow to run automatically</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: C.TEXT_SECONDARY }}>Task name</label>
            <input type="text" placeholder="e.g. Daily CRM sync" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-violet-500/50" style={{ backgroundColor: C.SURFACE2, border: `1px solid ${C.BORDER}`, color: C.TEXT_BODY }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: C.TEXT_SECONDARY }}>Workflow</label>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: C.SURFACE2, border: `1px solid ${C.BORDER}` }}>
              <span className="text-[13px]" style={{ color: C.TEXT_ICON }}>Select a workflow...</span>
              <ChevronDown className="w-4 h-4" style={{ color: C.TEXT_ICON }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: C.TEXT_SECONDARY }}>Schedule (Cron expression)</label>
            <input type="text" placeholder="0 9 * * *" className="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none focus:ring-1 focus:ring-violet-500/50" style={{ backgroundColor: C.SURFACE2, border: `1px solid ${C.BORDER}`, color: C.TEXT_BODY }} />
            <p className="text-[11px]" style={{ color: C.TEXT_ICON }}>Use cron syntax — e.g. <span className="font-mono">0 9 * * 1</span> for every Monday at 9 AM</p>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${C.BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-[var(--c-surface-active)]" style={{ color: C.TEXT_SECONDARY }}>Cancel</button>
          <button className="px-4 py-2 rounded-lg text-[12px] font-medium text-white transition-colors hover:opacity-80" style={{ backgroundColor: "#7c3aed" }}>Create task</button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledTasks() {
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState(TASKS);
  const [showNew, setShowNew] = useState(false);

  const filtered = tasks.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.workflowName.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
            <span className="text-sm font-medium" style={{ color: C.TEXT_BODY }}>Scheduled Tasks</span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors hover:opacity-80"
            style={{ backgroundColor: "#7c3aed" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New task
          </button>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-6 py-2.5" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--c-text-3)]"
            style={{ color: C.TEXT_BODY }}
          />
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 flex gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.BORDER}` }}>
          {[
            { label: "Active",   val: tasks.filter(t=>t.enabled).length,    color: "#4ade80" },
            { label: "Paused",   val: tasks.filter(t=>!t.enabled).length,   color: "#fbbf24" },
            { label: "Total",    val: tasks.length,                          color: C.TEXT_ICON },
            { label: "Total runs", val: tasks.reduce((s,t)=>s+t.runCount,0), color: C.TEXT_ICON },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold" style={{ color }}>{val.toLocaleString()}</span>
              <span className="text-[11px]" style={{ color: C.TEXT_ICON }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Task table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--c-bg)", boxShadow: `inset 0 -1px 0 ${C.BORDER}` }}>
              <tr>
                {["Task", "Schedule", "Next Run", "Last Run", "Workflow", "Status"].map((h) => (
                  <th key={h} className="h-10 px-5 py-2 text-left align-middle font-normal text-[11px]" style={{ color: C.TEXT_ICON }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className="h-12 transition-colors hover:bg-[var(--c-surface-1)]"
                  style={{ borderBottom: `1px solid ${C.BORDER}` }}
                >
                  {/* Task */}
                  <td className="px-5 align-middle">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                      <span className="text-[12px] font-medium truncate" style={{ color: C.TEXT_PRIMARY }}>{task.name}</span>
                    </div>
                  </td>
                  {/* Schedule */}
                  <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                      <span className="truncate">Recurring, {task.schedule.toLowerCase()}</span>
                    </div>
                  </td>
                  {/* Next Run */}
                  <td className="px-5 align-middle text-[12px]" style={{ color: task.enabled ? C.TEXT_BODY : C.TEXT_ICON }}>
                    {task.enabled ? task.nextRun : "—"}
                  </td>
                  {/* Last Run */}
                  <td className="px-5 align-middle text-[12px]" style={{ color: C.TEXT_SECONDARY }}>{task.lastRun}</td>
                  {/* Workflow */}
                  <td className="px-5 align-middle">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0 border"
                        style={{ backgroundColor: task.workflowColor, borderColor: getBorderColor(task.workflowColor) }}
                      />
                      <span className="text-[12px] truncate" style={{ color: C.TEXT_SECONDARY }}>{task.workflowName}</span>
                    </div>
                  </td>
                  {/* Toggle */}
                  <td className="px-5 align-middle">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggle(task.id)}
                        className="flex items-center gap-1.5 text-[11px] transition-colors hover:opacity-70"
                        style={{ color: task.enabled ? "#4ade80" : C.TEXT_ICON }}
                      >
                        {task.enabled
                          ? <ToggleRight className="w-4 h-4 text-green-400" />
                          : <ToggleLeft className="w-4 h-4" style={{ color: C.TEXT_ICON }} />
                        }
                        {task.enabled ? "Active" : "Paused"}
                      </button>
                      <button className="p-1 rounded transition-colors hover:bg-[var(--c-surface-active)]">
                        <MoreHorizontal className="w-3.5 h-3.5" style={{ color: C.TEXT_ICON }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <NewTaskModal onClose={() => setShowNew(false)} />}
    </Shell>
  );
}
