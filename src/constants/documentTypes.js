// Must stay in sync with backend/src/config/documentEnums.js.
export const DOCUMENT_TYPE_GROUPS = {
  Customer: ["COMPANY_REGISTRATION", "GST_DOCUMENT", "PAN_DOCUMENT", "ADDRESS_PROOF", "OTHER_CUSTOMER_DOCUMENT"],
  Quotation: ["QUOTATION_PDF", "SUPPORTING_DOCUMENT", "CUSTOMER_ATTACHMENT"],
  "ISO Evidence": ["POLICY", "PROCEDURE", "RECORD", "AUDIT_EVIDENCE", "CERTIFICATE", "SUPPORTING_EVIDENCE", "OTHER_ISO_DOCUMENT"],
};

export const ALL_DOCUMENT_TYPES = Object.values(DOCUMENT_TYPE_GROUPS).flat();

export const DOCUMENT_TYPE_LABELS = {
  COMPANY_REGISTRATION: "Company Registration", GST_DOCUMENT: "GST Document", PAN_DOCUMENT: "PAN Document",
  ADDRESS_PROOF: "Address Proof", OTHER_CUSTOMER_DOCUMENT: "Other (Customer)",
  QUOTATION_PDF: "Quotation PDF", SUPPORTING_DOCUMENT: "Supporting Document", CUSTOMER_ATTACHMENT: "Customer Attachment",
  POLICY: "Policy", PROCEDURE: "Procedure", RECORD: "Record", AUDIT_EVIDENCE: "Audit Evidence",
  CERTIFICATE: "Certificate", SUPPORTING_EVIDENCE: "Supporting Evidence", OTHER_ISO_DOCUMENT: "Other (ISO)",
};

export const STATUS_COLORS = {
  ACTIVE: "#166534", EXPIRING_SOON: "#B45309", EXPIRED: "#991B1B", ARCHIVED: "#6B7280",
};

export const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};
