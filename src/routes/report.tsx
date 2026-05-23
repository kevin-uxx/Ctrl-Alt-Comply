import { createFileRoute } from "@tanstack/react-router";
import { Printer, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { NistBadge, RatingBadge, scoreToRating, EvidenceStatusBadge } from "@/components/grc-badges";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Executive Report — Ctrl+Alt+Comply" },
      { name: "description", content: "Executive-ready compliance posture summary covering risks, gaps, NIST coverage, and remediation roadmap." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { company, tasks, evidence } = useGrc();
  const m = useComplianceMetrics();

  const criticalGaps = [...m.topRisks].filter((r) => r.score >= 9);
  const missingEv = evidence.filter((e) => e.status === "Missing" || e.status === "Requested");
  const roadmap = [...tasks]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 10);

  const recommendations = buildRecommendations(m, missingEv.length);

  return (
    <>
      <PageHeader
        title="Executive Compliance Report"
        description="A board-ready snapshot of cybersecurity posture, risk concentration, and remediation roadmap."
        actions={
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> Export Report
          </Button>
        }
      />
      <div className="px-6 lg:px-10 py-8 print:p-0">
        <div id="report" className="max-w-5xl mx-auto space-y-6 bg-card border border-border rounded-lg p-8 print:border-0 print:shadow-none">
          <header className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" /> Confidential — Internal Use
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight mt-2">
                Cybersecurity & Compliance Posture Report
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Prepared for {company.name} · {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
              <div className="font-display text-5xl font-semibold text-primary">{m.score}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </header>

          <Section title="1. Company Profile">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field k="Company" v={company.name} />
              <Field k="Industry" v={company.industry} />
              <Field k="Employees" v={String(company.employees)} />
              <Field k="Security Maturity" v={company.maturity} />
              <Field k="Compliance Goal" v={company.complianceGoal} />
              <Field k="Security Owner" v={company.owner} />
              <Field k="Data Types" v={company.dataTypes} full />
              <Field k="Business Systems" v={company.systems} full />
            </dl>
          </Section>

          <Section title="2. Compliance Posture">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="Overall Score" value={`${m.score}%`} />
              <Metric label="Total Risks" value={m.totalRisks} />
              <Metric label="Critical + High" value={m.ratingCounts.Critical + m.ratingCounts.High} />
              <Metric label="Missing Evidence" value={m.missingEvidence} />
            </div>
          </Section>

          <Section title="3. Top 5 Risks">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>NIST</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Owner</TableHead>
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
                    <TableCell className="text-sm">{r.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>

          <Section title="4. Critical Gaps">
            <ul className="space-y-2 text-sm">
              {criticalGaps.length === 0 && <li className="text-muted-foreground">No critical or high-rated gaps identified.</li>}
              {criticalGaps.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <RatingBadge rating={scoreToRating(r.score)} />
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-muted-foreground text-xs">{r.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="5. NIST CSF 2.0 Coverage">
            <div className="space-y-3">
              {m.coverage.map((c) => (
                <div key={c.function}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <NistBadge fn={c.function} />
                    <span className="font-mono text-muted-foreground">{c.coverage}%</span>
                  </div>
                  <Progress value={c.coverage} className="h-2" />
                </div>
              ))}
            </div>
          </Section>

          <Section title="6. Missing Evidence">
            {missingEv.length === 0 ? (
              <p className="text-sm text-muted-foreground">All required evidence has been collected.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Control Area</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingEv.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-sm">{e.controlArea}</TableCell>
                      <TableCell className="text-sm">{e.owner}</TableCell>
                      <TableCell><EvidenceStatusBadge status={e.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          <Section title="7. Remediation Roadmap (Top 10)">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roadmap.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><RatingBadge rating={t.priority} /></TableCell>
                    <TableCell className="text-sm">{t.action}</TableCell>
                    <TableCell className="text-sm">{t.owner}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.dueDate}</TableCell>
                  </TableRow>
                ))}
                {roadmap.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No open remediation tasks.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Section>

          <Section title="8. Final Recommendations">
            <ol className="space-y-2 text-sm list-decimal pl-5">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </Section>

          <footer className="border-t border-border pt-4 text-xs text-muted-foreground flex justify-between">
            <span>Generated by Ctrl+Alt+Comply</span>
            <span>Aligned to NIST CSF 2.0</span>
          </footer>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-lg font-semibold tracking-tight border-l-4 border-primary pl-3">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Field({ k, v, full }: { k: string; v: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function buildRecommendations(
  m: ReturnType<typeof useComplianceMetrics>,
  missingEv: number,
): string[] {
  const recs: string[] = [];
  if (m.ratingCounts.Critical > 0) {
    recs.push(`Address all ${m.ratingCounts.Critical} critical risk(s) within 30 days, starting with identity and access controls (MFA enforcement, privileged access review).`);
  }
  if (m.ratingCounts.High > 0) {
    recs.push(`Formally accept, treat, or transfer the ${m.ratingCounts.High} high-rated risk(s) and document treatment plans with owners and target dates.`);
  }
  if (missingEv > 0) {
    recs.push(`Close the audit evidence gap (${missingEv} missing/requested items) by assigning collection owners and weekly cadence reviews.`);
  }
  const weak = m.coverage.filter((c) => c.coverage < 50).map((c) => c.function);
  if (weak.length) {
    recs.push(`Prioritize maturity uplift in weak NIST functions: ${weak.join(", ")}. Adopt a roadmap with 30/60/90-day milestones.`);
  }
  recs.push("Operationalize quarterly access reviews and annual incident response tabletop exercises to sustain compliance posture.");
  recs.push("Implement a vendor risk management program with intake assessments and annual review cadence to address third-party exposure.");
  recs.push("Centralize logging in a SIEM with documented detection rules and assign on-call ownership to satisfy NIST Detect requirements.");
  if (m.score >= 75) {
    recs.push("Engage an external auditor for a readiness assessment to validate the current posture before formal certification.");
  }
  return recs;
}