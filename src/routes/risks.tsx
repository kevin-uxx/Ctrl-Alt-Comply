import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGrc } from "@/lib/grc-store";
import { NIST_FUNCTIONS, type Risk } from "@/lib/grc-types";
import { NistBadge, RatingBadge, StatusBadge, scoreToRating } from "@/components/grc-badges";
import { RiskDialog } from "@/components/risk-dialog";

export const Route = createFileRoute("/risks")({
  head: () => ({
    meta: [
      { title: "Risk Register — Ctrl+Alt+Comply" },
      { name: "description", content: "Centralized risk register with likelihood × impact scoring, NIST CSF mapping, and ownership." },
    ],
  }),
  component: RisksPage,
});

function RisksPage() {
  const { risks, addRisk, updateRisk, deleteRisk } = useGrc();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  const [owner, setOwner] = useState("all");
  const [fn, setFn] = useState("all");
  const [editing, setEditing] = useState<Risk | null>(null);
  const [open, setOpen] = useState(false);

  const owners = useMemo(
    () => Array.from(new Set(risks.map((r) => r.owner))).filter(Boolean).sort(),
    [risks],
  );

  const filtered = risks
    .map((r) => ({ ...r, score: r.likelihood * r.impact }))
    .filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (rating !== "all" && scoreToRating(r.score) !== rating) return false;
      if (owner !== "all" && r.owner !== owner) return false;
      if (fn !== "all" && r.nist !== fn) return false;
      if (q && !`${r.id} ${r.title} ${r.asset}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <PageHeader
        title="Risk Register"
        description="Risk Score = Likelihood × Impact. Ratings: 1–3 Low · 4–8 Medium · 9–15 High · 16–25 Critical."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="size-4" /> Add Risk
          </Button>
        }
      />
      <div className="px-6 lg:px-10 py-8 space-y-4">
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search risk ID, title, asset…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <FilterSelect label="Status" value={status} onChange={setStatus}
              options={["Open", "In Treatment", "Mitigated", "Accepted", "Closed"]} />
            <FilterSelect label="Rating" value={rating} onChange={setRating}
              options={["Critical", "High", "Medium", "Low"]} />
            <FilterSelect label="Owner" value={owner} onChange={setOwner} options={owners} />
            <FilterSelect label="NIST Function" value={fn} onChange={setFn} options={NIST_FUNCTIONS as unknown as string[]} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Asset/Process</TableHead>
                  <TableHead>L</TableHead>
                  <TableHead>I</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>NIST</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[320px]">{r.description}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.asset}</TableCell>
                    <TableCell className="font-mono">{r.likelihood}</TableCell>
                    <TableCell className="font-mono">{r.impact}</TableCell>
                    <TableCell className="font-mono font-semibold">{r.score}</TableCell>
                    <TableCell><RatingBadge rating={scoreToRating(r.score)} /></TableCell>
                    <TableCell><NistBadge fn={r.nist} /></TableCell>
                    <TableCell className="text-sm">{r.owner}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.dueDate}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm(`Delete risk ${r.id}?`)) {
                          deleteRisk(r.id);
                          toast.success(`Risk ${r.id} deleted`);
                        }
                      }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                      No risks match your filters. Adjust filters or complete the assessment to populate the register.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RiskDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={(data, id) => {
          if (id) {
            updateRisk(id, data);
            toast.success(`Risk ${id} updated`);
          } else {
            addRisk(data);
            toast.success("Risk added");
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