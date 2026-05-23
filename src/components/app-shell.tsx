import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  ShieldAlert,
  Network,
  ListChecks,
  FileSearch,
  FileBarChart2,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useGrc } from "@/lib/grc-store";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/company", label: "Company Profile", icon: Building2 },
  { to: "/assessment", label: "Risk Assessment", icon: ClipboardList },
  { to: "/risks", label: "Risk Register", icon: ShieldAlert },
  { to: "/nist", label: "NIST CSF 2.0", icon: Network },
  { to: "/remediation", label: "Remediation", icon: ListChecks },
  { to: "/evidence", label: "Audit Evidence", icon: FileSearch },
  { to: "/report", label: "Executive Report", icon: FileBarChart2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { resetAll, company } = useGrc();
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="font-display text-base font-semibold tracking-tight">
                Ctrl<span className="text-sidebar-primary">+</span>Alt<span className="text-sidebar-primary">+</span>Comply
              </div>
              <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
                GRC Workspace
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                ].join(" ")}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div className="text-xs text-sidebar-foreground/70">
            <div className="font-medium text-sidebar-foreground">{company.name}</div>
            <div>{company.industry}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => {
              if (confirm("Reset all data to seed sample?")) resetAll();
            }}
          >
            <RotateCcw className="size-3.5" /> Reset Sample Data
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card/60 backdrop-blur">
      <div className="px-6 lg:px-10 py-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}