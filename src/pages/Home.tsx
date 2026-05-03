import { useState, useRef, useEffect, useCallback } from "react";
import { useListWorkflows, useGetStats } from "@/api-client";
import Shell from "@/components/layout/Shell";
import { Link, useLocation } from "wouter";
import {
  ArrowUp, Zap, Play, Clock, CheckCircle2, GitMerge, ArrowRight,
  Loader2, Sparkles, ChevronDown, ChevronRight, ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/apiBase";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type ThinkingStep = { text: string; done: boolean };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;          // accumulated text
  isStreaming: boolean;
  thinkingSteps: ThinkingStep[];
  thinkingOpen: boolean;
  workflowCreated?: { id: string; name: string; nodeCount?: number };
  error?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDERS = [
  "Build a lead scoring pipeline...",
  "Create an Excel export from two CSV sources...",
  "Analyse order data by region...",
  "Score employees by salary band...",
  "Push processed data to GitHub...",
];

function timeAgo(d: string | null | undefined) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const QUICK_ACTIONS = [
  { label: "New workflow", href: "/workflows/new", icon: GitMerge, color: "text-violet-400" },
  { label: "View logs",    href: "/logs",           icon: Clock,      color: "text-sky-400"    },
  { label: "Browse tables",href: "/tables",         icon: CheckCircle2,color:"text-emerald-400"},
  { label: "All workflows",href: "/workflows",      icon: Play,       color: "text-amber-400"  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  // Promise chain that throttles "thinking"-related UI updates so steps
  // animate progressively even when the server bursts them in <50ms.
  const thinkingChainRef = useRef<Promise<void>>(Promise.resolve());
  const enqueue = useCallback((apply: () => void, holdMs: number) => {
    thinkingChainRef.current = thinkingChainRef.current.then(
      () =>
        new Promise<void>((resolve) => {
          apply();
          if (holdMs <= 0) resolve();
          else setTimeout(resolve, holdMs);
        }),
    );
  }, []);

  const workflows = useListWorkflows();
  const stats = useGetStats();

  // Rotate placeholders
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── SSE consumer ──────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Build history for context (last 10 turns)
    const history = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message immediately
    const userId = `u-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userId,
      role: "user",
      content: text,
      isStreaming: false,
      thinkingSteps: [],
      thinkingOpen: false,
    }]);

    // Add placeholder assistant message
    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      thinkingSteps: [],
      thinkingOpen: true,
    }]);

    try {
      const response = await fetch(apiUrl("/api/copilot/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const update = (fn: (m: Message) => Message) => {
        setMessages(prev => prev.map(m => m.id === assistantId ? fn(m) : m));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case "thinking":
                // Hold each step ~280ms so users see the progression
                // even when the server bursts them faster than React renders.
                enqueue(() => {
                  update(m => ({
                    ...m,
                    thinkingSteps: [
                      ...m.thinkingSteps.map(s => ({ ...s, done: true })),
                      { text: event.step, done: false },
                    ],
                  }));
                }, 280);
                break;

              case "text_start":
                // Wait for any pending thinking steps to drain, then mark all done.
                enqueue(() => {
                  update(m => ({
                    ...m,
                    thinkingSteps: m.thinkingSteps.map(s => ({ ...s, done: true })),
                  }));
                }, 0);
                break;

              case "text_chunk":
                // Stream text live — DON'T queue, it should feel snappy
                update(m => ({ ...m, content: m.content + event.chunk }));
                break;

              case "text_end":
                break;

              case "workflow_created":
                // Queue behind thinking so the panel doesn't collapse mid-animation.
                enqueue(() => {
                  update(m => ({
                    ...m,
                    workflowCreated: {
                      id: event.workflowId,
                      name: event.name,
                      nodeCount: event.nodeCount,
                    },
                    thinkingOpen: false,
                  }));
                  qc.invalidateQueries({ queryKey: ["listWorkflows"] });
                  qc.invalidateQueries({ queryKey: ["getStats"] });
                  toast.success(`Created "${event.name}"`, {
                    description: `${event.nodeCount ?? "?"} nodes ready in canvas`,
                    action: {
                      label: "Open",
                      onClick: () => navigate(`/workflows/${event.workflowId}`),
                    },
                  });
                }, 0);
                break;

              case "done":
                enqueue(() => {
                  update(m => ({
                    ...m,
                    isStreaming: false,
                    thinkingOpen: false,
                    thinkingSteps: m.thinkingSteps.map(s => ({ ...s, done: true })),
                  }));
                }, 0);
                break;

              case "error":
                // Errors should NOT wait for the thinking queue.
                update(m => ({
                  ...m,
                  isStreaming: false,
                  error: event.message,
                  thinkingOpen: false,
                }));
                break;
            }
          } catch {
            // malformed SSE chunk — ignore
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, isStreaming: false, error: err.message, thinkingOpen: false }
          : m
      ));
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, qc]);

  const s = stats.data;

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "var(--c-text-2)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--c-text-1)" }}>Home</span>
          </div>
          <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--c-text-2)" }}>
            <span>{s?.totalWorkflows ?? 0} workflows</span>
            <span>·</span>
            <span>{s?.totalExecutions ?? 0} runs</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

              {/* Empty state */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-full gap-6 py-8">
                  <div className="text-center space-y-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                      style={{ backgroundColor: "var(--c-violet-soft-bg)", border: "1px solid var(--c-violet-soft-border)" }}
                    >
                      <Sparkles className="w-7 h-7 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>What can I build for you?</h2>
                      <p className="text-sm mt-1.5" style={{ color: "var(--c-text-2)" }}>Describe a workflow in plain English and I'll wire it up</p>
                    </div>
                  </div>

                  {/* Hero composer — Claude/ChatGPT-style centered input */}
                  <div className="w-full max-w-2xl space-y-3">
                    <Composer
                      variant="hero"
                      input={input}
                      setInput={setInput}
                      send={send}
                      sending={sending}
                      placeholder={PLACEHOLDERS[placeholderIdx]}
                    />
                    <div className="flex flex-wrap gap-2 justify-center">
                      {PLACEHOLDERS.slice(0, 4).map((p) => {
                        const txt = p.replace(/\.\.\.$/, "");
                        return (
                          <button
                            key={p}
                            onClick={() => setInput(txt)}
                            className="text-[12px] px-3 py-1.5 rounded-full transition-all duration-150 hover:-translate-y-0.5"
                            style={{ backgroundColor: "var(--c-surface-1)", border: "1px solid var(--c-border)", color: "var(--c-text-2)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-violet-soft-border)")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
                          >
                            {txt}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-center" style={{ color: "var(--c-text-4)" }}>
                      Press Enter to send · Shift+Enter for new line · ⌘K for commands
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {QUICK_ACTIONS.map(a => (
                      <Link key={a.href} href={a.href}>
                        <div
                          className="group flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5"
                          style={{ backgroundColor: "var(--c-surface-1)", border: "1px solid var(--c-border)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-violet-soft-border)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
                        >
                          <a.icon className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110", a.color)} />
                          <span className="text-[13px]" style={{ color: "var(--c-text-1)", fontWeight: 450 }}>{a.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {(workflows.data ?? []).length > 0 && (
                    <div className="w-full max-w-md space-y-2">
                      <div className="text-[11px] font-medium px-1 tracking-wider" style={{ color: "var(--c-text-2)" }}>RECENT WORKFLOWS</div>
                      {(workflows.data ?? []).slice(0, 3).map(wf => (
                        <Link key={wf.id} href={`/workflows/${wf.id}`}>
                          <div
                            className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5"
                            style={{ backgroundColor: "var(--c-surface-1)", border: "1px solid var(--c-border)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-violet-soft-border)")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-3 h-3 text-violet-400" />
                                <span
                                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-[var(--c-surface-1)]"
                                  style={{ backgroundColor: wf.lastRunAt ? "#10b981" : "#6b7280" }}
                                  title={wf.lastRunAt ? "Has runs" : "Never run"}
                                />
                              </div>
                              <span className="text-[13px] truncate" style={{ color: "var(--c-text-1)", fontWeight: 450 }}>{wf.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              <span className="text-[11px] font-mono" style={{ color: "var(--c-text-2)" }}>{wf.runCount} runs</span>
                              <span className="text-[11px]" style={{ color: "var(--c-text-2)" }}>{timeAgo(wf.lastRunAt)}</span>
                              <ArrowRight className="w-3 h-3" style={{ color: "var(--c-text-2)" }} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conversation */}
              {messages.map(m => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start gap-2")}>

                  {/* Copilot avatar */}
                  {m.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--c-violet-soft-bg)", border: "1px solid var(--c-violet-soft-border)" }}
                    >
                      <Sparkles className="w-3 h-3 text-violet-400" />
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-2", m.role === "user" ? "items-end max-w-[72%]" : "items-start max-w-[78%]")}>

                    {/* User bubble */}
                    {m.role === "user" && (
                      <div
                        className="rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed text-white"
                        style={{ backgroundColor: "var(--c-violet)" }}
                      >
                        {m.content}
                      </div>
                    )}

                    {/* Thinking steps */}
                    {m.role === "assistant" && m.thinkingSteps.length > 0 && (
                      <ThinkingBlock
                        steps={m.thinkingSteps}
                        open={m.thinkingOpen}
                        isStreaming={m.isStreaming}
                        onToggle={() =>
                          setMessages(prev => prev.map(msg =>
                            msg.id === m.id ? { ...msg, thinkingOpen: !msg.thinkingOpen } : msg
                          ))
                        }
                      />
                    )}

                    {/* Streaming dots (before first text chunk) */}
                    {m.role === "assistant" && m.isStreaming && m.content === "" && (
                      <div
                        className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                        style={{ backgroundColor: "var(--c-surface-3)", border: "1px solid var(--c-border)" }}
                      >
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ backgroundColor: "var(--c-text-3)", animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Assistant text */}
                    {m.role === "assistant" && m.content !== "" && (
                      <div
                        className="rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
                        style={{
                          backgroundColor: "var(--c-surface-3)",
                          border: "1px solid var(--c-border)",
                          color: "var(--c-text-1)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {m.content}
                        {m.isStreaming && (
                          <span
                            className="inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse"
                            style={{ backgroundColor: "var(--c-violet)" }}
                          />
                        )}
                      </div>
                    )}

                    {/* Workflow created card */}
                    {m.role === "assistant" && m.workflowCreated && (
                      <button
                        onClick={() => navigate(`/workflows/${m.workflowCreated!.id}`)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-opacity hover:opacity-80 cursor-pointer"
                        style={{ backgroundColor: "var(--c-violet-soft-bg)", border: "1px solid var(--c-violet-soft-border)" }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "var(--c-violet-soft-bg-hi)" }}
                        >
                          <GitMerge className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-violet-300 truncate">{m.workflowCreated.name}</div>
                          <div className="text-[11px]" style={{ color: "var(--c-text-2)" }}>
                            {m.workflowCreated.nodeCount} nodes · Click to open in canvas
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      </button>
                    )}

                    {/* Error */}
                    {m.role === "assistant" && m.error && (
                      <div
                        className="flex items-start gap-2 rounded-xl px-4 py-3 text-[13px]"
                        style={{ backgroundColor: "var(--c-danger-bg)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--c-danger-text)" }}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{m.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input — only in conversation mode (empty state shows the hero composer above) */}
            {messages.length > 0 && (
              <div
                className="flex-shrink-0 px-6 pb-6 pt-3"
                style={{ borderTop: "1px solid var(--c-border)" }}
              >
                <Composer
                  variant="compact"
                  input={input}
                  setInput={setInput}
                  send={send}
                  sending={sending}
                  placeholder={PLACEHOLDERS[placeholderIdx]}
                />
                <p className="text-[11px] text-center mt-2" style={{ color: "var(--c-text-4)" }}>
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Composer sub-component (hero + compact variants) ─────────────────────────

function Composer({
  variant,
  input,
  setInput,
  send,
  sending,
  placeholder,
}: {
  variant: "hero" | "compact";
  input: string;
  setInput: (s: string) => void;
  send: () => void;
  sending: boolean;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const isHero = variant === "hero";
  const maxH = isHero ? 240 : 160;

  // Reset height after send (parent clears `input`)
  useEffect(() => {
    if (input === "" && ref.current) ref.current.style.height = "auto";
  }, [input]);

  return (
    <div
      className={cn(
        "relative flex items-end transition-shadow",
        isHero
          ? "rounded-2xl shadow-xl shadow-violet-500/10 focus-within:shadow-violet-500/20"
          : "rounded-xl"
      )}
      style={{ backgroundColor: "var(--c-surface-3)", border: "1px solid var(--c-border)" }}
    >
      <textarea
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        rows={1}
        disabled={sending}
        autoFocus={isHero}
        className={cn(
          "flex-1 bg-transparent resize-none focus:outline-none disabled:opacity-50",
          isHero ? "px-5 py-4 text-[15px]" : "px-4 py-3 text-[13px]"
        )}
        style={{ color: "var(--c-text-0)", maxHeight: maxH, lineHeight: "1.55" }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, maxH) + "px";
        }}
      />
      <button
        onClick={send}
        disabled={!input.trim() || sending}
        aria-label="Send message"
        className={cn(
          "rounded-lg transition-all disabled:opacity-30",
          isHero ? "mr-3 mb-3 p-2.5" : "mr-2 mb-2 p-1.5"
        )}
        style={{ backgroundColor: input.trim() && !sending ? "var(--c-violet)" : "var(--c-surface-2)" }}
      >
        {sending ? (
          <Loader2 className={cn("text-white animate-spin", isHero ? "w-5 h-5" : "w-4 h-4")} />
        ) : (
          <ArrowUp className={cn("text-white", isHero ? "w-5 h-5" : "w-4 h-4")} />
        )}
      </button>
    </div>
  );
}

// ── ThinkingBlock sub-component ───────────────────────────────────────────────

function ThinkingBlock({
  steps,
  open,
  isStreaming,
  onToggle,
}: {
  steps: ThinkingStep[];
  open: boolean;
  isStreaming: boolean;
  onToggle: () => void;
}) {
  const doneCount = steps.filter(s => s.done).length;
  const total = steps.length;

  return (
    <div
      className="rounded-xl overflow-hidden text-[12px]"
      style={{ backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border-soft)", minWidth: 220 }}
    >
      {/* Header row — "Workflow Agent" hierarchy, mirrors the Sim.ai mothership/agent UX */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--c-overlay-1)]"
      >
        <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
        <span className="flex-1 flex items-center gap-2">
          <span style={{ color: "var(--c-text-1)", fontWeight: 500 }}>Workflow Agent</span>
          <span style={{ color: "var(--c-text-3)", fontStyle: "italic", fontSize: 11 }}>
            {isStreaming
              ? (total === 0
                  ? "thinking…"
                  : (steps[steps.length - 1]?.done === false
                      ? steps[steps.length - 1].text.toLowerCase()
                      : "editing workflow…"))
              : `${doneCount} step${doneCount !== 1 ? "s" : ""}`}
          </span>
        </span>
        {open
          ? <ChevronDown className="w-3 h-3" style={{ color: "var(--c-text-4)" }} />
          : <ChevronRight className="w-3 h-3" style={{ color: "var(--c-text-4)" }} />}
      </button>

      {/* Steps list */}
      {open && (
        <div className="px-3 pb-2 space-y-1.5" style={{ borderTop: "1px solid var(--c-border-soft)" }}>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              {step.done ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              ) : (
                <Loader2 className="w-3 h-3 text-violet-400 animate-spin flex-shrink-0" />
              )}
              <span style={{ color: step.done ? "var(--c-text-3)" : "var(--c-text-1)" }}>{step.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
