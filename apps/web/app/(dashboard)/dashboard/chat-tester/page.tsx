"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, SendHorizonal, Sparkles, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { ApiClientError } from "@/lib/api-client";
import { clockTime } from "@/lib/format";
import type { ChatMessage, ReasoningStep } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Hi! How much is a full face of Botox?",
  "Can I get a chemical peel? I'm on Accutane.",
  "I'd love to book Morpheus8 for next week.",
];

export default function ChatTesterPage() {
  const api = useApi();
  const spaId = useAppStore((s) => s.activeSpaId);
  const addLog = useAppStore((s) => s.addSimulatorLog);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo?.({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text.trim() || sending || !spaId) return;
    const now = new Date().toISOString();
    setMessages((m) => [...m, { role: "user", content: text, ts: now }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.chat({ message: text, session_id: sessionId });
      setSessionId(res.session_id);
      setLastStatus(res.patient_status);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, ts: new Date().toISOString() },
      ]);
      setReasoning((r) => [...res.reasoning, ...r]);
      res.reasoning.forEach((step) =>
        addLog({
          agent: step.agent,
          action: step.action,
          timestamp: step.ts,
          detail: step.rules_enforced.join(", ") || undefined,
        }),
      );
      if (res.booking_url) {
        toast.success("Booking link issued", { description: res.booking_url });
      }
    } catch (e) {
      toast.error("Triage failed", {
        description: e instanceof ApiClientError ? e.message : "Try again.",
      });
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([]);
    setReasoning([]);
    setSessionId(undefined);
    setLastStatus(null);
  }

  return (
    <div>
      <PageHeader
        title="Clinical simulator"
        description="Rehearse an inbound patient safely. The right panel shows exactly which rules Vespera pulled and enforced."
        action={
          <Button variant="outline" size="sm" onClick={reset} disabled={messages.length === 0}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Chat panel */}
        <div className="flex h-[32rem] flex-col overflow-hidden rounded-card border border-stroke bg-elevated/40">
          <div className="flex items-center gap-2 border-b border-stroke/70 bg-pearl/60 px-4 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-champagne/15">
              <Sparkles className="h-3.5 w-3.5 text-champagne" />
            </span>
            <span className="text-sm font-medium text-espresso">Instagram DM · @yourstudio</span>
            {lastStatus && (
              <span className="ml-auto font-mono text-[0.68rem] uppercase tracking-[0.1em] text-slate">
                {lastStatus.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-slate">Start the conversation as a patient would.</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-pill border border-stroke bg-pearl/70 px-3.5 py-1.5 text-xs text-slate transition-colors hover:border-champagne/40 hover:text-espresso"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-champagne/15">
                      <Bot className="h-3.5 w-3.5 text-champagne" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                      m.role === "user"
                        ? "rounded-br-md bg-espresso text-canvas"
                        : "rounded-bl-md border border-stroke bg-pearl text-espresso",
                    )}
                  >
                    {m.content}
                    <span
                      className={cn(
                        "mt-1 block font-mono text-[0.6rem]",
                        m.role === "user" ? "text-canvas/50" : "text-slate/60",
                      )}
                    >
                      {clockTime(m.ts)}
                    </span>
                  </div>
                  {m.role === "user" && (
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-elevated">
                      <User className="h-3.5 w-3.5 text-slate" />
                    </span>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-slate">
                <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-champagne/15">
                  <Bot className="h-3.5 w-3.5 text-champagne" />
                </span>
                <span className="flex gap-1">
                  <Dot /> <Dot delay={120} /> <Dot delay={240} />
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-stroke/70 bg-pearl/60 p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message as a patient…"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              variant="champagne"
              aria-label="Send message"
              disabled={sending || !input.trim()}
            >
              {sending ? <Spinner /> : <SendHorizonal className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        {/* Thought inspector */}
        <div className="flex h-[32rem] flex-col overflow-hidden rounded-card border border-stroke bg-[#211c19] text-[#f3efea]">
          <div className="border-b border-[#3a332e] px-4 py-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-champagne/80">
              Live thought inspector
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {reasoning.length === 0 ? (
              <p className="text-sm text-[#8c8378]">
                Retrieval scores and enforced rules will stream here as the agent reasons.
              </p>
            ) : (
              reasoning.map((step, i) => (
                <div key={`${step.ts}-${i}`} className="rounded-lg border border-[#3a332e] bg-[#1a1613] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-champagne">
                      {step.agent} → {step.action}
                    </span>
                    <span className="font-mono text-[0.65rem] text-[#8c8378]">
                      {clockTime(step.ts)}
                    </span>
                  </div>
                  {step.rules_enforced.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {step.rules_enforced.map((r) => (
                        <span
                          key={r}
                          className="rounded-pill border border-terracotta/40 bg-terracotta/10 px-2 py-0.5 text-[0.65rem] text-[#e0a5a5]"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 space-y-1.5">
                    {step.retrieved.length === 0 ? (
                      <p className="text-[0.7rem] text-[#8c8378]">No chunks retrieved.</p>
                    ) : (
                      step.retrieved.map((c) => (
                        <div key={c.chunk_id} className="text-[0.72rem]">
                          <div className="flex items-center justify-between text-[#8c8378]">
                            <span className="truncate">{c.source}</span>
                            <span className="font-mono text-champagne/80">
                              {c.score.toFixed(2)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[#c9c1b7]">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
