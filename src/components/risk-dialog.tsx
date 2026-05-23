import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { NIST_FUNCTIONS, type Risk, type RiskStatus } from "@/lib/grc-types";

const STATUSES: RiskStatus[] = ["Open", "In Treatment", "Mitigated", "Accepted", "Closed"];

export function RiskDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Risk | null;
  onSave: (r: Omit<Risk, "id">, id?: string) => void;
}) {
  const empty: Omit<Risk, "id"> = {
    title: "",
    description: "",
    asset: "",
    likelihood: 3,
    impact: 3,
    owner: "",
    status: "Open",
    nist: "Protect",
    remediation: "",
    dueDate: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState<Omit<Risk, "id">>(empty);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : empty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Risk" : "Add Risk"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="mb-1.5 block">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 block">Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Asset / Process</Label>
            <Input value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Owner</Label>
            <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Likelihood (1–5)</Label>
            <Input type="number" min={1} max={5} value={form.likelihood}
              onChange={(e) => setForm({ ...form, likelihood: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Impact (1–5)</Label>
            <Input type="number" min={1} max={5} value={form.impact}
              onChange={(e) => setForm({ ...form, impact: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })} />
          </div>
          <div>
            <Label className="mb-1.5 block">NIST CSF Function</Label>
            <Select value={form.nist} onValueChange={(v) => setForm({ ...form, nist: v as Risk["nist"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NIST_FUNCTIONS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as RiskStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 block">Recommended Remediation</Label>
            <Textarea rows={2} value={form.remediation} onChange={(e) => setForm({ ...form, remediation: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onSave(form, initial?.id);
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Risk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}