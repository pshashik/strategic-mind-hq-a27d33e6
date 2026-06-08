import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Globe2,
  Flag,
  GitBranch,
  //Radar,
  Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./GlobalSearch";
import company_logo from "../assets/logo.png";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "Research Assistant", icon: MessageSquare },
  { to: "/risk-map", label: "Global Risk Map", icon: Globe2 },
  { to: "/country", label: "Country Intelligence", icon: Flag },
  { to: "/simulator", label: "Scenario Simulator", icon: GitBranch },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
        <div className="px-6 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={company_logo} alt="StrategicMind AI" className="h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gradient leading-tight">
                StrategicMind AI
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Intelligence Suite
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>System</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-risk-low animate-pulse" /> Operational
            </span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-visible">
        {/* <div className="flex-1 flex flex-col min-w-0"> */}
        {/* <header className="h-14 border-b border-border/60 bg-background/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-6"> */}
        <header className="relative overflow-visible h-14 border-b border-border/60 bg-background/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
          <GlobalSearch />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="relative p-2 rounded-md hover:bg-accent/40">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-risk-critical" />
            </button>
            <div className="size-8 rounded-full bg-linear-to-br from-primary/60 to-accent flex items-center justify-center text-xs font-medium text-primary-foreground">
              SP
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

export function riskColor(level: "low" | "medium" | "high" | "critical") {
  return {
    low: "text-risk-low bg-risk-low/10 border-risk-low/30",
    medium: "text-risk-medium bg-risk-medium/10 border-risk-medium/30",
    high: "text-risk-high bg-risk-high/10 border-risk-high/30",
    critical: "text-risk-critical bg-risk-critical/10 border-risk-critical/30",
  }[level];
}
