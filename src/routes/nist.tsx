import { createFileRoute } from "@tanstack/react-router";
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
import { QUESTIONS, useComplianceMetrics, useGrc } from "@/lib/grc-store";
import { NIST_FUNCTIONS, type NistFunction } from "@/lib/grc-types";
import { NistBadge, EvidenceStatusBadge, StatusBadge } from "@/components/grc-badges";

export const Route = createFileRoute("/nist")({
  head: () => ({
    meta: [
      { title: "NIST CSF 2.0 Mapping — Ctrl+Alt+Comply" },
      { name: "description", content: "Map risks, controls, evidence, and remediation to the six NIST CSF 2.0 functions." },
    ],
  }),
  component: NistPage,
});

const DESCRIPTIONS: Record<NistFunction, string> = {
  Govern: "Establish and monitor the organization's cybersecurity risk management strategy, expectations, and policy.",
  Identify: "Understand assets, business environment, and risks to systems, people, and data.",
  Protect: "Implement safeguards to deliver critical infrastructure services.",
  Detect: "Develop activities to identify the occurrence of a cybersecurity event.",
  Respond: "Take action regarding a detected cybersecurity incident.",
  Recover: "Restore capabilities or services impaired due to a cybersecurity incident.",
};

function NistPage() {
  const { risks, evidence } = useGrc();
  const m = useComplianceMetrics();

  return (
    <>
      <PageHeader
        title="NIST CSF 2.0 Mapping"
        description="View coverage across all six Cybersecurity Framework 2.0 functions, with linked risks, evidence, and remediation guidance."
      />
      <div className="px-6 lg:px-10 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {NIST_FUNCTIONS.map((fn) => {
            const cov = m.coverage.find((c) => c.function === fn)?.coverage ?? 0;
            const fnRisks = risks.filter((r) => r.nist === fn);
            const fnEv = evidence.filter((e) => e.nist === fn);
            return (
              <Card key={fn}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <NistBadge fn={fn} />
                    <span className="font-mono text-sm">{cov}%</span>
                  </div>
                  <Progress value={cov} className="h-2" />
                  <p className="text-sm text-muted-foreground">{DESCRIPTIONS[fn]}</p>
                  <div className="flex gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
                    <span><b className="text-foreground">{fnRisks.length}</b> risks</span>
                    <span><b className="text-foreground">{fnEv.length}</b> evidence</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {NIST_FUNCTIONS.map((fn) => {
          const fnQs = QUESTIONS.filter((q) => q.nist === fn);
          return (
            <Card key={fn}>
              <CardHeader className="flex flex-row items-center gap-3">
                <NistBadge fn={fn} />
                <CardTitle className="font-display text-lg">{fn} — Control Mapping</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Control Area</TableHead>
                      <TableHead>Related Risk</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead>Evidence Required</TableHead>
                      <TableHead>Evidence Status</TableHead>
                      <TableHead>Recommended Remediation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fnQs.map((q) => {
                      const risk = risks.find((r) => r.sourceQuestionId === q.id);
                      const ev = evidence.find(
                        (e) => e.name.toLowerCase().includes(q.evidenceName.split(" ")[0].toLowerCase()),
                      );
                      return (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium">{q.controlArea}</TableCell>
                          <TableCell>
                            {risk ? (
                              <div>
                                <div className="text-sm font-medium">{risk.title}</div>
                                <div className="text-xs text-muted-foreground font-mono">{risk.id}</div>
                              </div>
                            ) : <span className="text-xs text-success">No active risk</span>}
                          </TableCell>
                          <TableCell>
                            {risk ? <StatusBadge status={risk.status} /> : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm">{q.evidenceName}</TableCell>
                          <TableCell>
                            {ev ? <EvidenceStatusBadge status={ev.status} /> : <span className="text-xs text-destructive">Missing</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs">{q.remediation}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}