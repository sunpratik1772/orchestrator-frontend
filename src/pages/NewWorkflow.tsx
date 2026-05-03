import { useState } from "react";
import { useCreateWorkflow, getListWorkflowsQueryKey } from "@/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Shell from "@/components/layout/Shell";
import { ArrowLeft, GitMerge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Workflow",
    description: "Start from scratch with an empty canvas",
    nodes: [],
    edges: [],
  },
  {
    id: "parallel-csv",
    name: "Parallel CSV Pipeline",
    description: "Extract from 2 CSVs in parallel, highlight top rows, merge to output",
    nodes: [
      { id: "n1", type: "manual_trigger", label: "Start", description: "Trigger manually", position: { x: 80, y: 220 } },
      { id: "n2a", type: "csv_extract", label: "Extract CSV A", description: "Extract data from CSV source A", config: { source: "data_a.csv", columns: "id,value,category" }, position: { x: 320, y: 100 } },
      { id: "n2b", type: "csv_extract", label: "Extract CSV B", description: "Extract data from CSV source B", config: { source: "data_b.csv", columns: "id,score,label" }, position: { x: 320, y: 340 } },
      { id: "n3a", type: "data_highlight", label: "Top 2 from A", description: "Highlight top 2 rows by value", config: { topN: 2, sortBy: "value", order: "desc" }, position: { x: 580, y: 100 } },
      { id: "n3b", type: "data_highlight", label: "Top 2 from B", description: "Highlight top 2 rows by score", config: { topN: 2, sortBy: "score", order: "desc" }, position: { x: 580, y: 340 } },
      { id: "n4", type: "csv_output", label: "Create CSV", description: "Merge highlights and write final CSV", config: { filename: "top_results.csv", includeHeaders: true }, position: { x: 820, y: 220 } },
    ],
    edges: [
      { id: "e1a", source: "n1", target: "n2a" },
      { id: "e1b", source: "n1", target: "n2b" },
      { id: "e2a", source: "n2a", target: "n3a" },
      { id: "e2b", source: "n2b", target: "n3b" },
      { id: "e3a", source: "n3a", target: "n4" },
      { id: "e3b", source: "n3b", target: "n4" },
    ],
  },
  {
    id: "agent-chain",
    name: "Agent Chain",
    description: "Two AI agents working in sequence",
    nodes: [
      { id: "n1", type: "manual_trigger", label: "Start", description: "Trigger manually", position: { x: 80, y: 200 } },
      { id: "n2", type: "agent", label: "Research Agent", description: "Gather information", config: { prompt: "Research the given topic thoroughly.", model: "gpt-4o" }, position: { x: 320, y: 200 } },
      { id: "n3", type: "agent", label: "Writer Agent", description: "Generate content", config: { prompt: "Write a detailed response based on the research.", model: "gpt-4o" }, position: { x: 580, y: 200 } },
      { id: "n4", type: "response", label: "Output", description: "Return result", position: { x: 820, y: 200 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ],
  },
  {
    id: "conditional",
    name: "Conditional Branch",
    description: "Route execution based on a condition",
    nodes: [
      { id: "n1", type: "api_trigger", label: "API Trigger", description: "Webhook entrypoint", position: { x: 80, y: 200 } },
      { id: "n2", type: "condition", label: "Check Condition", description: "Evaluate input", config: { condition: "input.value > 10" }, position: { x: 320, y: 200 } },
      { id: "n3", type: "response", label: "High Path", description: "Value is high", position: { x: 580, y: 100 } },
      { id: "n4", type: "response", label: "Low Path", description: "Value is low", position: { x: 580, y: 300 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3", sourceHandle: "true" },
      { id: "e3", source: "n2", target: "n4", sourceHandle: "false" },
    ],
  },
  {
    id: "http-agent",
    name: "HTTP + Agent",
    description: "Fetch data and process with AI",
    nodes: [
      { id: "n1", type: "manual_trigger", label: "Start", description: "Manual trigger", position: { x: 80, y: 200 } },
      { id: "n2", type: "http", label: "Fetch Data", description: "Call external API", config: { url: "https://api.example.com/data", method: "GET" }, position: { x: 320, y: 200 } },
      { id: "n3", type: "agent", label: "Analyze", description: "AI analysis", config: { prompt: "Analyze the fetched data and summarize key insights.", model: "gpt-4o" }, position: { x: 580, y: 200 } },
      { id: "n4", type: "response", label: "Return", description: "Return analysis", position: { x: 820, y: 200 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ],
  },
];

export default function NewWorkflow() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const createWf = useCreateWorkflow();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const template = TEMPLATES.find((t) => t.id === selectedTemplate) ?? TEMPLATES[0];
    await createWf.mutateAsync(
      {
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          nodes: template.nodes as any,
          edges: template.edges as any,
        },
      },
      {
        onSuccess: (wf) => {
          qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
          setLocation(`/workflows/${wf.id}`);
        },
        onError: () => toast({ title: "Failed to create workflow", variant: "destructive" }),
      }
    );
  };

  return (
    <Shell>
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation("/workflows")}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">New Workflow</h1>
            <p className="text-sm text-muted-foreground">Configure and create a new workflow</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="name">
              Workflow Name
            </label>
            <input
              id="name"
              data-testid="input-workflow-name"
              type="text"
              placeholder="My Data Workflow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="description">
              Description <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <textarea
              id="description"
              data-testid="input-workflow-description"
              placeholder="What does this workflow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none font-mono"
            />
          </div>

          {/* Templates */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Start From Template
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  data-testid={`template-${t.id}`}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedTemplate === t.id
                      ? "border-primary/60 bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <GitMerge className={`w-3.5 h-3.5 ${selectedTemplate === t.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-semibold">{t.name}</span>
                  </div>
                  <p className="text-xs opacity-70 leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            data-testid="button-create"
            onClick={handleCreate}
            disabled={createWf.isPending || !name.trim()}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium py-3 rounded-lg transition-colors text-sm"
          >
            {createWf.isPending ? "Creating..." : "Create Workflow"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
