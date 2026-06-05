import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEffect, useRef, useState } from "react";
import {
  GitBranch,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  Scale,
  LineChart,
  Gauge,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { simulateScenario, type ScenarioResult } from "@/lib/gemini.functions";

export const Route = createFileRoute("/simulator")({
  head: () => ({ meta: [{ title: "Scenario Simulator — StrategicMind AI" }] }),
  component: Simulator,
});

const examples = [
  "Sudden closure of the Strait of Hormuz due to regional conflict",
  "China imposes a naval quarantine on Taiwan for 30 days",
  "OPEC+ cuts production by 2M bpd ahead of winter",
  "Coordinated cyberattack disables European power grid",
];

function Simulator() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const simulate = useServerFn(simulateScenario);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const run = async () => {
    if (!scenario.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await simulate({ data: { scenario: scenario.trim() } });
      if (res.error || !res.result) {
        setError(res.error || "Simulation failed.");
      } else {
        setResult(res.result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 text-foreground">
            <GitBranch className="size-6 text-primary" /> Scenario Simulator
          </h1>
          <p className="text-sm text-muted-foreground">
            Model trajectories across best, most-likely, and worst-case outcomes — powered by Gemini.
          </p>
        </div>

        <div className="grid lg:grid-cols-[420px_1fr] gap-5 items-start">
          {/* Left: input */}
          <section className="glass-card rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Geopolitical Scenario
              </label>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                rows={6}
                placeholder="e.g. Sudden closure of the Strait of Hormuz due to regional conflict between Iran and a Gulf coalition…"
                className="mt-2 w-full bg-background/60 border border-border rounded-md p-3 text-sm text-foreground outline-none focus:border-primary/50 resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Examples
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    disabled={loading}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary text-muted-foreground disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="text-destructive/70 hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={run}
              disabled={loading || !scenario.trim()}
              className="w-full px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Simulating…" : "Run Simulation"}
            </button>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Outputs are model-generated analyses based on historical analogs and open-source signals. Treat as decision support, not ground truth.
            </p>
          </section>

          {/* Right: results */}
          <section ref={resultsRef} className="min-h-[420px]">
            {!result && !loading && <EmptyState />}
            {loading && <LoadingState />}
            {result && <Results data={result} />}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <div className="glass-card rounded-xl h-full min-h-[420px] flex flex-col items-center justify-center text-center p-10">
      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <GitBranch className="size-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground">Awaiting scenario input</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Describe a geopolitical scenario on the left and click <span className="text-foreground">Run Simulation</span> to generate a structured outcome briefing.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="glass-card rounded-xl h-full min-h-[420px] flex flex-col items-center justify-center text-center p-10">
      <Loader2 className="size-7 text-primary animate-spin mb-3" />
      <div className="text-sm text-foreground font-medium">Running multi-outcome simulation…</div>
      <div className="text-xs text-muted-foreground mt-1">Correlating sources, matching historical analogs.</div>
    </div>
  );
}

function Results({ data }: { data: ScenarioResult }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {data.summary && (
        <div className="glass-card rounded-xl px-5 py-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Executive Summary</div>
          <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <OutcomeCard
          title="Best Case"
          icon={TrendingUp}
          body={data.bestCase}
          accent="text-emerald-500"
          ring="border-emerald-500/30"
          bg="bg-emerald-500/10"
          bar="bg-emerald-500"
        />
        <OutcomeCard
          title="Most Likely Case"
          icon={Scale}
          body={data.mostLikely}
          accent="text-sky-500"
          ring="border-sky-500/30"
          bg="bg-sky-500/10"
          bar="bg-sky-500"
        />
        <OutcomeCard
          title="Worst Case"
          icon={AlertOctagon}
          body={data.worstCase}
          accent="text-rose-500"
          ring="border-rose-500/30"
          bg="bg-rose-500/10"
          bar="bg-rose-500"
        />
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <article className="glass-card rounded-xl p-5">
          <header className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <LineChart className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Economic Impact</h2>
              <p className="text-[11px] text-muted-foreground">Markets · Supply chain · Currencies</p>
            </div>
          </header>
          <div className="h-1 rounded-full mb-4 bg-amber-500/70" />
          <p className="text-sm text-foreground/90 leading-relaxed">{data.economicImpact}</p>
        </article>

        <RiskScoreCard score={data.riskScore} />
      </div>
    </div>
  );
}

function OutcomeCard({
  title,
  icon: Icon,
  body,
  accent,
  ring,
  bg,
  bar,
}: {
  title: string;
  icon: typeof TrendingUp;
  body: string;
  accent: string;
  ring: string;
  bg: string;
  bar: string;
}) {
  return (
    <article className={`glass-card rounded-xl p-5 flex flex-col border ${ring}`}>
      <header className="flex items-center justify-between mb-3">
        <h2 className={`font-semibold flex items-center gap-2 text-sm ${accent}`}>
          <span className={`size-7 rounded-md flex items-center justify-center ${bg}`}>
            <Icon className="size-4" />
          </span>
          {title}
        </h2>
      </header>
      <div className={`h-1 rounded-full mb-4 opacity-80 ${bar}`} />
      <p className="text-sm text-foreground/90 leading-relaxed">{body}</p>
    </article>
  );
}

function RiskScoreCard({ score }: { score: number }) {
  const level =
    score >= 75 ? { label: "Critical", color: "text-rose-500", bar: "bg-rose-500" } :
    score >= 50 ? { label: "Elevated", color: "text-amber-500", bar: "bg-amber-500" } :
    score >= 25 ? { label: "Moderate", color: "text-sky-500", bar: "bg-sky-500" } :
                  { label: "Low", color: "text-emerald-500", bar: "bg-emerald-500" };

  // Gauge: SVG semicircle
  const radius = 70;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <article className="glass-card rounded-xl p-5 flex flex-col">
      <header className="flex items-center gap-2 mb-3">
        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Gauge className="size-4" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm">Risk Score</h2>
          <p className="text-[11px] text-muted-foreground">Composite severity index</p>
        </div>
      </header>

      <div className="relative flex flex-col items-center pt-2">
        <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
          <path
            d={`M 20 90 A ${radius} ${radius} 0 0 1 160 90`}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={`M 20 90 A ${radius} ${radius} 0 0 1 160 90`}
            fill="none"
            stroke="currentColor"
            className={level.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 800ms ease-out" }}
          />
        </svg>
        <div className="-mt-8 text-center">
          <div className={`text-4xl font-bold tabular-nums ${level.color}`}>{score}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">/ 100</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <span className={`text-xs px-3 py-1 rounded-full border bg-background/40 ${level.color} border-current/30`}>
          {level.label} Risk
        </span>
      </div>
    </article>
  );
}
