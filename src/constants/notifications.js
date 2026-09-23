// Must stay in sync with backend/src/config/notificationEnums.js.
export const ALL_NOTIFICATION_TYPES = [
  "LEAD_FOLLOWUP", "QUOTATION_SUBMITTED", "QUOTATION_APPROVAL", "QUOTATION_REJECTED",
  "QUOTATION_ACCEPTED", "QUOTATION_CUSTOMER_REJECTED", "QUOTATION_EXPIRING", "DOCUMENT_EXPIRING",
  "AUDIT_UPCOMING", "AUDIT_COMPLETED", "FINDING_CREATED", "CORRECTIVE_ACTION_ASSIGNED",
  "CORRECTIVE_ACTION_DUE", "CORRECTIVE_ACTION_OVERDUE", "ENGAGEMENT_STATUS_CHANGED",
];

export const NOTIFICATION_TYPE_LABELS = {
  LEAD_FOLLOWUP: "Lead Follow-up", QUOTATION_SUBMITTED: "Quotation Submitted", QUOTATION_APPROVAL: "Quotation Approved",
  QUOTATION_REJECTED: "Quotation Rejected", QUOTATION_ACCEPTED: "Quotation Accepted", QUOTATION_CUSTOMER_REJECTED: "Quotation Rejected by Customer",
  QUOTATION_EXPIRING: "Quotation Expiring", DOCUMENT_EXPIRING: "Document Expiring", AUDIT_UPCOMING: "Audit Upcoming",
  AUDIT_COMPLETED: "Audit Completed", FINDING_CREATED: "Finding Created", CORRECTIVE_ACTION_ASSIGNED: "Corrective Action Assigned",
  CORRECTIVE_ACTION_DUE: "Corrective Action Due Soon", CORRECTIVE_ACTION_OVERDUE: "Corrective Action Overdue",
  ENGAGEMENT_STATUS_CHANGED: "Engagement Status Changed",
};

export const SEVERITY_COLORS = { INFO: "#0369A1", WARNING: "#B45309", CRITICAL: "#991B1B" };

// entityType -> route builder, used by the notification bell/page to
// navigate to the relevant record. Falls back to no-op if unknown.
export const entityLink = (entityType, entityId) => {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "Quotation": return `/quotations/${entityId}`;
    case "IsoEngagement": return `/iso-engagements/${entityId}`;
    case "Audit": case "AuditFinding": case "CorrectiveAction": return null; // surfaced within an engagement's tabs, no standalone route
    case "Document": return null;
    default: return null;
  }
};
