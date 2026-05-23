import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import {
  NIST_FUNCTIONS,
  type Evidence,
  type EvidenceStatus,
  type NistFunction,
} from "@/lib/grc-types";
import { EvidenceStatusBadge, NistBadge } from "@/components/grc-badges";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Audit Evidence — Ctrl+Alt+Comply" },
      { name: "description", content: "Track collection, review, and acceptance of audit evidence for every control area." },
    ],
  }),
  component: EvidencePage,
});

const STATUSES: EvidenceStatus[] = ["Missing", "Requested", "Collected", "Reviewed", "Accepted"];

function EvidencePage() {
  const { evidence, addEvidence, updateEvidence, deleteEvidence } = useGrc();
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Evidence | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = evidence.filter((e) => status === "all" || e.status === status);
  const counts = STATUSES.map((s) => ({ status: s, count: evidence.filter((e) => e.status === s).length }));

  return (
    <>
      <PageHeader
        title="Audit Evidence Tracker"
        description="Centralize artifacts auditors will request: policies, screenshots, exports, attestations, and test results."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="size-4" /> Add Evidence
          </Button>
        }
      />
      <div className="px-6 lg:px-10 py-8 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {counts.map((c) => (
            <Card key={c.status}>
              <CardContent className="p-4">
                <EvidenceStatusBadge status={c.status} />
                <div className="font-display text-3xl font-semibold mt-2">{c.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Control Area</TableHead>
                  <TableHead>NIST</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.id}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.description}</div>
                      {e.notes && <div className="text-xs text-muted-foreground mt-1 italic">Note: {e.notes}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{e.controlArea}</TableCell>
                    <TableCell><NistBadge fn={e.nist} /></TableCell>
                    <TableCell className="text-sm">{e.owner}</TableCell>
                    <TableCell>
                      <Select value={e.status} onValueChange={(v) => updateEvidence(e.id, { status: v as EvidenceStatus, collectionDate: v !== "Missing" && !e.collectionDate ? new Date().toISOString().slice(0, 10) : e.collectionDate })}>
                        <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{e.collectionDate || "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm(`Delete evidence ${e.id}?`)) {
                          deleteEvidence(e.id);
                          toast.success(`Evidence ${e.id} deleted`);
                        }
                      }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      No evidence items. Add policies, exports, screenshots, and attestations as they're produced.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <EvidenceDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={(data, id) => {
          if (id) {
            updateEvidence(id, data);
            toast.success(`Evidence ${id} updated`);
          } else {
            addEvidence(data);
            toast.success("Evidence added");
          }
        }}
      />
    </>
  );
}

function EvidenceDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Evidence | null;
  onSave: (e: Omit<Evidence, "id">, id?: string) => void;
}) {
  const empty: Omit<Evidence, "id"> = {
    controlArea: "",
    name: "",
    description: "",
    owner: "",
    status: "Missing",
    collectionDate: "",
    notes: "",
    nist: "Protect",
  };
  const [form, setForm] = useState<Omit<Evidence, "id">>(empty);
  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Edit Evidence" : "Add Evidence"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="mb-1.5 block">Evidence Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 block">Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Control Area</Label>
            <Input value={form.controlArea} onChange={(e) => setForm({ ...form, controlArea: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">NIST Function</Label>
            <Select value={form.nist} onValueChange={(v) => setForm({ ...form, nist: v as NistFunction })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NIST_FUNCTIONS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Owner</Label>
            <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EvidenceStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Collection Date</Label>
            <Input type="date" value={form.collectionDate} onChange={(e) => setForm({ ...form, collectionDate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(form, initial?.id); onOpenChange(false); }}>
            {initial ? "Save Changes" : "Add Evidence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}