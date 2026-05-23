import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGrc } from "@/lib/grc-store";
import type { RemediationTask, RiskRating, TaskStatus } from "@/lib/grc-types";
import { RatingBadge, TaskStatusBadge } from "@/components/grc-badges";

export const Route = createFileRoute("/remediation")({
  head: () => ({
    meta: [
      { title: "Remediation Tracker — Ctrl+Alt+Comply" },
      { name: "description", content: "Track owners, priorities, and progress for every remediation action tied to identified risks." },
    ],
  }),
  component: RemediationPage,
});

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Blocked", "Completed"];
const PRIORITIES: RiskRating[] = ["Critical", "High", "Medium", "Low"];

function RemediationPage() {
  const { tasks, risks, addTask, updateTask, deleteTask } = useGrc();
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [editing, setEditing] = useState<RemediationTask | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (priority === "all" || t.priority === priority),
      ),
    [tasks, status, priority],
  );

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Remediation Tracker"
        description="Drive risks to closure with assigned owners, due dates, and required evidence."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="size-4" /> Add Task
          </Button>
        }
      />
      <div className="px-6 lg:px-10 py-8 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUSES.map((s) => (
            <Card key={s}>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s}</div>
                <div className="font-display text-3xl font-semibold mt-1">{counts[s] ?? 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <FilterSelect label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Related Risk</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence Needed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="font-mono text-xs">{t.riskId}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <div className="font-medium text-sm">{t.action}</div>
                      {t.notes && <div className="text-xs text-muted-foreground mt-1">{t.notes}</div>}
                    </TableCell>
                    <TableCell><RatingBadge rating={t.priority} /></TableCell>
                    <TableCell className="text-sm">{t.owner}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{t.dueDate}</TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(v) => updateTask(t.id, { status: v as TaskStatus })}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">{t.evidenceNeeded}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm(`Delete task ${t.id}?`)) {
                          deleteTask(t.id);
                          toast.success(`Task ${t.id} deleted`);
                        }
                      }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                      No remediation tasks match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        riskOptions={risks.map((r) => ({ id: r.id, title: r.title }))}
        onSave={(data, id) => {
          if (id) {
            updateTask(id, data);
            toast.success(`Task ${id} updated`);
          } else {
            addTask(data);
            toast.success("Task added");
          }
        }}
      />
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function TaskDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  riskOptions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RemediationTask | null;
  onSave: (t: Omit<RemediationTask, "id">, id?: string) => void;
  riskOptions: { id: string; title: string }[];
}) {
  const empty: Omit<RemediationTask, "id"> = {
    riskId: riskOptions[0]?.id ?? "",
    action: "",
    priority: "Medium",
    owner: "",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "Not Started",
    evidenceNeeded: "",
    notes: "",
  };
  const [form, setForm] = useState<Omit<RemediationTask, "id">>(empty);
  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Edit Task" : "Add Remediation Task"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Related Risk</Label>
            <Select value={form.riskId} onValueChange={(v) => setForm({ ...form, riskId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {riskOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.id} — {r.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as RiskRating })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 block">Action</Label>
            <Textarea rows={2} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Owner</Label>
            <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Evidence Needed</Label>
            <Input value={form.evidenceNeeded} onChange={(e) => setForm({ ...form, evidenceNeeded: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(form, initial?.id); onOpenChange(false); }}>
            {initial ? "Save Changes" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}