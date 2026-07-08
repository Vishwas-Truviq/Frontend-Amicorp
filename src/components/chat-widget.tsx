import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { EstimateModal } from "./estimate-modal";
import { DiagramModal } from "./diagram-modal";
import type { Recommendation } from "@/lib/rec-types";

type Msg = { role: "user" | "assistant"; content: string; context?: any[] };

const SUGGESTIONS = [
  "What are the fees for a Cayman Islands fund?",
  "How long to set up a BVI company?",
  "What are FATCA/CRS requirements?",
  "Which entity suits wealth protection?",
];

function formatMarkdown(text: string) {
  if (!text) return "";
  const parts = text.split("**");
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      if (part.includes("http://") || part.includes("https://")) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-bold text-amber-600 hover:underline">
            {part}
          </a>
        );
      }
      return <strong key={i} className="font-bold text-navy-950">{part}</strong>;
    }
    if (part.includes("http://") || part.includes("https://")) {
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      const subParts = part.split(urlRegex);
      return subParts.map((subPart, j) => {
        if (subPart.match(urlRegex)) {
          return (
            <a key={`${i}-${j}`} href={subPart} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
              {subPart}
            </a>
          );
        }
        return subPart;
      });
    }
    return part;
  });
}

function parseChunkContent(dataStr: string): { delta?: string; conversation_id?: string; context?: any[]; error?: string } {
  try {
    const chunk = JSON.parse(dataStr);
    return {
      delta: chunk.choices?.[0]?.delta?.content,
      conversation_id: chunk.conversation_id,
      context: chunk.context,
      error: chunk.error,
    };
  } catch (err) {
    let delta: string | undefined = undefined;
    let conversation_id: string | undefined = undefined;
    let context: any[] | undefined = undefined;
    let error: string | undefined = undefined;

    try {
      const normalizedStr = dataStr.replace(/'/g, '"');
      const chunk = JSON.parse(normalizedStr);
      delta = chunk.choices?.[0]?.delta?.content;
      conversation_id = chunk.conversation_id;
      context = chunk.context;
      error = chunk.error;
      if (delta || conversation_id || context || error) {
        return { delta, conversation_id, context, error };
      }
    } catch {
      // ignore
    }

    const contentMatch = dataStr.match(/"content":\s*'([\s\S]*?)'\s*\}\s*\]\s*\}/);
    if (contentMatch) {
      const rawContent = contentMatch[1];
      delta = rawContent
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\");
    }

    return { delta, conversation_id, context, error };
  }
}

interface ContextMatch {
  id: string;
  score: number;
  metadata?: {
    text?: string;
    type?: string;
    entity?: string;
    country?: string;
    entityCategory?: string;
    serviceType?: string;
    keyFeature1?: string;
    keyFeature2?: string;
    setupFee?: string;
    annualFeeTotal?: string;
    description?: string;
    setupTime?: string;
    benefit1?: string;
    benefit2?: string;
    benefit3?: string;
    legalFramework?: string;
    liabilityProtection?: string;
    publicRegister?: string;
    corporateDirectorFee?: string;
    registeredOfficeFee?: string;
    corporateSecretaryFee?: string;
    governmentFee?: string;
    hourlyRates?: string;
    idealFor1?: string;
    idealFor2?: string;
  };
}

function mapContextToRecommendations(context: ContextMatch[]): Recommendation[] {
  if (!context || !Array.isArray(context)) return [];

  const seen = new Set<string>();
  const filtered = [];

  for (const m of context) {
    const score = m.score || 0;
    const metadata = m.metadata || {};
    const entityName = metadata.entity;
    const type = metadata.type;

    if (type === "entity" && entityName) {
      if (!seen.has(entityName)) {
        seen.add(entityName);
        filtered.push(m);
      }
    }
  }

  return filtered.map((m, idx) => {
    const md = m.metadata || {};
    const score = m.score || 0;

    const categories = [
      md.entityCategory,
      md.serviceType,
      md.keyFeature1,
      md.keyFeature2,
    ].filter(Boolean).filter((v) => v !== "—").slice(0, 3);

    const idealFor = [md.idealFor1, md.idealFor2].filter(Boolean);

    return {
      id: idx + 1,
      score: Math.round(score * 100),
      jurisdiction: md.country || "Unknown",
      entityName: md.entity || "Unnamed Entity",
      categories,
      idealFor,
      setupCost: md.setupFee || "Contact Amicorp",
      annualCost: md.annualFeeTotal || "Contact Amicorp",
      desc: md.description || "",
      setupTime: md.setupTime || "",
      benefit1: md.benefit1 || "",
      benefit2: md.benefit2 || "",
      benefit3: md.benefit3 || "",
      legalFramework: md.legalFramework || "",
      liabilityProtection: md.liabilityProtection || "",
      publicRegister: md.publicRegister || "",
      fees: {
        setupFee: md.setupFee || "—",
        corporateDirectorFee: md.corporateDirectorFee || "—",
        registeredOfficeFee: md.registeredOfficeFee || "—",
        corporateSecretaryFee: md.corporateSecretaryFee || "—",
        governmentFee: md.governmentFee || "—",
        annualFeeTotal: md.annualFeeTotal || "—",
        hourlyRates: md.hourlyRates || "—",
      },
    };
  });
}

