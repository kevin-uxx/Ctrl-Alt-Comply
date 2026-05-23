import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AnswerValue,
  CompanyProfile,
  Evidence,
  RemediationTask,
  Risk,
} from "./grc-types";
import {
  QUESTIONS,
  SEED_ANSWERS,
  SEED_COMPANY,
  SEED_EVIDENCE,
  generateRisksFromAnswers,
  generateTasksFromRisks,
} from "./grc-seed";

interface State {
  company: CompanyProfile;
  answers: Record<string, AnswerValue>;
  risks: Risk[];
  tasks: RemediationTask[];
  evidence: Evidence[];
}

interface Ctx extends State {
  setCompany: (c: CompanyProfile) => void;
  setAnswer: (qid: string, a: AnswerValue) => void;
  regenerateFromAnswers: () => void;
  addRisk: (r: Omit<Risk, "id">) => void;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  addTask: (t: Omit<RemediationTask, "id">) => void;
  updateTask: (id: string, patch: Partial<RemediationTask>) => void;
  deleteTask: (id: string) => void;
  addEvidence: (e: Omit<Evidence, "id">) => void;
  updateEvidence: (id: string, patch: Partial<Evidence>) => void;
  deleteEvidence: (id: string) => void;
  resetAll: () => void;
}

const STORAGE_KEY = "ctrl-alt-comply-v1";

function buildSeed(): State {
  const risks = generateRisksFromAnswers(SEED_ANSWERS);
  const tasks = generateTasksFromRisks(risks);
  return {
    company: SEED_COMPANY,
    answers: SEED_ANSWERS,
    risks,
    tasks,
    evidence: SEED_EVIDENCE,
  };
}

const GrcContext = createContext<Ctx | null>(null);

export function GrcProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => buildSeed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const nextId = (prefix: string, existing: { id: string }[]) => {
    const nums = existing
      .map((x) => parseInt(x.id.split("-")[1] ?? "0", 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
  };

  const value = useMemo<Ctx>(() => {
    return {
      ...state,
      setCompany: (company) => setState((s) => ({ ...s, company })),
      setAnswer: (qid, a) =>
        setState((s) => ({ ...s, answers: { ...s.answers, [qid]: a } })),
      regenerateFromAnswers: () =>
        setState((s) => {
          const newRisks = generateRisksFromAnswers(s.answers);
          // preserve existing risk customizations by sourceQuestionId
          const merged = newRisks.map((nr) => {
            const existing = s.risks.find(
              (r) => r.sourceQuestionId === nr.sourceQuestionId,
            );
            return existing ? { ...nr, status: existing.status, owner: existing.owner, dueDate: existing.dueDate, id: existing.id } : nr;
          });
          const newTasks = generateTasksFromRisks(merged);
          const mergedTasks = newTasks.map((nt) => {
            const existing = s.tasks.find((t) => t.riskId === nt.riskId);
            return existing ? { ...nt, status: existing.status, notes: existing.notes, id: existing.id } : nt;
          });
          return { ...s, risks: merged, tasks: mergedTasks };
        }),
      addRisk: (r) =>
        setState((s) => ({ ...s, risks: [...s.risks, { ...r, id: nextId("R", s.risks) }] })),
      updateRisk: (id, patch) =>
        setState((s) => ({
          ...s,
          risks: s.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRisk: (id) =>
        setState((s) => ({
          ...s,
          risks: s.risks.filter((r) => r.id !== id),
          tasks: s.tasks.filter((t) => t.riskId !== id),
        })),
      addTask: (t) =>
        setState((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: nextId("T", s.tasks) }] })),
      updateTask: (id, patch) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) =>
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      addEvidence: (e) =>
        setState((s) => ({
          ...s,
          evidence: [...s.evidence, { ...e, id: nextId("E", s.evidence) }],
        })),
      updateEvidence: (id, patch) =>
        setState((s) => ({
          ...s,
          evidence: s.evidence.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      deleteEvidence: (id) =>
        setState((s) => ({ ...s, evidence: s.evidence.filter((e) => e.id !== id) })),
      resetAll: () => setState(buildSeed()),
    };
  }, [state]);

  return <GrcContext.Provider value={value}>{children}</GrcContext.Provider>;
}

export function useGrc() {
  const ctx = useContext(GrcContext);
  if (!ctx) throw new Error("useGrc must be inside GrcProvider");
  return ctx;
}

export function useComplianceMetrics() {
  const { risks, tasks, evidence, answers } = useGrc();
  return useMemo(() => {
    const totalQuestions = QUESTIONS.length;
    const weights: Record<AnswerValue, number> = {
      Yes: 1,
      Partially: 0.5,
      No: 0,
      "Not Sure": 0.25,
    };
    let sum = 0;
    let answered = 0;
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (a) {
        sum += weights[a];
        answered++;
      }
    }
    const score = totalQuestions ? Math.round((sum / totalQuestions) * 100) : 0;

    const ratingCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const r of risks) {
      const s = r.likelihood * r.impact;
      const rating = s >= 16 ? "Critical" : s >= 9 ? "High" : s >= 4 ? "Medium" : "Low";
      ratingCounts[rating]++;
    }

    const missingEvidence = evidence.filter(
      (e) => e.status === "Missing" || e.status === "Requested",
    ).length;
    const openTasks = tasks.filter((t) => t.status !== "Completed").length;

    const topRisks = [...risks]
      .map((r) => ({ ...r, score: r.likelihood * r.impact }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // NIST coverage: % of risks per function that are mitigated/closed + evidence accepted
    const fns = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"] as const;
    const coverage = fns.map((fn) => {
      const fnRisks = risks.filter((r) => r.nist === fn);
      const mitigated = fnRisks.filter(
        (r) => r.status === "Mitigated" || r.status === "Closed",
      ).length;
      const fnEv = evidence.filter((e) => e.nist === fn);
      const accepted = fnEv.filter(
        (e) => e.status === "Accepted" || e.status === "Reviewed" || e.status === "Collected",
      ).length;
      const denom = fnRisks.length + fnEv.length;
      const pct = denom === 0 ? 50 : Math.round(((mitigated + accepted) / denom) * 100);
      // Floor based on answered Yes for that function
      const fnQs = QUESTIONS.filter((q) => q.nist === fn);
      const yes = fnQs.filter((q) => answers[q.id] === "Yes").length;
      const partial = fnQs.filter((q) => answers[q.id] === "Partially").length;
      const baseline = fnQs.length
        ? Math.round(((yes + partial * 0.5) / fnQs.length) * 100)
        : 0;
      return { function: fn, coverage: Math.max(pct, baseline) };
    });

    return {
      score,
      answered,
      totalQuestions,
      ratingCounts,
      totalRisks: risks.length,
      missingEvidence,
      openTasks,
      topRisks,
      coverage,
    };
  }, [risks, tasks, evidence, answers]);
}

export { QUESTIONS };