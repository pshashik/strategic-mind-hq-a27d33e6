import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Newspaper, Flag, Bell, AlertTriangle, ExternalLink } from "lucide-react";
import { useArticles } from "@/hooks/use-articles";
import { computeTrendingCountries } from "@/lib/countries.functions";
import { generateLocalAlerts } from "@/lib/alerts.functions";
import { computeLocalTopRisks } from "@/lib/news-service";

type ResultKind = "article" | "country" | "alert" | "risk";

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string;
  to?: string;
  search?: Record<string, string>;
  externalUrl?: string;
}

const KIND_META: Record<ResultKind, { label: string; icon: typeof Newspaper }> = {
  article: { label: "Intelligence Feed", icon: Newspaper },
  country: { label: "Countries", icon: Flag },
  alert: { label: "Strategic Alerts", icon: Bell },
  risk: { label: "Risk Events", icon: AlertTriangle },
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const { articles } = useArticles();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results: SearchResult[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const out: SearchResult[] = [];

    // Articles
    for (const a of articles) {
      const hay = `${a.title} ${a.summary ?? ""}`.toLowerCase();
      if (hay.includes(query)) {
        out.push({
          kind: "article",
          id: `a-${a.id}`,
          title: a.title,
          subtitle: a.source,
          externalUrl: a.link,
        });
      }
      if (out.filter((r) => r.kind === "article").length >= 5) break;
    }

    // Countries
    const countries = computeTrendingCountries(articles);
    for (const c of countries) {
      if (
        c.countryName.toLowerCase().includes(query) ||
        c.countryCode.toLowerCase().includes(query)
      ) {
        out.push({
          kind: "country",
          id: `c-${c.countryCode}`,
          title: c.countryName,
          subtitle: `Risk ${c.riskScore} · ${c.mentionCount} mentions`,
          href: `/country?code=${c.countryCode}`,
        });
      }
      if (out.filter((r) => r.kind === "country").length >= 5) break;
    }

    // Alerts
    const alerts = generateLocalAlerts(articles);
    for (const al of alerts) {
      if (al.title.toLowerCase().includes(query) || al.category.toLowerCase().includes(query)) {
        out.push({
          kind: "alert",
          id: `al-${al.id}`,
          title: al.title,
          subtitle: `${al.severity} · ${al.category}`,
          href: "/",
        });
      }
      if (out.filter((r) => r.kind === "alert").length >= 5) break;
    }

    // Risks
    const risks = computeLocalTopRisks(articles);
    for (const r of risks) {
      if (
        r.riskName.toLowerCase().includes(query) ||
        r.regionAffected.toLowerCase().includes(query)
      ) {
        out.push({
          kind: "risk",
          id: `r-${r.riskName}`,
          title: r.riskName,
          subtitle: `Severity ${r.severityScore} · ${r.regionAffected}`,
          href: "/",
        });
      }
      if (out.filter((r) => r.kind === "risk").length >= 5) break;
    }

    return out;
  }, [q, articles]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const groups = useMemo(() => {
    const map = new Map<ResultKind, SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.kind) ?? [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return [...map.entries()];
  }, [results]);

  const select = (r: SearchResult) => {
    setOpen(false);
    setQ("");
    if (r.externalUrl) {
      window.open(r.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (r.href) {
      // Use navigate with raw href; supports query strings.
      navigate({ to: r.href });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) select(target);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let flatIndex = -1;

  return (
    <div ref={wrapRef} className="relative flex items-center gap-3 flex-1 max-w-xl">
      <Search className="size-4 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search intelligence, countries, events…"
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />

      {open && q.trim() && (
        <div className="absolute left-6 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-popover/95 backdrop-blur-xl shadow-lg z-50">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              No intelligence matches found.
            </div>
          ) : (
            groups.map(([kind, items]) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              return (
                <div key={kind} className="py-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Icon className="size-3" /> {meta.label}
                  </div>
                  {items.map((r) => {
                    flatIndex += 1;
                    const isActive = flatIndex === active;
                    return (
                      <button
                        key={r.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => select(r)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-accent/40 ${
                          isActive ? "bg-accent/40" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{r.title}</div>
                          {r.subtitle && (
                            <div className="text-[11px] text-muted-foreground truncate">
                              {r.subtitle}
                            </div>
                          )}
                        </div>
                        {r.externalUrl && (
                          <ExternalLink className="size-3 mt-1 opacity-50 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
