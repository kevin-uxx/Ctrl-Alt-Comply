import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGrc } from "@/lib/grc-store";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company Profile — Ctrl+Alt+Comply" },
      { name: "description", content: "Define the organizational scope of the GRC assessment: industry, systems, data types, and compliance goals." },
    ],
  }),
  component: CompanyPage,
});

const INDUSTRIES = [
  "E-commerce / Retail",
  "Financial Services",
  "Healthcare",
  "SaaS / Technology",
  "Manufacturing",
  "Education",
  "Government",
  "Other",
];

const MATURITY = [
  "Initial",
  "Developing",
  "Defined",
  "Managed",
  "Optimized",
];

const GOALS = [
  "SOC 2 Type I",
  "SOC 2 Type II",
  "ISO 27001",
  "PCI DSS",
  "HIPAA",
  "NIST CSF 2.0 alignment",
  "General security uplift",
];

function CompanyPage() {
  const { company, setCompany } = useGrc();
  const [form, setForm] = useState(company);

  return (
    <>
      <PageHeader
        title="Company Profile"
        description="The organizational scope informs the risk assessment, control selection, and report tailoring."
      />
      <div className="px-6 lg:px-10 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Company Name" tip="Legal entity name used on the compliance report.">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Industry">
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Number of Employees">
              <Input
                type="number"
                min={1}
                value={form.employees}
                onChange={(e) => setForm({ ...form, employees: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Primary Security Owner" tip="Person accountable for the security program.">
              <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </Field>
            <Field label="Security Maturity Level" tip="Self-assessed maturity using a CMM-style scale.">
              <Select value={form.maturity} onValueChange={(v) => setForm({ ...form, maturity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATURITY.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Compliance Goal">
              <Select value={form.complianceGoal} onValueChange={(v) => setForm({ ...form, complianceGoal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOALS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field className="md:col-span-2" label="Types of Data Handled" tip="Examples: PII, PCI, PHI, intellectual property.">
              <Textarea
                rows={3}
                value={form.dataTypes}
                onChange={(e) => setForm({ ...form, dataTypes: e.target.value })}
              />
            </Field>
            <Field className="md:col-span-2" label="Main Business Systems" tip="Critical systems in scope for the assessment.">
              <Textarea
                rows={3}
                value={form.systems}
                onChange={(e) => setForm({ ...form, systems: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setForm(company)}>Cancel</Button>
              <Button
                onClick={() => {
                  setCompany(form);
                  toast.success("Company profile saved");
                }}
              >
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({
  label,
  tip,
  children,
  className,
}: {
  label: string;
  tip?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      {children}
      {tip && <p className="text-xs text-muted-foreground mt-1.5">{tip}</p>}
    </div>
  );
}