import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, riskColor } from "@/components/AppLayout";
import { countries } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { Search, Shield, Swords, Flag } from "lucide-react";

export const Route = createFileRoute("/country")({
  head: () => ({ meta: [{ title: "Country Intelligence — StrategicMind AI" }] }),
  component: CountryPage,
});

function CountryPage() {
  const [q, setQ] = useState("");
  const [code, setCode] = useState("IL");
  const country = countries.find((c) => c.code === code)!;
  const filtered = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.code.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flag className="size-6 text-primary" /> Country Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Deep-dive profiles, risk scores, and alliance networks.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          <aside className="glass-card rounded-xl p-3 h-fit">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/60 border border-border">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <ul className="mt-3 max-h-[60vh] overflow-y-auto">
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    onClick={() => setCode(c.code)}
                    className={`w-full text-left flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/30 ${code === c.code ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
                  >
                    <span className="size-8 rounded-md bg-muted text-xs font-semibold flex items-center justify-center">
                      {c.code}
                    </span>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${riskColor(c.risk)}`}
                    >
                      {c.riskScore}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-4">
            <section className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-muted-foreground">{country.region}</div>
                  <h2 className="text-3xl font-semibold">{country.name}</h2>
                  <span
                    className={`mt-2 inline-block text-xs px-2 py-1 rounded border ${riskColor(country.risk)}`}
                  >
                    {country.risk.toUpperCase()} RISK
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Composite Risk Score</div>
                  <div className="text-5xl font-bold text-gradient leading-none">
                    {country.riskScore}
                  </div>
                  <div className="text-[11px] text-muted-foreground">out of 100</div>
                </div>
              </div>
              <div className="mt-5 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-risk-low via-risk-medium to-risk-critical"
                  style={{ width: `${country.riskScore}%` }}
                />
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <section className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-risk-low">
                  <Shield className="size-4" /> Key Allies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {country.allies.map((a) => (
                    <span
                      key={a}
                      className="text-sm px-3 py-1.5 rounded-md bg-risk-low/10 text-risk-low border border-risk-low/30"
                    >
                      {a}
                    </span>
                  ))}
                  {country.allies.length === 0 && (
                    <span className="text-sm text-muted-foreground">None registered.</span>
                  )}
                </div>
              </section>
              <section className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-risk-critical">
                  <Swords className="size-4" /> Key Rivals
                </h3>
                <div className="flex flex-wrap gap-2">
                  {country.rivals.map((a) => (
                    <span
                      key={a}
                      className="text-sm px-3 py-1.5 rounded-md bg-risk-critical/10 text-risk-critical border border-risk-critical/30"
                    >
                      {a}
                    </span>
                  ))}
                  {country.rivals.length === 0 && (
                    <span className="text-sm text-muted-foreground">None registered.</span>
                  )}
                </div>
              </section>
            </div>

            <section className="glass-card rounded-xl p-5">
              <h3 className="font-semibold mb-3">Latest Developments</h3>
              <ul className="space-y-3">
                {country.developments.map((d, i) => (
                  <li
                    key={i}
                    className="flex gap-4 p-3 rounded-md bg-background/40 border border-border/60"
                  >
                    <div className="text-xs text-muted-foreground w-20 shrink-0">{d.date}</div>
                    <div className="text-sm">{d.headline}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
