import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Send, Bot, User, FileText, ExternalLink, Sparkles } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "Research Assistant — StrategicMind AI" }] }),
  component: Assistant,
});

interface Message { role: "user" | "ai"; content: string; sources?: { title: string; outlet: string }[] }

const initial: Message[] = [
  { role: "user", content: "What are the implications of the latest EU sanctions on Russia's shadow fleet?" },
  {
    role: "ai",
    content:
      "The EU's 14th sanctions package targets LNG transshipments and shadow fleet operations with three meaningful shifts: (1) Port-state inspections will tighten in the Mediterranean, raising operating costs for opaque carriers by an estimated 8–14%; (2) Insurance providers face heightened secondary exposure, which historically reduces available capacity within 60–90 days; (3) Russian logistics will likely reroute through West African ports — early signals from Lomé and Dakar already suggest increased dark calls. Net effect: marginal but persistent friction on Russian oil revenue, with second-order risk for European refiners reliant on Urals-adjacent grades.",
    sources: [
      { title: "EU adopts 14th sanctions package", outlet: "Financial Times" },
      { title: "Shadow fleet rerouting analysis", outlet: "Bloomberg" },
      { title: "Port inspection regime update", outlet: "Reuters" },
    ],
  },
];

function Assistant() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content:
            "Based on multi-source correlation across the last 48 hours, the most likely trajectory involves continued escalation pressure with a 62% probability of diplomatic intervention within 14 days. Key indicators include shifts in defensive posture, statements from secondary actors, and unusual movement in commodity hedging.",
          sources: [
            { title: "Regional security briefing", outlet: "ISW" },
            { title: "Commodity flow analysis", outlet: "Reuters" },
          ],
        },
      ]);
    }, 600);
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
              <h1 className="font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Research Assistant</h1>
              <p className="text-xs text-muted-foreground">Ask geopolitical questions. Answers cite their sources.</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">GPT-Intel v4</span>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "" : ""}`}>
                <div className={`shrink-0 size-8 rounded-md flex items-center justify-center ${m.role === "user" ? "bg-accent" : "bg-primary/15 text-primary"}`}>
                  {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "You" : "StrategicMind AI"}</div>
                  <div className="text-sm leading-relaxed text-foreground/95 whitespace-pre-wrap">{m.content}</div>
                  {m.sources && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.sources.map((s, j) => (
                        <span key={j} className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded bg-background/60 border border-border">
                          <FileText className="size-3" /> {s.title} <span className="text-muted-foreground">· {s.outlet}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setInput(s)} className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary text-muted-foreground">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about a country, conflict, or scenario…"
                className="flex-1 bg-background/60 border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              />
              <button onClick={send} className="px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                <Send className="size-4" /> Send
              </button>
            </div>
          </div>
        </div>

        <aside className="glass-card rounded-xl p-4 hidden lg:flex flex-col overflow-hidden">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><FileText className="size-4 text-primary" /> Source Articles</h2>
          <div className="overflow-y-auto space-y-3">
            {[
              { t: "EU adopts 14th sanctions package targeting shadow fleet", o: "Financial Times", d: "2h ago" },
              { t: "Shadow fleet rerouting through West African ports", o: "Bloomberg", d: "4h ago" },
              { t: "Port inspection regime tightens in Mediterranean", o: "Reuters", d: "6h ago" },
              { t: "Russian oil discounts widen post-package", o: "Argus", d: "8h ago" },
              { t: "Insurers re-evaluate maritime exposure", o: "Lloyd's List", d: "12h ago" },
              { t: "G7 statement on enforcement coordination", o: "AP", d: "1d ago" },
            ].map((a, i) => (
              <a key={i} href="#" className="block p-3 rounded-md border border-border/60 hover:border-primary/40 hover:bg-accent/20">
                <div className="text-sm leading-snug">{a.t}</div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{a.o}</span>
                  <span className="inline-flex items-center gap-1">{a.d} <ExternalLink className="size-3" /></span>
                </div>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
