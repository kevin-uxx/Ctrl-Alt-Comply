import { Badge } from "@/components/ui/badge";
import type {
  EvidenceStatus,
  NistFunction,
  RiskRating,
  RiskStatus,
  TaskStatus,
} from "@/lib/grc-types";

export function RatingBadge({ rating }: { rating: RiskRating }) {
  const map: Record<RiskRating, string> = {
    Critical: "bg-critical text-white border-transparent",
    High: "bg-high text-white border-transparent",
    Medium: "bg-medium text-foreground border-transparent",
    Low: "bg-low text-white border-transparent",
  };
  return <Badge className={map[rating]}>{rating}</Badge>;
}

export function StatusBadge({ status }: { status: RiskStatus }) {
  const map: Record<RiskStatus, string> = {
    Open: "bg-destructive/15 text-destructive border border-destructive/30",
    "In Treatment": "bg-info/15 text-info border border-info/30",
    Mitigated: "bg-success/15 text-success border border-success/30",
    Accepted: "bg-warning/20 text-foreground border border-warning/40",
    Closed: "bg-muted text-muted-foreground border border-border",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    "Not Started": "bg-muted text-muted-foreground border border-border",
    "In Progress": "bg-info/15 text-info border border-info/30",
    Blocked: "bg-destructive/15 text-destructive border border-destructive/30",
    Completed: "bg-success/15 text-success border border-success/30",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>;
}

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const map: Record<EvidenceStatus, string> = {
    Missing: "bg-destructive/15 text-destructive border border-destructive/30",
    Requested: "bg-warning/20 text-foreground border border-warning/40",
    Collected: "bg-info/15 text-info border border-info/30",
    Reviewed: "bg-primary/15 text-primary border border-primary/30",
    Accepted: "bg-success/15 text-success border border-success/30",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>;
}

export function NistBadge({ fn }: { fn: NistFunction }) {
  const map: Record<NistFunction, string> = {
    Govern: "bg-[oklch(0.4_0.13_290)] text-white",
    Identify: "bg-[oklch(0.55_0.16_220)] text-white",
    Protect: "bg-[oklch(0.45_0.17_255)] text-white",
    Detect: "bg-[oklch(0.6_0.16_180)] text-white",
    Respond: "bg-[oklch(0.6_0.2_30)] text-white",
    Recover: "bg-[oklch(0.6_0.16_150)] text-white",
  };
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium tracking-wide ${map[fn]}`}>{fn}</span>;
}

export function scoreToRating(score: number): RiskRating {
  if (score >= 16) return "Critical";
  if (score >= 9) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}