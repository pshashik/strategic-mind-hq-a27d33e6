import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, ExternalLink, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askGemini } from "@/lib/gemini.functions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "Research Assistant — StrategicMind AI" }] }),
  component: Assistant,
});

interface Source { title: string; outlet: string }
interface Message { role: "user" | "ai"; content: string; sources?: Source[] }

const SYSTEM_INSTRUCTION = `You are StrategicMind AI, a geopolitical intelligence analyst. Respond like an official intelligence briefing:
- Use clean markdown: **bold** for key terms, bullet lists for findings, numbered lists for sequences.
- Be concise, analytical, and evidence-driven.
- Structure: brief executive line, then key points, then implications.
- Avoid speculation unless explicitly asked for scenarios.`;

const initial: Message[] = [
  {
    role: "ai",
    content:
      "**Welcome to StrategicMind AI Research Assistant.**\n\nAsk any geopolitical, security, or strategic intelligence question. I synthesize multi-source analysis into briefing-grade responses.\n\n_Try one of the suggestions below or ask your own question._",
  },
];

function Assistant() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setError(null);

    if (!apiKey) {
      setError("Gemini API key not configured. Set VITE_GEMINI_API_KEY in your environment.");
      return;
    }

    const history = messages.filter((m) => !(m === initial[0]));
    setMessages((m) => [...m, { role: "user", content: q }, { role: "ai", content: "" }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents = [
        ...history.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: q }] },
      ];

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });

      let acc = "";
      for await (const chunk of stream) {
        const t = chunk.text;
        if (!t) continue;
        acc += t;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "ai", content: acc };
          return copy;
        });
      }
      if (!acc) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "ai", content: "_No response received._" };
          return copy;
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Compare Iran-Israel escalation pathways",
    "Summarize today's Taiwan Strait activity",
    "Forecast oil prices if Hormuz is disrupted",
    "Map BRICS+ alignment shifts in 2026",
  ];

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 h-[calc(100vh-7rem)]">
        <div className="glass-card rounded-xl flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h1 className="font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="size-4 text-primary" /> Research Assistant
              </h1>
              <p className="text-xs text-muted-foreground">Ask geopolitical questions. Powered by Gemini 2.5 Flash.</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">
              gemini-2.5-flash
            </span>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`shrink-0 size-8 rounded-md flex items-center justify-center ${
                    m.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary/15 text-primary"
                  }`}
                >
                  {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {m.role === "user" ? "You" : "StrategicMind AI"}
                  </div>
                  {m.role === "ai" ? (
                    <div className="text-sm leading-relaxed text-foreground/95 rounded-lg bg-background/40 border border-border/50 px-4 py-3 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 prose-code:text-primary prose-a:text-primary">
                      {m.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-foreground/95 whitespace-pre-wrap">{m.content}</div>
                  )}
                  {m.sources && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.sources.map((s, j) => (
                        <span
                          key={j}
                          className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded bg-background/60 border border-border"
                        >
                          <FileText className="size-3" /> {s.title}{" "}
                          <span className="text-muted-foreground">· {s.outlet}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-destructive/70 hover:text-destructive">
                ✕
              </button>
            </div>
          )}

          <div className="border-t border-border/60 p-4 space-y-3 bg-background/30">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  disabled={loading}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary text-muted-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Ask about a country, conflict, or scenario…"
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {loading ? "Thinking" : "Send"}
              </button>
            </div>
          </div>
        </div>

        <aside className="glass-card rounded-xl p-4 hidden lg:flex flex-col overflow-hidden">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
            <FileText className="size-4 text-primary" /> Source Articles
          </h2>
          <div className="overflow-y-auto space-y-3">
            {[
              { t: "EU adopts 14th sanctions package targeting shadow fleet", o: "Financial Times", d: "2h ago" },
              { t: "Shadow fleet rerouting through West African ports", o: "Bloomberg", d: "4h ago" },
              { t: "Port inspection regime tightens in Mediterranean", o: "Reuters", d: "6h ago" },
              { t: "Russian oil discounts widen post-package", o: "Argus", d: "8h ago" },
              { t: "Insurers re-evaluate maritime exposure", o: "Lloyd's List", d: "12h ago" },
              { t: "G7 statement on enforcement coordination", o: "AP", d: "1d ago" },
            ].map((a, i) => (
              <a
                key={i}
                href="#"
                className="block p-3 rounded-md border border-border/60 hover:border-primary/40 hover:bg-accent/20"
              >
                <div className="text-sm leading-snug text-foreground">{a.t}</div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{a.o}</span>
                  <span className="inline-flex items-center gap-1">
                    {a.d} <ExternalLink className="size-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="size-2 rounded-full bg-primary/60 animate-bounce" />
    </div>
  );
}
