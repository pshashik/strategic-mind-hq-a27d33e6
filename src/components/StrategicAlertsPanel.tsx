import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  synthesizeStrategicAlerts,
  type AlertSeverity,
  type StrategicAlert,
} from "@/lib/alerts.functions";
import {
  isAlertsCacheFresh,
  isAlertsFetchInFlight,
  readAlertsCache,
  setAlertsFetchInFlight,
  writeAlertsCache,
} from "@/lib/alerts-cache";
import { formatAlertTimestamp, type NewsItem } from "@/lib/news-service";

interface Props {
  articles: NewsItem[];
}

function severityDotClass(severity: AlertSeverity): string {
  return {
    Critical: "bg-risk-critical animate-pulse",
    High: "bg-risk-high",
    Medium: "bg-risk-medium",
    Low: "bg-risk-low",
  }[severity];
}

function severityBadgeClass(severity: AlertSeverity): string {
  return {
    Critical: "text-risk-critical bg-risk-critical/20 border-risk-critical/40 animate-pulse",
    High: "text-risk-high bg-risk-high/10 border-risk-high/30",
    Medium: "text-risk-medium bg-risk-medium/10 border-risk-medium/30",
    Low: "text-risk-low bg-risk-low/10 border-risk-low/30",
  }[severity];
}

function ScanningIndicator() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-sm text-primary font-medium">
      Scanning Tactical Patterns{dots}
    </span>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Generating strategic alerts">
      <div className="flex items-center gap-2 pb-1">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-primary" />
        </span>
        <ScanningIndicator />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-2 rounded-md bg-background/40">
          <Skeleton className="mt-1 size-2 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertItem({ alert, fallbackTs }: { alert: StrategicAlert; fallbackTs?: number }) {
  const timestamp = formatAlertTimestamp(alert.timestamp, fallbackTs);

  return (
    <li className="flex gap-3 p-2 rounded-md bg-background/40">
      <span className={`mt-1 size-2 rounded-full shrink-0 ${severityDotClass(alert.severity)}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm leading-snug">{alert.title}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={`px-1.5 py-0.5 rounded border font-medium ${severityBadgeClass(alert.severity)}`}>
            {alert.severity}
          </span>
          <span className="text-muted-foreground">{alert.category}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{timestamp}</span>
        </div>
      </div>
    </li>
  );
}

export function StrategicAlertsPanel({ articles }: Props) {
  const synthesize = useServerFn(synthesizeStrategicAlerts);
  const [alerts, setAlerts] = useState<StrategicAlert[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAlerts = useCallback(
    async (feedKey: string, force = false) => {
      if (articles.length === 0) return;

      if (!force) {
        const cached = readAlertsCache();
        if (isAlertsCacheFresh(cached)) {
          setAlerts(cached!.alerts);
          return;
        }
        if (isAlertsFetchInFlight()) return;
      }

      setAlertsFetchInFlight(true);
      setGenerating(true);
      setError(null);

      try {
        const res = await synthesize({
          data: {
            articles: articles.map(({ title, summary, pubDate }) => ({
              title,
              summary: summary ?? "",
              pubDate,
            })),
          },
        });

        if (!mountedRef.current) return;

        if (res.error || !res.result) {
          setError(res.error ?? "Failed to generate strategic alerts.");
          const stale = readAlertsCache();
          if (stale?.alerts.length) setAlerts(stale.alerts);
          else setAlerts(null);
        } else {
          writeAlertsCache(feedKey, res.result);
          setAlerts(res.result);
        }
      } catch (e) {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to generate strategic alerts.");
        const stale = readAlertsCache();
        if (stale?.alerts.length) setAlerts(stale.alerts);
        else setAlerts(null);
      } finally {
        setAlertsFetchInFlight(false);
        if (mountedRef.current) setGenerating(false);
      }
    },
    [articles, synthesize],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (articles.length === 0) return;

    const feedKey = articles.map((a) => a.id).join("|");
    const cached = readAlertsCache();

    if (isAlertsCacheFresh(cached)) {
      setAlerts(cached!.alerts);
      return;
    }

    fetchAlerts(feedKey);

    return () => {
      mountedRef.current = false;
    };
  }, [articles, fetchAlerts]);

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="size-4 text-risk-critical" /> Strategic Alerts
        </h2>
      </header>

      {error && (
        <div className="mb-3 text-xs px-3 py-2 rounded-md border border-destructive/40 bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {generating ? (
        <AlertsSkeleton />
      ) : alerts && alerts.length > 0 ? (
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <AlertItem key={a.id} alert={a} fallbackTs={articles[i]?.pubDate ?? articles[0]?.pubDate} />
          ))}
        </ul>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Waiting for live intelligence feed…</p>
      ) : null}
    </section>
  );
}