function MiniCarouselCard({ rec }: { rec: Recommendation }) {
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);

  return (
    <div className="w-[16rem] shrink-0 snap-start rounded-lg border border-navy-950/10 bg-white p-3 shadow-sm flex flex-col justify-between gap-2.5">
      <div>
        <div className="flex justify-between items-start gap-1">
          <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white truncate max-w-[100px]">
            {rec.jurisdiction}
          </span>
          <span className="text-[9px] font-bold text-amber-600 shrink-0">
            {rec.score}% Match
          </span>
        </div>
        <h4 className="mt-1 font-serif text-sm font-bold text-navy-950 truncate" title={rec.entityName}>{rec.entityName}</h4>
        {rec.desc && <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-2 leading-normal" title={rec.desc}>{rec.desc}</p>}
      </div>
      
      <div className="grid grid-cols-3 gap-1.5 border-t border-navy-950/5 pt-2 text-[10px]">
        <div className="overflow-hidden">
          <span className="block text-[8px] uppercase tracking-tighter text-zinc-400 font-bold">Setup</span>
          <span className="font-semibold text-zinc-700 truncate block" title={rec.setupTime}>{rec.setupTime}</span>
        </div>
        <div className="overflow-hidden">
          <span className="block text-[8px] uppercase tracking-tighter text-zinc-400 font-bold">Cost</span>
          <span className="font-semibold text-navy-950 truncate block" title={rec.setupCost}>{rec.setupCost}</span>
        </div>
        <div className="overflow-hidden">
          <span className="block text-[8px] uppercase tracking-tighter text-zinc-400 font-bold">Annual</span>
          <span className="font-semibold text-navy-950 truncate block" title={rec.annualCost}>{rec.annualCost}</span>
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-navy-950/5 pt-2">
        <button
          onClick={() => setEstimateOpen(true)}
          className="flex-1 rounded border border-navy-950/10 py-1 text-[10px] font-semibold text-navy-950 text-center hover:bg-zinc-50 transition-colors"
        >
          Estimate
        </button>
        <button
          onClick={() => setDiagramOpen(true)}
          className="flex-1 rounded bg-navy-900 py-1 text-[10px] font-semibold text-white text-center hover:bg-navy-950 transition-colors"
        >
          Diagram
        </button>
      </div>

      <EstimateModal open={estimateOpen} onOpenChange={setEstimateOpen} rec={rec} />
      <DiagramModal open={diagramOpen} onOpenChange={setDiagramOpen} rec={rec} />
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hello. I'm your Amicorp advisory assistant. Ask me anything about entities, jurisdictions, or compliance." },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, conversation_id: conversationId, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Chat failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;

          const parsed = parseChunkContent(data);
          if (parsed.conversation_id && !conversationId) {
            setConversationId(parsed.conversation_id);
          }
          const delta = parsed.delta;
          if (delta) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: last.content + delta };
              }
              return copy;
            });
          }
          if (parsed.error) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: parsed.error };
              }
              return copy;
            });
          }
          if (parsed.context) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, context: parsed.context };
              }
              return copy;
            });
          }
        }
      }
    } catch (err) {
      toast.error("Assistant unavailable", { description: (err as Error).message });
      setMessages((m) => {
        const copy = [...m];
        if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].content) {
          copy[copy.length - 1] = { role: "assistant", content: "Sorry — I couldn't reach the advisory service. Please try again shortly." };
        }
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => {
    setConversationId(null);
    setMessages([{ role: "assistant", content: "New conversation started. How can I help?" }]);
    toast("Conversation reset");
  };

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="animate-scale-in flex w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-navy-950/10">
          <div className="flex items-center justify-between bg-navy-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest text-white">Advisory Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} aria-label="Reset" className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white">
                <RotateCcw className="size-3.5" />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-navy-950/5 p-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-navy-950/10 px-2.5 py-1 text-[11px] text-zinc-600 transition-colors hover:border-amber-600 hover:text-navy-950"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={scrollRef} className="max-h-80 min-h-[16rem] space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => {
              const isAssistant = m.role === "assistant";
              const recs = isAssistant && m.context ? mapContextToRecommendations(m.context) : [];
              
              return (
                <div key={i} className={`animate-fade-in-up ${m.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-navy-900 text-white"
                      : "bg-zinc-100 text-zinc-800"
                  }`}>
                    {m.content ? formatMarkdown(m.content) : (streaming && i === messages.length - 1 ? <span className="shimmer-text">Thinking…</span> : "…")}
                  </div>
                  {recs.length > 0 && (
                    <div className="mt-2 w-full overflow-hidden">
                      <div 
                        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {recs.map((rec) => (
                          <MiniCarouselCard key={rec.id} rec={rec} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-navy-950/5 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up…"
              className="flex-1 bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="rounded bg-amber-600 p-2 text-white transition-all hover:brightness-110 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat"
        className="flex size-14 items-center justify-center rounded-full bg-navy-900 text-white shadow-xl transition-all hover:scale-105 hover:bg-amber-600 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
