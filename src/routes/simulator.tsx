import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { GitBranch, Sparkles, TrendingUp, AlertOctagon, Scale } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  head: () => ({ meta: [{ title: "Scenario Simulator — StrategicMind AI" }] }),
  component: Simulator,
});

interface Scenarios { best: string; likely: string; worst: string; probabilities: [number, number, number] }

const sample: Scenarios = {
  best:
    "Backchannel diplomacy via Oman produces a 90-day de-escalation framework. Hormuz traffic normalizes within two weeks; Brent stabilizes near $78. Regional insurance premiums ease by 18%. Both parties claim domestic political wins, deferring the structural dispute to a UN-led working group.",
  likely:
    "Tit-for-tat retaliation continues at calibrated intensity for 4–6 weeks. Limited strikes on infrastructure but no civilian-population escalation. Oil oscillates in the $86–94 band. Diplomatic isolation deepens for the initiating party. A ceasefire emerges only after a major incident forces external mediation.",
  worst:
    "Miscalculation triggers a regional war drawing in two additional state actors. Hormuz partially closed for 30+ days; Brent spikes above $140. Global equities decline 12–18%. Cyber retaliation strikes US/EU financial infrastructure. NATO Article 4 consultations invoked. Recession risk for developed economies rises to 70%.",
  probabilities: [18, 56, 26],
};

function Simulator() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<Scenarios | null>(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => { setResult(sample); setLoading(false); }, 900);
  };

  const cards = result
    ? [
        { key: "best", title: "Best Case", icon: TrendingUp, text: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/30", bar: "bg-risk-low", body: result.best, prob: result.probabilities[0] },
        { key: "likely", title: "Most Likely Case", icon: Scale, text: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/30", bar: "bg-risk-medium", body: result.likely, prob: result.probabilities[1] },
        { key: "worst", title: "Worst Case", icon: AlertOctagon, text: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/30", bar: "bg-risk-critical", body: result.worst, prob: result.probabilities[2] },
      ]
    : [];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><GitBranch className="size-6 text-primary" /> Scenario Simulator</h1>
          <p className="text-sm text-muted-foreground">Model trajectories across best, most-likely, and worst-case outcomes.</p>
        </div>

        <section className="glass-card rounded-xl p-5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Geopolitical Scenario</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={4}
            placeholder="e.g. Iran retaliates against Israeli infrastructure following a strike on a senior IRGC commander in Damascus…"
            className="mt-2 w-full bg-background/60 border border-border rounded-md p-3 text-sm outline-none focus:border-primary/50 resize-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Russia mobilizes 500k additional troops",
              "China imposes naval blockade on Taiwan",
              "OPEC+ cuts production by 2M bpd",
              "Cyberattack disables European power grid",
            ].map((s) => (
              <button key={s} onClick={() => setScenario(s)} className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary text-muted-foreground">{s}</button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Powered by multi-source correlation + historical analog matching</div>
            <button onClick={run} disabled={loading} className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              <Sparkles className="size-4" /> {loading ? "Simulating…" : "Run Simulation"}
            </button>
          </div>
        </section>

        {loading && (
          <div className="glass-card rounded-xl p-10 text-center text-sm text-muted-foreground">
            Correlating 2,418 sources across 7 historical analogs…
          </div>
        )}

        {result && (
          <div className="grid md:grid-cols-3 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.key} className="glass-card rounded-xl p-5 flex flex-col">
                  <header className="flex items-center justify-between mb-3">
                    <h2 className={`font-semibold flex items-center gap-2 text-${c.color}`}><Icon className="size-4" /> {c.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded bg-${c.color}/10 border border-${c.color}/30 text-${c.color}`}>{c.prob}%</span>
                  </header>
                  <div className={`h-1 rounded-full bg-${c.color} mb-4 opacity-80`} />
                  <p className="text-sm text-foreground/90 leading-relaxed">{c.body}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
