import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Table2, FileIcon, Database, Calendar,
  BookOpen, Settings, HelpCircle, ChevronDown, Plus, Zap, GitMerge,
  Sun, Moon, Palette, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore, ALL_THEMES, THEME_META, type Theme } from "@/lib/theme";
import { useListWorkflows } from "@/api-client";
import { BackendSwitcher } from "./BackendSwitcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ShellProps {
  children: ReactNode;
}

const WORKFLOW_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626",
  "#0891b2", "#7c3aed", "#ea580c", "#16a34a", "#9333ea",
];

function getBorderColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},1)`;
}

const C = {
  BG: "var(--c-bg)",
  SURFACE1: "var(--c-surface-1)",
  SURFACE2: "var(--c-surface-2)",
  SURFACE_ACTIVE: "var(--c-surface-active)",
  BORDER: "var(--c-border)",
  TEXT_PRIMARY: "var(--c-text-0)",
  TEXT_BODY: "var(--c-text-1)",
  TEXT_SECONDARY: "var(--c-text-2)",
  TEXT_ICON: "var(--c-text-2)",
};

const WORKSPACE_NAV = [
  { href: "/tables", label: "Tables", icon: Table2 },
  { href: "/files", label: "Files", icon: FileIcon },
  { href: "/knowledge-base", label: "Knowledge Base", icon: Database },
  { href: "/scheduled-tasks", label: "Scheduled Tasks", icon: Calendar },
  { href: "/logs", label: "Logs", icon: BookOpen },
];

export default function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const [workflowsOpen, setWorkflowsOpen] = useState(true);
  const workflows = useListWorkflows();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const currentMeta = THEME_META[theme];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: C.BG }}>
      {/* Sidebar */}
      <div
        className="flex h-full flex-col flex-shrink-0 pt-3"
        style={{ width: 248, backgroundColor: C.SURFACE1, borderRight: `1px solid ${C.BORDER}` }}
      >
        {/* Workspace header */}
        <div className="flex-shrink-0 px-2.5 mb-2.5">
          <Link href="/">
            <div
              className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-[8px] border pr-2 pl-[5px] hover:opacity-80 transition-opacity"
              style={{ borderColor: C.BORDER, backgroundColor: C.SURFACE2 }}
            >
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px]"
                style={{ backgroundColor: "#7c3aed" }}
              >
                <span className="text-[8px] font-black text-white leading-none">db</span>
              </div>
              <span
                className="min-w-0 flex-1 truncate text-left font-medium text-[13px]"
                style={{ color: C.TEXT_PRIMARY }}
              >
                dbSherpa Studio
              </span>
              <ChevronDown className="h-2 w-2.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
            </div>
          </Link>
        </div>

        {/* Top nav */}
        <div className="flex flex-shrink-0 flex-col gap-0.5 px-2">
          <Link href="/">
            <div
              className={cn(
                "mx-0.5 flex h-7 cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]",
                isActive("/") && location === "/" && "bg-[var(--c-surface-active)]"
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
              <span className="truncate text-[13px]" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>
                Home
              </span>
            </div>
          </Link>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="mx-0.5 flex h-7 w-[calc(100%-4px)] cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]"
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
            <span className="flex-1 truncate text-left text-[13px]" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>
              Search
            </span>
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded border tabular-nums"
              style={{
                borderColor: C.BORDER,
                color: C.TEXT_ICON,
                backgroundColor: C.SURFACE2,
                fontFamily: "ui-sans-serif,system-ui,sans-serif",
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Workspace section */}
        <div className="mt-3.5 flex-shrink-0 flex flex-col">
          <div className="px-4 pb-1.5">
            <span className="text-[11px] font-medium" style={{ color: C.TEXT_ICON }}>
              Workspace
            </span>
          </div>
          <div className="flex flex-col gap-0.5 px-2">
            {WORKSPACE_NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "mx-0.5 flex h-7 cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]",
                    isActive(href) && "bg-[var(--c-surface-active)]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                  <span className="truncate text-[13px]" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>
                    {label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Workflows section */}
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-3.5">
          <div className="flex items-center justify-between px-4 mb-1.5">
            <button
              onClick={() => setWorkflowsOpen((v) => !v)}
              className="flex items-center gap-1 transition-colors hover:opacity-70"
            >
              <span className="text-[11px] font-medium" style={{ color: C.TEXT_ICON }}>
                Workflows
              </span>
            </button>
            <Link href="/workflows/new">
              <button
                className="rounded-md p-0.5 transition-colors hover:bg-[var(--c-surface-active)]"
                title="New Workflow"
              >
                <Plus className="h-3 w-3" style={{ color: C.TEXT_ICON }} />
              </button>
            </Link>
          </div>

          {workflowsOpen && (
            <div className="flex flex-col gap-0.5 px-2">
              {workflows.isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="mx-0.5 h-7 rounded-[8px] animate-pulse" style={{ backgroundColor: C.SURFACE2 }} />
                  ))
                : (workflows.data ?? []).map((wf, idx) => {
                    const color = WORKFLOW_COLORS[idx % WORKFLOW_COLORS.length];
                    const isWfActive = location === `/workflows/${wf.id}`;
                    return (
                      <Link key={wf.id} href={`/workflows/${wf.id}`}>
                        <div
                          className={cn(
                            "mx-0.5 flex h-7 w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]",
                            isWfActive && "bg-[var(--c-surface-active)]"
                          )}
                        >
                          <div
                            className="h-3.5 w-3.5 flex-shrink-0 rounded-[4px] border-[2px]"
                            style={{
                              backgroundColor: color,
                              borderColor: getBorderColor(color),
                              backgroundClip: "padding-box",
                            }}
                          />
                          <span
                            className="min-w-0 flex-1 truncate text-left text-[13px]"
                            style={{ color: C.TEXT_BODY, fontWeight: 450 }}
                          >
                            {wf.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              {!workflows.isLoading && (workflows.data ?? []).length === 0 && (
                <Link href="/workflows/new">
                  <div
                    className="mx-0.5 flex h-7 cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]"
                  >
                    <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                    <span className="text-[12px]" style={{ color: C.TEXT_SECONDARY }}>
                      Create workflow
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 flex-col gap-0.5 px-2 pt-2 pb-2" style={{ borderTop: `1px solid ${C.BORDER}` }}>
          <Link href="/blocks">
            <div
              className={cn(
                "mx-0.5 flex h-7 cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]",
                isActive("/blocks") && "bg-[var(--c-surface-active)]"
              )}
            >
              <GitMerge className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
              <span className="text-[13px]" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>Block Library</span>
            </div>
          </Link>
          <Link href="/settings">
            <div
              className={cn(
                "mx-0.5 flex h-7 cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]",
                isActive("/settings") && "bg-[var(--c-surface-active)]"
              )}
            >
              <Settings className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
              <span className="text-[13px]" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>Settings</span>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title={`Theme: ${currentMeta.label} — click to change`}
                data-testid="theme-switcher"
                className="mx-0.5 flex h-7 w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[var(--c-surface-active)]"
              >
                {theme === "dark" ? (
                  <Moon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                ) : theme === "light" ? (
                  <Sun className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                ) : (
                  <Palette className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.TEXT_ICON }} />
                )}
                <span className="flex-1 text-left text-[13px]" style={{ color: C.TEXT_BODY, fontWeight: 450 }}>
                  Theme
                </span>
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                  style={{ backgroundColor: currentMeta.swatch }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="min-w-[200px]">
              <DropdownMenuLabel className="text-[11px] font-mono uppercase tracking-wider opacity-70">
                Color theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_THEMES.map((t) => {
                const meta = THEME_META[t];
                const active = t === theme;
                return (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => setTheme(t as Theme)}
                    data-testid={`theme-${t}`}
                    className="flex items-center gap-2"
                  >
                    <span
                      aria-hidden
                      className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/10 flex-shrink-0"
                      style={{ backgroundColor: meta.swatch }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] leading-tight">{meta.label}</div>
                      <div className="text-[11px] opacity-60 leading-tight">{meta.description}</div>
                    </div>
                    {active && <Check className="h-3.5 w-3.5 opacity-80 flex-shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <BackendSwitcher />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: C.BG }}>
        {children}
      </div>
    </div>
  );
}
