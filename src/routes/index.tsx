import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ShieldAlert,
  FileSearch,
  ListChecks,
  Gauge,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useComplianceMetrics, useGrc } from "@/lib/grc-store";
import { NistBadge, RatingBadge, StatusBadge, scoreToRating } from "@/components/grc-badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ctrl+Alt+Comply" },
      { name: "description", content: "Compliance posture, risk counts, NIST CSF coverage, and remediation status at a glance." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "critical" | "high" | "medium" | "low" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneCls: Record<string, string> = {
    default: "text-foreground",
    critical: "text-critical",
    high: "text-high",
    medium: "text-medium",
    low: "text-low",
    info: "text-info",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className={`mt-2 font-display text-3xl font-semibold ${toneCls[tone]}`}>
              {value}
            </div>
            {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
          </div>
          {Icon && (
            <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center">
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const m = useComplianceMetrics();
  const { company } = useGrc();

  const scoreColor =
    m.score >= 80 ? "var(--success)" : m.score >= 60 ? "var(--info)" : m.score >= 40 ? "var(--warning)" : "var(--critical)";

  const ratingData = [
    { name: "Critical", value: m.ratingCounts.Critical, fill: "var(--critical)" },
    { name: "High", value: m.ratingCounts.High, fill: "var(--high)" },
    { name: "Medium", value: m.ratingCounts.Medium, fill: "var(--medium)" },
    { name: "Low", value: m.ratingCounts.Low, fill: "var(--low)" },
  ];

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        description={`Posture overview for ${company.name}. Updated in real time from the assessment, risk register, and audit evidence.`}
      />
      <div className="px-6 lg:px-10 py-8 space-y-8">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardContent className="p-5 flex items-center gap-6">
              <div className="size-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ name: "score", value: m.score, fill: scoreColor }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={8} background />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Overall Compliance Score
                </div>
                <div className="font-display text-5xl font-semibold mt-1" style={{ color: scoreColor }}>
                  {m.score}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {m.answered} of {m.totalQuestions} controls assessed
                </div>
              </div>
            </CardContent>
          </Card>
          <StatCard label="Total Risks" value={m.totalRisks} icon={ShieldAlert} />
          <StatCard label="Open Remediation" value={m.openTasks} icon={ListChecks} tone="info" />
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Critical" value={m.ratingCounts.Critical} tone="critical" icon={AlertTriangle} />
          <StatCard label="High" value={m.ratingCounts.High} tone="high" icon={AlertTriangle} />
          <StatCard label="Medium" value={m.ratingCounts.Medium} tone="medium" />
          <StatCard label="Low" value={m.ratingCounts.Low} tone="low" />
          <StatCard label="Missing Evidence" value={m.missingEvidence} tone="critical" icon={FileSearch} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Risks by Rating</CardTitle>
              <Gauge className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {ratingData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">NIST CSF 2.0 Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {m.coverage.map((c) => (
                <div key={c.function}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <NistBadge fn={c.function} />
                      <span className="text-muted-foreground">{c.coverage}%</span>
                    </div>
                  </div>
                  <Progress value={c.coverage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Top 5 Highest-Priority Risks</CardTitle>
            <Link
              to="/risks"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View register <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>NIST</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {m.topRisks.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><NistBadge fn={r.nist} /></TableCell>
                    <TableCell className="font-mono">{r.score}</TableCell>
                    <TableCell><RatingBadge rating={scoreToRating(r.score)} /></TableCell>
                    <TableCell className="text-muted-foreground">{r.owner}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
                {m.topRisks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No risks identified yet. Complete the assessment to populate the register.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}