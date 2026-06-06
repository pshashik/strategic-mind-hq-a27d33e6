import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus, TrendingUp as PanelIcon } from "lucide-react";
import { riskColor } from "@/components/AppLayout";
import {
  computeTrendingCountries,
  type TrendDirection,
  type TrendingCountry,
} from "@/lib/countries.functions";
import type { NewsItem } from "@/lib/news-service";

interface Props {
  articles: NewsItem[];
}

function riskTierFromScore(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function trendColorClass(direction: TrendDirection): string {
  return {
    up: "text-emerald-400",
    down: "text-rose-400",
    stable: "text-slate-400",
  }[direction];
}

function formatTrendChange(country: TrendingCountry): string {
  const sign = country.trendDirection === "down" ? "-" : country.trendDirection === "up" ? "+" : "";
  const abs = Math.abs(country.percentageChange);
  if (country.trendDirection === "stable" && abs === 0) return "0%";
  return `${sign}${abs}%`;
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  const cls = `size-3.5 shrink-0 ${trendColorClass(direction)}`;
  if (direction === "up") return <TrendingUp className={cls} />;
  if (direction === "down") return <TrendingDown className={cls} />;
  return <Minus className={cls} />;
}

function CountryRow({ country }: { country: TrendingCountry }) {
  const tier = riskTierFromScore(country.riskScore);
  const trendClass = trendColorClass(country.trendDirection);

  return (
    <li className="flex items-center justify-between p-2 rounded-md hover:bg-accent/30">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-8 rounded-md bg-muted text-xs font-semibold flex items-center justify-center shrink-0 tracking-wide"
          title={country.countryName}
        >
          {country.countryCode}
        </div>
        <div className="min-w-0">
          <div className="text-sm truncate">{country.countryName}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[11px] inline-block px-1.5 py-0.5 rounded border ${riskColor(tier)}`}>
              {tier}
            </span>
            <span className="text-[10px] text-muted-foreground">{country.mentionCount} mentions</span>
          </div>
        </div>
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium shrink-0 ${trendClass}`}>
        <TrendIcon direction={country.trendDirection} />
        {formatTrendChange(country)}
      </div>
    </li>
  );
}

export function TrendingCountriesPanel({ articles }: Props) {
  const countries = useMemo(
    () =>
      articles.length > 0
        ? computeTrendingCountries(
            articles.map(({ title, summary }) => ({ title, summary: summary ?? "" })),
          )
        : [],
    [articles],
  );

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <PanelIcon className="size-4 text-primary" /> Trending Countries
        </h2>
      </header>

      {countries.length > 0 ? (
        <ul className="space-y-2.5">
          {countries.map((c) => (
            <CountryRow key={c.countryCode} country={c} />
          ))}
        </ul>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Waiting for live intelligence feed…</p>
      ) : (
        <p className="text-sm text-muted-foreground">No country mentions detected in current feed.</p>
      )}
    </section>
  );
}
