/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!wrapRef.current) return;
      setDropdownRect(wrapRef.current.getBoundingClientRect());
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedInput = wrapRef.current?.contains(target);

      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedInput && !clickedDropdown) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const results: SearchResult[] = useMemo(() => {
    const query = q.trim().toLowerCase();

    if (!query) return [];

    const out: SearchResult[] = [];

    // Articles
    for (const a of articles) {
      const haystack = `${a.title} ${a.summary ?? ""}`.toLowerCase();

      if (haystack.includes(query)) {
        out.push({
          kind: "article",
          id: `a-${a.id}`,
          title: a.title,
          subtitle: a.source,
          externalUrl: a.link,
        });
      }

      if (out.filter((x) => x.kind === "article").length >= 5) break;
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
          to: "/country",
          search: {
            code: c.countryCode,
          },
        });
      }

      if (out.filter((x) => x.kind === "country").length >= 5) break;
    }

    // Alerts
    const alerts = generateLocalAlerts(articles);

    for (const alert of alerts) {
      if (
        alert.title.toLowerCase().includes(query) ||
        alert.category.toLowerCase().includes(query)
      ) {
        out.push({
          kind: "alert",
          id: `al-${alert.id}`,
          title: alert.title,
          subtitle: `${alert.severity} · ${alert.category}`,
          to: "/",
        });
      }

      if (out.filter((x) => x.kind === "alert").length >= 5) break;
    }

    // Risks
    const risks = computeLocalTopRisks(articles);

    for (const risk of risks) {
      if (
        risk.riskName.toLowerCase().includes(query) ||
        risk.regionAffected.toLowerCase().includes(query)
      ) {
        out.push({
          kind: "risk",
          id: `r-${risk.riskName}`,
          title: risk.riskName,
          subtitle: `Severity ${risk.severityScore} · ${risk.regionAffected}`,
          to: "/",
        });
      }

      if (out.filter((x) => x.kind === "risk").length >= 5) break;
    }

    return out;
  }, [q, articles]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const groups = useMemo(() => {
    const map = new Map<ResultKind, SearchResult[]>();

    for (const result of results) {
      const arr = map.get(result.kind) ?? [];
      arr.push(result);
      map.set(result.kind, arr);
    }

    return [...map.entries()];
  }, [results]);

  const select = (result: SearchResult) => {
    setOpen(false);
    setQ("");

    if (result.externalUrl) {
      window.open(result.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (result.to) {
      navigate({
        to: result.to,
        search: (result.search ?? {}) as never,
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => Math.min(results.length - 1, prev + 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => Math.max(0, prev - 1));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) select(target);
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let flatIndex = -1;

  return (
    <>
      <div ref={wrapRef} className="relative flex items-center gap-3 flex-1 max-w-xl">
        <Search className="size-4 text-muted-foreground shrink-0" />

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);

            if (wrapRef.current) {
              setDropdownRect(wrapRef.current.getBoundingClientRect());
            }
          }}
          onFocus={() => {
            if (q.trim()) setOpen(true);

            if (wrapRef.current) {
              setDropdownRect(wrapRef.current.getBoundingClientRect());
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="Search intelligence, countries, events..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>

      {open &&
        q.trim() &&
        dropdownRect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownRect.bottom + 8,
              left: dropdownRect.left,
              width: Math.max(dropdownRect.width, 650),
              zIndex: 99999,
              maxHeight: "70vh",
            }}
            className="
      pointer-events-auto
      overflow-y-auto
      rounded-xl
      border
      border-border
      bg-popover/95
      backdrop-blur-xl
      shadow-2xl
    "
          >
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No intelligence matches found.
              </div>
            ) : (
              groups.map(([kind, items]) => {
                const meta = KIND_META[kind];
                const Icon = meta.icon;

                return (
                  <div key={kind} className="py-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Icon className="size-3" />
                      {meta.label}
                    </div>

                    {items.map((item) => {
                      flatIndex += 1;

                      const isActive = flatIndex === active;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            select(item);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-accent/40 ${
                            isActive ? "bg-accent/40" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{item.title}</div>

                            {item.subtitle && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>

                          {item.externalUrl && (
                            <ExternalLink className="size-3 mt-1 opacity-50 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
