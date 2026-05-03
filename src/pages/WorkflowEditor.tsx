import { useCallback, useRef, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetWorkflow,
  useUpdateWorkflow,
  useExecuteWorkflow,
  useListWorkflowExecutions,
  getGetWorkflowQueryKey,
  getListWorkflowExecutionsQueryKey,
} from "@/api-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { BlockPalette } from "@/components/canvas/BlockPalette";
import { NodeConfigPanel } from "@/components/canvas/NodeConfigPanel";
import { ExecutionPanel } from "@/components/canvas/ExecutionPanel";
import {
  ArrowLeft, Share2, Play, Download, ChevronLeft, ChevronRight, ChevronDown,
  Code2, Layers, ListTree, Loader2, Save, Plus, FileJson, FileCode2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import * as YAML from "yaml";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Pulsing skeleton of a workflow DAG — shown while the editor loads.
// Mirrors the look of the real canvas (dotted bg + node-shaped tiles +
// faint connecting lines) so the transition into the live graph feels seamless.
function CanvasSkeleton() {
  // 4 fake nodes laid out in a rough horizontal pipeline
  const fakeNodes = [
    { x: 80,  y: 140, w: 180, h: 64 },
    { x: 320, y: 80,  w: 180, h: 64 },
    { x: 320, y: 220, w: 180, h: 64 },
    { x: 560, y: 140, w: 180, h: 64 },
  ];
  return (
    <div className="h-screen w-full flex flex-col bg-[var(--c-bg)] overflow-hidden">
      {/* Fake top bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--c-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 rounded bg-[var(--c-surface-2)] animate-pulse" />
          <div className="h-4 w-20 rounded bg-[var(--c-surface-2)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-16 rounded-lg bg-[var(--c-surface-2)] animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-[var(--c-surface-2)] animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-[var(--c-surface-2)] animate-pulse" />
        </div>
      </div>
      {/* Canvas area with dotted bg + skeleton DAG */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--c-border-soft) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          {/* Connecting edges between skeleton nodes */}
          <path
            d="M 260 172 C 290 172, 290 112, 320 112"
            stroke="var(--c-border)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 260 172 C 290 172, 290 252, 320 252"
            stroke="var(--c-border)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 500 112 C 530 112, 530 172, 560 172"
            stroke="var(--c-border)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 500 252 C 530 252, 530 172, 560 172"
            stroke="var(--c-border)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
        </svg>
        {fakeNodes.map((n, i) => (
          <div
            key={i}
            className="absolute rounded-xl animate-pulse"
            style={{
              left: n.x,
              top: n.y,
              width: n.w,
              height: n.h,
              backgroundColor: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
              animationDelay: `${i * 120}ms`,
            }}
          >
            <div className="flex items-center gap-2 p-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--c-surface-3)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-20 rounded bg-[var(--c-surface-3)]" />
                <div className="h-2 w-28 rounded bg-[var(--c-surface-3)] opacity-60" />
              </div>
            </div>
          </div>
        ))}
        {/* Subtle "loading" hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] font-mono text-[var(--c-text-3)]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading workflow…
        </div>
      </div>
    </div>
  );
}

function nodeToFlow(n: any): Node {
  return {
    id: n.id,
    type: "custom",
    position: n.position ?? { x: 0, y: 0 },
    data: {
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
      config: n.config ?? {},
    },
  };
}

function edgeToFlow(e: any): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    style: { stroke: "#7c3aed", strokeWidth: 1.5 },
    animated: true,
    type: "smoothstep",
  };
}

function flowNodeToWf(n: Node): any {
  return {
    id: n.id,
    type: n.data.type,
    label: n.data.label,
    description: n.data.description,
    config: n.data.config,
    position: n.position,
  };
}

function flowEdgeToWf(e: Edge): any {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  };
}

function randomId() {
  return "n" + Math.random().toString(36).slice(2, 9);
}

interface EditorInnerProps {
  workflowId: string;
}

function EditorInner({ workflowId }: EditorInnerProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const reactFlow = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [leftTab, setLeftTab] = useState<"code" | "sources" | "structure">("structure");
  const [isDirty, setIsDirty] = useState(false);
  const [, setLocation] = useLocation();

  const workflow = useGetWorkflow(workflowId, {
    query: { enabled: !!workflowId, queryKey: getGetWorkflowQueryKey(workflowId) },
  });
  const updateWf = useUpdateWorkflow();
  const executeWf = useExecuteWorkflow();

  // Load workflow nodes/edges into React Flow
  useEffect(() => {
    if (workflow.data) {
      const wfNodes = (workflow.data.nodes as any[]) ?? [];
      const wfEdges = (workflow.data.edges as any[]) ?? [];
      setNodes(wfNodes.map(nodeToFlow));
      setEdges(wfEdges.map(edgeToFlow));
    }
  }, [workflow.data?.id]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, style: { stroke: "#7c3aed", strokeWidth: 1.5 }, animated: true, type: "smoothstep" }, eds));
    setIsDirty(true);
  }, []);

  const onNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("blockType");
    const blockLabel = e.dataTransfer.getData("blockLabel");
    if (!blockType) return;

    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const position = reactFlow.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });

    const id = randomId();
    const newNode: Node = {
      id,
      type: "custom",
      position,
      data: {
        id,
        type: blockType,
        label: blockLabel,
        description: "",
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  }, [reactFlow]);

  const onDragStart = useCallback((e: React.DragEvent, blockType: string, label: string) => {
    e.dataTransfer.setData("blockType", blockType);
    e.dataTransfer.setData("blockLabel", label);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleSaveNodeConfig = useCallback((nodeId: string, data: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, label: data.label, description: data.description, config: data.config } }
          : n
      )
    );
    setSelectedNode((prev) =>
      prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
    );
    setIsDirty(true);
    toast({ title: "Node updated" });
  }, []);

  const handleSaveWorkflow = async () => {
    await updateWf.mutateAsync(
      {
        id: workflowId,
        data: {
          nodes: nodes.map(flowNodeToWf),
          edges: edges.map(flowEdgeToWf),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetWorkflowQueryKey(workflowId) });
          setIsDirty(false);
          toast({ title: "Workflow saved" });
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  };

  // True throughout BOTH the save phase and the execute phase, so the
  // Simulate button is genuinely disabled the whole time (not just during
  // the network call to /execute). Prevents double-clicks queueing two runs.
  const isRunning = updateWf.isPending || executeWf.isPending;

  const handleRun = async () => {
    if (isRunning) return; // hard guard against double-fire

    // Save first
    await updateWf.mutateAsync({
      id: workflowId,
      data: { nodes: nodes.map(flowNodeToWf), edges: edges.map(flowEdgeToWf) },
    });

    setIsLogPanelOpen(true);
    setExecutionResult(null);

    await executeWf.mutateAsync(
      { id: workflowId, data: {} },
      {
        onSuccess: (result) => {
          setExecutionResult(result);
          qc.invalidateQueries({ queryKey: getGetWorkflowQueryKey(workflowId) });
          qc.invalidateQueries({ queryKey: getListWorkflowExecutionsQueryKey(workflowId) });
          toast({
            title: `Execution ${result.status}`,
            description: `${result.logs?.length ?? 0} steps · ${result.durationMs}ms`,
          });
        },
        onError: () => {
          toast({ title: "Execution failed", variant: "destructive" });
        },
      }
    );
  };

  // Download the current workflow as a portable JSON or YAML artifact.
  // Backend (sunpratik1772/Studio or any drop-in) can POST this back to
  // /api/workflows + /api/workflows/{id}/execute to re-run it.
  const handleExport = (format: "json" | "yaml") => {
    const wf = workflow.data;
    if (!wf) return;
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      name: wf.name,
      description: wf.description ?? "",
      nodes: nodes.map(flowNodeToWf),
      edges: edges.map(flowEdgeToWf),
    };
    const body =
      format === "yaml"
        ? YAML.stringify(payload, { lineWidth: 0 })
        : JSON.stringify(payload, null, 2);
    const blob = new Blob([body], {
      type: format === "yaml" ? "text/yaml" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (wf.name ?? "workflow")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    a.download = `${safeName || "workflow"}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({
      title: "Workflow exported",
      description: `${a.download} · ${payload.nodes.length} nodes · POST to /api/workflows to redeploy`,
    });
  };

  if (workflow.isLoading) {
    return <CanvasSkeleton />;
  }

  if (workflow.isError || !workflow.data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--c-bg)] gap-4">
        <div className="text-sm text-[var(--c-text-2)] font-mono">Workflow not found</div>
        <Link href="/workflows">
          <button className="text-xs text-primary hover:underline font-mono">Back to workflows</button>
        </Link>
      </div>
    );
  }

  const wf = workflow.data;

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--c-bg)] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--c-border)] flex-shrink-0 bg-[var(--c-bg)]">
        {/* Left: Breadcrumb + Tabs */}
        <div className="flex items-center gap-4">
          <Link href="/workflows">
            <button
              data-testid="button-back-workflows"
              className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Workflows
            </button>
          </Link>
          <span className="text-[var(--c-text-4)] text-xs">/</span>
          <span className="text-[12px] font-mono text-[var(--c-text-1)] font-semibold">{wf.name}</span>

          <div className="flex items-center gap-0.5 ml-2 border-l border-[var(--c-border)] pl-4">
            {[
              { id: "code", icon: Code2, label: "Code" },
              { id: "sources", icon: Layers, label: "Sources" },
              { id: "structure", icon: ListTree, label: "Structure" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                data-testid={`tab-${id}`}
                onClick={() => setLeftTab(id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded-md transition-colors",
                  leftTab === id
                    ? "text-[var(--c-text-1)] bg-[var(--c-overlay-2)]"
                    : "text-[var(--c-text-3)] hover:text-[var(--c-text-2)]"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              data-testid="button-save"
              onClick={handleSaveWorkflow}
              disabled={updateWf.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-[var(--c-text-2)] hover:text-[var(--c-text-1)] border border-[var(--c-border)] rounded-lg transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          )}

          <button
            data-testid="button-share"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-[var(--c-text-2)] hover:text-[var(--c-text-1)] border border-[var(--c-border)] rounded-lg transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>

          <button
            data-testid="button-simulate"
            onClick={handleRun}
            disabled={isRunning}
            aria-disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-violet-300 hover:text-violet-200 border border-violet-500/30 hover:border-violet-500/50 rounded-lg bg-violet-500/5 hover:bg-violet-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {isRunning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isRunning ? "Running..." : "Simulate"}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="button-export"
                title="Download workflow — POST it to /api/workflows on any backend to redeploy"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => handleExport("json")} data-testid="export-json">
                <FileJson className="w-3.5 h-3.5 mr-2" />
                Download JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("yaml")} data-testid="export-yaml">
                <FileCode2 className="w-3.5 h-3.5 mr-2" />
                Download YAML
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const wf = workflow.data;
                  if (!wf) return;
                  const payload = {
                    schemaVersion: 1,
                    name: wf.name,
                    description: wf.description ?? "",
                    nodes: nodes.map(flowNodeToWf),
                    edges: edges.map(flowEdgeToWf),
                  };
                  const text = JSON.stringify(payload, null, 2);
                  try {
                    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
                    await navigator.clipboard.writeText(text);
                    toast({ title: "Copied JSON to clipboard" });
                  } catch (err) {
                    // Fallback path for insecure contexts (no https) or denied permission.
                    toast({
                      title: "Couldn't copy to clipboard",
                      description: "Use Download JSON instead, or copy manually from the Code tab.",
                      variant: "destructive",
                    });
                    console.warn("Clipboard write failed:", err);
                  }
                }}
                data-testid="export-clipboard"
              >
                <Code2 className="w-3.5 h-3.5 mr-2" />
                Copy JSON to clipboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block Palette */}
        {isPaletteOpen && (
          <BlockPalette onDragStart={onDragStart} />
        )}

        {/* Toggle palette button */}
        <button
          data-testid="button-toggle-palette"
          onClick={() => setIsPaletteOpen((v) => !v)}
          className="absolute left-[calc(4rem+14rem)] top-1/2 -translate-y-1/2 z-10 w-4 h-10 bg-[var(--c-surface-3)] border border-[var(--c-border)] rounded-r-lg flex items-center justify-center text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
          style={{ left: isPaletteOpen ? "14rem" : "0" }}
        >
          {isPaletteOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Canvas + Execution Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden" ref={canvasRef}>
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => { onNodesChange(changes); setIsDirty(true); }}
              onEdgesChange={(changes) => { onEdgesChange(changes); setIsDirty(true); }}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              selectedNodeId={selectedNode?.id ?? null}
            />
          </div>

          <ExecutionPanel
            isOpen={isLogPanelOpen}
            onToggle={() => setIsLogPanelOpen((v) => !v)}
            isRunning={isRunning}
            executionResult={executionResult}
          />
        </div>

        {/* Node Config Panel */}
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={handleSaveNodeConfig}
        />
      </div>
    </div>
  );
}

export default function WorkflowEditor() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  if (!id) return null;

  return (
    <ReactFlowProvider>
      <EditorInner workflowId={id} />
    </ReactFlowProvider>
  );
}
