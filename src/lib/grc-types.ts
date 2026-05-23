export type NistFunction = "Govern" | "Identify" | "Protect" | "Detect" | "Respond" | "Recover";
export type RiskRating = "Critical" | "High" | "Medium" | "Low";
export type RiskStatus = "Open" | "In Treatment" | "Mitigated" | "Accepted" | "Closed";
export type TaskStatus = "Not Started" | "In Progress" | "Blocked" | "Completed";
export type EvidenceStatus = "Missing" | "Requested" | "Collected" | "Reviewed" | "Accepted";
export type AnswerValue = "Yes" | "Partially" | "No" | "Not Sure";

export interface CompanyProfile {
  name: string;
  industry: string;
  employees: number;
  dataTypes: string;
  complianceGoal: string;
  maturity: string;
  systems: string;
  owner: string;
}

export interface AssessmentQuestion {
  id: string;
  controlArea: string;
  question: string;
  nist: NistFunction;
  riskTitle: string;
  riskDescription: string;
  asset: string;
  likelihood: number;
  impact: number;
  remediation: string;
  evidenceName: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  asset: string;
  likelihood: number;
  impact: number;
  owner: string;
  status: RiskStatus;
  nist: NistFunction;
  remediation: string;
  dueDate: string;
  sourceQuestionId?: string;
}

export interface RemediationTask {
  id: string;
  riskId: string;
  action: string;
  priority: RiskRating;
  owner: string;
  dueDate: string;
  status: TaskStatus;
  evidenceNeeded: string;
  notes: string;
}

export interface Evidence {
  id: string;
  controlArea: string;
  name: string;
  description: string;
  owner: string;
  status: EvidenceStatus;
  collectionDate: string;
  notes: string;
  nist: NistFunction;
}

export function scoreToRating(score: number): RiskRating {
  if (score >= 16) return "Critical";
  if (score >= 9) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

export const NIST_FUNCTIONS: NistFunction[] = [
  "Govern",
  "Identify",
  "Protect",
  "Detect",
  "Respond",
  "Recover",
];