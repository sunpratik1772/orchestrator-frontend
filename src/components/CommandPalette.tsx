import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useListWorkflows } from "@/api-client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  GitMerge,
  Table2,
  FileIcon,
  Database,
  Calendar,
  BookOpen,
  LayoutDashboard,
  Plus,
  Settings,
  Zap,
  Sparkles,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const workflows = useListWorkflows();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onEvt = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onEvt as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onEvt as EventListener);
    };
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command, search workflows…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/workflows/new")}>
            <Plus className="mr-2 h-4 w-4 text-violet-400" />
            <span>New workflow</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/")}>
            <Sparkles className="mr-2 h-4 w-4 text-violet-400" />
            <span>Ask Copilot</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/workflows")}>
            <GitMerge className="mr-2 h-4 w-4" />
            <span>All workflows</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/tables")}>
            <Table2 className="mr-2 h-4 w-4" />
            <span>Tables</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/files")}>
            <FileIcon className="mr-2 h-4 w-4" />
            <span>Files</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/knowledge-base")}>
            <Database className="mr-2 h-4 w-4" />
            <span>Knowledge base</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/scheduled-tasks")}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Scheduled tasks</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/logs")}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Logs</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/blocks")}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Block reference</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        {workflows.data && workflows.data.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Workflows">
              {workflows.data.slice(0, 15).map((wf) => (
                <CommandItem
                  key={wf.id}
                  value={`workflow ${wf.name}`}
                  onSelect={() => go(`/workflows/${wf.id}`)}
                >
                  <Zap className="mr-2 h-4 w-4 text-violet-400" />
                  <span className="flex-1 truncate">{wf.name}</span>
                  {typeof wf.runCount === "number" && (
                    <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                      {wf.runCount} runs
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
