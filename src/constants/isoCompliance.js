// Must stay in sync with backend/src/config/isoComplianceEnums.js.
export const CERTIFICATION_DISCLAIMER =
  "Certification is subject to assessment and decision by an independent, accredited certification body. LauncherDesk provides consulting, readiness preparation, internal audit support and compliance tracking only.";

export const ENGAGEMENT_STATUSES = ["DRAFT", "ACTIVE", "ON_HOLD", "READY_FOR_AUDIT", "AUDIT_IN_PROGRESS", "CORRECTIVE_ACTIONS", "READY_FOR_CERTIFICATION", "COMPLETED", "CANCELLED"];
export const ASSESSMENT_STATUSES = ["NOT_ASSESSED", "COMPLIANT", "PARTIALLY_COMPLIANT", "NON_COMPLIANT", "NOT_APPLICABLE"];
export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const AUDIT_TYPES = ["INTERNAL", "READINESS", "SURVEILLANCE", "FOLLOW_UP", "OTHER"];
export const AUDIT_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export const FINDING_TYPES = ["CONFORMITY", "OBSERVATION", "OPPORTUNITY_FOR_IMPROVEMENT", "MINOR_NONCONFORMITY", "MAJOR_NONCONFORMITY"];
export const FINDING_STATUSES = ["OPEN", "UNDER_REVIEW", "CORRECTIVE_ACTION_REQUIRED", "RESOLVED", "CLOSED", "ACCEPTED_RISK"];
export const CORRECTIVE_ACTION_STATUSES = ["OPEN", "IN_PROGRESS", "SUBMITTED", "VERIFICATION", "EFFECTIVE", "INEFFECTIVE", "CLOSED"];

const labelize = (s) => s.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
export const label = (s) => (s ? labelize(s) : "–");

export const STATUS_COLORS = {
  DRAFT: "#6B7280", ACTIVE: "#0369A1", ON_HOLD: "#B45309", READY_FOR_AUDIT: "#6D28D9",
  AUDIT_IN_PROGRESS: "#1E40AF", CORRECTIVE_ACTIONS: "#B45309", READY_FOR_CERTIFICATION: "#0F766E",
  COMPLETED: "#166534", CANCELLED: "#374151",
  NOT_ASSESSED: "#6B7280", COMPLIANT: "#166534", PARTIALLY_COMPLIANT: "#B45309", NON_COMPLIANT: "#991B1B", NOT_APPLICABLE: "#6B7280",
  PLANNED: "#6B7280", IN_PROGRESS: "#1E40AF",
  OPEN: "#991B1B", UNDER_REVIEW: "#B45309", CORRECTIVE_ACTION_REQUIRED: "#B45309", RESOLVED: "#166534", CLOSED: "#374151", ACCEPTED_RISK: "#6D28D9",
  SUBMITTED: "#0369A1", VERIFICATION: "#6D28D9", EFFECTIVE: "#166534", INEFFECTIVE: "#991B1B",
};

export const RISK_COLORS = { LOW: "#166534", MEDIUM: "#B45309", HIGH: "#C2410C", CRITICAL: "#991B1B" };
export const DUE_STATUS_COLORS = { ON_TRACK: "#166534", DUE_SOON: "#B45309", OVERDUE: "#991B1B", COMPLETED: "#6B7280" };

export const ENGAGEMENT_TRANSITIONS = {
  DRAFT: [["ACTIVATE", "Activate"]],
  ACTIVE: [["HOLD", "Put On Hold"], ["MARK_READY_FOR_AUDIT", "Mark Ready for Audit"], ["CANCEL", "Cancel"]],
  ON_HOLD: [["RESUME", "Resume"], ["CANCEL", "Cancel"]],
  READY_FOR_AUDIT: [["START_AUDIT_PHASE", "Start Audit Phase"], ["CANCEL", "Cancel"]],
  AUDIT_IN_PROGRESS: [["FLAG_CORRECTIVE_ACTIONS", "Flag Corrective Actions Needed"], ["MARK_READY_FOR_CERTIFICATION", "Mark Ready for Certification"], ["CANCEL", "Cancel"]],
  CORRECTIVE_ACTIONS: [["MARK_READY_FOR_CERTIFICATION", "Mark Ready for Certification"], ["CANCEL", "Cancel"]],
  READY_FOR_CERTIFICATION: [["COMPLETE", "Complete Engagement"], ["CANCEL", "Cancel"]],
  COMPLETED: [], CANCELLED: [],
};

export const AUDIT_TRANSITIONS = {
  PLANNED: [["START", "Start Audit"], ["CANCEL", "Cancel"]],
  IN_PROGRESS: [["COMPLETE", "Complete Audit"], ["CANCEL", "Cancel"]],
  COMPLETED: [], CANCELLED: [],
};

export const FINDING_TRANSITIONS = {
  OPEN: [["REVIEW", "Start Review"]],
  UNDER_REVIEW: [["REQUIRE_CORRECTIVE_ACTION", "Requires Corrective Action"], ["RESOLVE", "Resolve"], ["ACCEPT_RISK", "Accept Risk"]],
  CORRECTIVE_ACTION_REQUIRED: [["RESOLVE", "Resolve"], ["ACCEPT_RISK", "Accept Risk"]],
  RESOLVED: [["CLOSE", "Close"], ["REOPEN", "Reopen"]],
  CLOSED: [["REOPEN", "Reopen"]],
  ACCEPTED_RISK: [["REOPEN", "Reopen"]],
};

export const CORRECTIVE_ACTION_TRANSITIONS = {
  OPEN: [["START_PROGRESS", "Start Progress"]],
  IN_PROGRESS: [["SUBMIT", "Submit for Verification"]],
  SUBMITTED: [["START_VERIFICATION", "Begin Verification"]],
  VERIFICATION: [["VERIFY_EFFECTIVE", "Verify: Effective"], ["VERIFY_INEFFECTIVE", "Verify: Ineffective"]],
  EFFECTIVE: [["CLOSE", "Close"]],
  INEFFECTIVE: [["REOPEN_INEFFECTIVE", "Reopen"]],
  CLOSED: [],
};
