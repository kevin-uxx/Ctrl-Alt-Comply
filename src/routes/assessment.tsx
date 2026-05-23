import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw, Info } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QUESTIONS, useGrc } from "@/lib/grc-store";
import { NistBadge } from "@/components/grc-badges";
import type { AnswerValue } from "@/lib/grc-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Risk Assessment — Ctrl+Alt+Comply" },
      { name: "description", content: "Answer the cybersecurity control questionnaire. Weak answers automatically generate risks in the register." },
    ],
  }),
  component: AssessmentPage,
});

const OPTIONS: { value: AnswerValue; tone: string }[] = [
  { value: "Yes", tone: "border-success/40 data-[active=true]:bg-success data-[active=true]:text-white data-[active=true]:border-success" },
  { value: "Partially", tone: "border-warning/40 data-[active=true]:bg-warning data-[active=true]:text-foreground data-[active=true]:border-warning" },
  { value: "No", tone: "border-critical/40 data-[active=true]:bg-critical data-[active=true]:text-white data-[active=true]:border-critical" },
  { value: "Not Sure", tone: "border-muted-foreground/40 data-[active=true]:bg-muted-foreground data-[active=true]:text-background" },
];

function AssessmentPage() {
  const { answers, setAnswer, regenerateFromAnswers } = useGrc();
  const answered = QUESTIONS.filter((q) => answers[q.id]).length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);

  return (
    <TooltipProvider delayDuration={150}>
      <PageHeader
        title="Risk Assessment Questionnaire"
        description="Assess controls across 15 cybersecurity domains. Answers of No, Partially, or Not Sure will generate risks mapped to NIST CSF 2.0."
        actions={
          <Button
            onClick={() => {
              regenerateFromAnswers();
              toast.success("Risk register and remediation tasks refreshed from assessment");
            }}
          >
            <RefreshCw className="size-4" /> Sync Risks & Tasks
          </Button>
        }
      />
      <div className="px-6 lg:px-10 py-8 space-y-6 max-w-5xl">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <CheckCircle2 className="size-5 text-success" />
            <div className="flex-1">
              <div className="text-sm font-medium">
                {answered} of {QUESTIONS.length} controls assessed
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </div>
            <div className="font-display text-2xl font-semibold">{progress}%</div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {QUESTIONS.map((q, i) => {
            const current = answers[q.id];
            return (
              <Card key={q.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start gap-3 justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
                        <span>·</span>
                        <span>{q.controlArea}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3.5 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Weak answers (No / Partially / Not Sure) generate a tracked risk: "{q.riskTitle}".
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="font-medium text-foreground">{q.question}</div>
                    </div>
                    <NistBadge fn={q.nist} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        data-active={current === opt.value}
                        onClick={() => setAnswer(q.id, opt.value)}
                        className={`text-sm font-medium rounded-md border bg-background hover:bg-muted px-3 py-2 transition-colors ${opt.tone}`}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}