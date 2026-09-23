import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { transitionQuotation, duplicateQuotation, createRevision, fetchRevisions, fetchHistory } from "../../store/slices/quotationSlice";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import toast from "react-hot-toast";
import { STATUS, STATUS_LABELS, STATUS_COLORS, REVISABLE_STATUSES } from "../../constants/quotationStatus";
import DocumentsPanel from "../../components/documents/DocumentsPanel";

const fmt = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString("en-IN") : "–";

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAdmin, isSales, user } = useAuth();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [history, setHistory] = useState([]);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptanceLink, setAcceptanceLink] = useState(null);

  const load = () => {
    api.get(`/quotations/${id}`)
      .then((res) => { setQ(res.data.data); setLoading(false); })
      .catch(() => { toast.error("Quotation not found"); navigate("/quotations"); });
    dispatch(fetchRevisions(id)).then((res) => { if (!res.error) setRevisions(res.payload); });
    dispatch(fetchHistory(id)).then((res) => { if (!res.error) setHistory(res.payload); });
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOwner = q && (String(q.assignedTo?._id || q.assignedTo) === user?._id || String(q.createdBy?._id || q.createdBy) === user?._id);

  const runAction = async (action, comment) => {
    const res = await dispatch(transitionQuotation({ id, action, comment }));
    if (!res.error) {
      toast.success("Updated!");
      if (res.payload.acceptanceUrl) setAcceptanceLink(window.location.origin + res.payload.acceptanceUrl);
      load();
    } else toast.error(res.payload);
    return !res.error;
  };

  const handleSubmitForReview = () => runAction("SUBMIT_FOR_REVIEW");
  const handleApprove = () => { if (window.confirm("Approve this quotation?")) runAction("APPROVE"); };
  const handleSend = () => { if (window.confirm("Send this quotation to the customer? An acceptance link will be generated.")) runAction("SEND"); };
  const handleMarkExpired = () => { if (window.confirm("Mark this quotation as expired?")) runAction("MARK_EXPIRED"); };
  const handleCancel = () => {
    if (!window.confirm("Cancel this quotation? This cannot be undone.")) return;
    runAction(isSales ? "CANCEL_OWN_DRAFT" : "CANCEL");
  };
  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("A rejection reason is required.");
    const ok = await runAction("REJECT_TO_DRAFT", rejectReason);
    if (ok) { setRejectModal(false); setRejectReason(""); }
  };

  const handleCreateRevision = async () => {
    if (!window.confirm("Create a new editable revision? The current version will remain unchanged and read-only.")) return;
    const res = await dispatch(createRevision(id));
    if (!res.error) { toast.success(`Revision ${res.payload.revisionNumber} created!`); navigate(`/quotations/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  const handleDuplicate = async () => {
    const res = await dispatch(duplicateQuotation(id));
    if (!res.error) { toast.success("Duplicated!"); navigate(`/quotations/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  const handleGeneratePDF = async () => {
    setDownloading(true);
    try {
      const res = await api.post(`/quotations/${id}/pdf`, null, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${q.quotNo.replace(/\//g, "-")}-Rev${q.revisionNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF generated!");
    } catch (e) {
      toast.error(e.response?.data?.message || "PDF generation failed.");
    }
    setDownloading(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#1F3C88" }}>Loading…</div>;
  if (!q) return null;

  const canEdit = q.status === STATUS.DRAFT;
  const canSubmit = q.status === STATUS.DRAFT && (isOwner || isAdmin);
  const canCancelDraft = q.status === STATUS.DRAFT && (isOwner || isAdmin);
  const canApproveReject = q.status === STATUS.INTERNAL_REVIEW && isAdmin;
  const canSend = q.status === STATUS.APPROVED && isAdmin;
  const canMarkExpired = q.status === STATUS.SENT && isAdmin;
  const canCancelLater = [STATUS.INTERNAL_REVIEW, STATUS.APPROVED, STATUS.SENT].includes(q.status) && isAdmin;
  const canRevise = REVISABLE_STATUSES.includes(q.status) && (isOwner || isAdmin);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={styles.hdr}>
        <div>
          <button style={styles.backBtn} onClick={() => navigate("/quotations")}>← Back to Quotations</button>
          <h1 style={styles.h1}>{q.quotNo} <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>(Rev {q.revisionNumber}{!q.isLatestRevision ? " — superseded" : ""})</span></h1>
          <span style={{ ...styles.badge, background: (STATUS_COLORS[q.status] || "#888") + "22", color: STATUS_COLORS[q.status] || "#888" }}>{STATUS_LABELS[q.status] || q.status}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canEdit && <button style={styles.btn} onClick={() => navigate(`/quotations/${id}/edit`)}>✏️ Edit Draft</button>}
          <button style={styles.btn} onClick={handleDuplicate}>📋 Duplicate</button>
          <button style={{ ...styles.btn, background: "#1F3C88", color: "#fff", borderColor: "#1F3C88", opacity: downloading ? 0.7 : 1 }} onClick={handleGeneratePDF} disabled={downloading}>
            {downloading ? "Generating…" : q.status === STATUS.DRAFT ? "⬇ Preview PDF" : "⬇ Generate & Download PDF"}
          </button>
        </div>
      </div>

      {/* Workflow actions */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Workflow</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canSubmit && <button style={styles.actionBtn("#1F3C88")} onClick={handleSubmitForReview}>Submit for Review</button>}
          {canCancelDraft && <button style={styles.actionBtn("#991B1B")} onClick={handleCancel}>Cancel</button>}
          {canApproveReject && <button style={styles.actionBtn("#166534")} onClick={handleApprove}>✓ Approve</button>}
          {canApproveReject && <button style={styles.actionBtn("#991B1B")} onClick={() => setRejectModal(true)}>✕ Reject to Draft</button>}
          {canSend && <button style={styles.actionBtn("#1E40AF")} onClick={handleSend}>Send to Customer</button>}
          {canMarkExpired && <button style={styles.actionBtn("#78350F")} onClick={handleMarkExpired}>Mark Expired</button>}
          {canCancelLater && <button style={styles.actionBtn("#991B1B")} onClick={handleCancel}>Cancel</button>}
          {canRevise && <button style={styles.actionBtn("#6D28D9")} onClick={handleCreateRevision}>+ Create New Revision</button>}
          {q.status === STATUS.INTERNAL_REVIEW && isSales && <span style={{ fontSize: 13, color: "#9CA3AF", alignSelf: "center" }}>Awaiting admin review.</span>}
          {!canSubmit && !canCancelDraft && !canApproveReject && !canSend && !canMarkExpired && !canCancelLater && !canRevise && q.status === STATUS.DRAFT && (
            <span style={{ fontSize: 13, color: "#9CA3AF", alignSelf: "center" }}>No actions available for your role.</span>
          )}
        </div>

        {acceptanceLink && (
          <div style={styles.linkBox}>
            <strong>Customer acceptance link (shown once):</strong>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input readOnly style={styles.linkInput} value={acceptanceLink} onFocus={(e) => e.target.select()} />
              <button style={styles.btn} onClick={() => { navigator.clipboard.writeText(acceptanceLink); toast.success("Copied!"); }}>Copy</button>
            </div>
            <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 6 }}>Share this link with the customer manually (email sending is a future phase). It won't be shown again.</p>
          </div>
        )}

        {(q.approvedBy || q.rejectedBy || q.sentBy || q.customerAcceptedAt || q.customerRejectedAt) && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6", fontSize: 12.5, color: "#374151", display: "flex", flexDirection: "column", gap: 4 }}>
            {q.approvedBy && <div>Approved by <strong>{q.approvedBy.name}</strong> on {fmtDate(q.approvedAt)}</div>}
            {q.rejectedBy && <div>Rejected by <strong>{q.rejectedBy.name}</strong> on {fmtDate(q.rejectedAt)}: "{q.rejectionReason}"</div>}
            {q.sentBy && <div>Sent by <strong>{q.sentBy.name}</strong> on {fmtDate(q.sentAt)}</div>}
            {q.customerAcceptedAt && <div style={{ color: "#166534" }}>Customer accepted on {fmtDate(q.customerAcceptedAt)}{q.customerAcceptanceComment && ` — "${q.customerAcceptanceComment}"`}</div>}
            {q.customerRejectedAt && <div style={{ color: "#991B1B" }}>Customer rejected on {fmtDate(q.customerRejectedAt)}: "{q.customerRejectionReason}"</div>}
          </div>
        )}
      </div>

      {/* Client Info */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Client Details</h2>
        <div style={styles.grid2}>
          {[
            ["Client Name", q.clientName], ["Company", q.clientCompany],
            ["Email", q.clientEmail], ["Phone", q.clientPhone],
            ["City", q.clientCity], ["State", q.clientState],
          ].map(([l, v]) => v ? (
            <div key={l}>
              <div style={styles.infoLabel}>{l}</div>
              <div style={styles.infoVal}>{v}</div>
            </div>
          ) : null)}
        </div>
        <div style={styles.grid2}>
          <div><div style={styles.infoLabel}>Date</div><div style={styles.infoVal}>{new Date(q.date).toLocaleDateString("en-IN")}</div></div>
          <div><div style={styles.infoLabel}>Valid Until</div><div style={styles.infoVal}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-IN") : "–"}</div></div>
        </div>
        {(q.customer || q.enquiry) && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6", display: "flex", gap: 24, flexWrap: "wrap" }}>
            {q.customer && <div><span style={styles.infoLabel}>Customer: </span><span style={{ ...styles.infoVal, color: "#1F3C88" }}>{q.customer.customerNumber} — {q.customer.companyName}</span></div>}
            {q.enquiry && <div><span style={styles.infoLabel}>Enquiry: </span><span style={{ ...styles.infoVal, color: "#1F3C88" }}>{q.enquiry.enquiryNumber} — {q.enquiry.subject}</span></div>}
          </div>
        )}
        {isAdmin && q.createdBy && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
            <span style={styles.infoLabel}>Created by: </span>
            <span style={{ ...styles.infoVal, color: "#1F3C88" }}>{q.createdBy.name} ({q.createdBy.role})</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Services ({q.items?.length})</h2>
        <table style={styles.table}>
          <thead><tr>{["#", "Service", "Type", "Qty", "Unit Price", "Amount"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(q.items || []).map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                <td style={{ ...styles.td, textAlign: "center", color: "#6B7280" }}>{i + 1}</td>
                <td style={styles.td}><div style={{ fontWeight: 500 }}>{item.name}</div>{item.description && <div style={{ fontSize: 11, color: "#6B7280" }}>{item.description}</div>}</td>
                <td style={styles.td}>{item.billingType}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>{item.qty}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{fmt(item.unitPrice)}</td>
                <td style={{ ...styles.td, textAlign: "right" }}><strong>{fmt(item.lineAmount)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.totalsBox}>
          {[
            ["Subtotal", fmt(q.subtotal)],
            ...(q.discountAmount > 0 ? [["Discount", `– ${fmt(q.discountAmount)}`]] : []),
            ["Taxable Amount", fmt(q.taxableAmount)],
            ["GST", fmt(q.gstAmount)],
            ...(q.govtFeeTotal > 0 ? [["Govt. Fees", fmt(q.govtFeeTotal)]] : []),
          ].map(([l, v]) => (
            <div key={l} style={styles.totalRow}><span style={{ color: "#6B7280" }}>{l}</span><span>{v}</span></div>
          ))}
          <div style={{ ...styles.totalRow, borderTop: "2px solid #1F3C88", paddingTop: 10, marginTop: 4, fontWeight: 700, fontSize: 16, color: "#1F3C88" }}>
            <span>TOTAL</span><span>{fmt(q.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...styles.card, flex: 1, minWidth: 280 }}>
          <h2 style={styles.cardTitle}>Version History</h2>
          {revisions.map((r) => (
            <div key={r._id} style={{ ...styles.histRow, ...(r._id === q._id ? { background: "#EFF6FF" } : {}) }} onClick={() => r._id !== q._id && navigate(`/quotations/${r._id}`)}>
              <span><strong>Rev {r.revisionNumber}</strong> — {r.quotNo} {r._id === q._id && "(viewing)"}</span>
              <span style={{ color: STATUS_COLORS[r.status], fontWeight: 600 }}>{STATUS_LABELS[r.status] || r.status}</span>
            </div>
          ))}
        </div>

        <div style={{ ...styles.card, flex: 1, minWidth: 280 }}>
          <h2 style={styles.cardTitle}>Workflow History</h2>
          {history.slice().reverse().map((h) => (
            <div key={h._id} style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{h.action.replace(/_/g, " ")}</span>
                <span style={{ color: "#9CA3AF" }}>{fmtDate(h.performedAt)}</span>
              </div>
              <div style={{ color: "#6B7280" }}>
                {h.performedByType === "CUSTOMER" ? "Customer" : h.performedBy?.name || "System"}
                {h.comment && ` — "${h.comment}"`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DocumentsPanel relationKey="quotation" relationId={q._id} allowedTypeGroups={["Quotation"]} title="Quotation Documents" />

      {rejectModal && (
        <div style={styles.overlay} onClick={() => setRejectModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.cardTitle}>Reject Quotation</h2>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Rejection reason *</label>
            <textarea style={styles.textarea} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain what needs to change before resubmission…" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button style={styles.btn} onClick={() => setRejectModal(false)}>Cancel</button>
              <button style={styles.actionBtn("#991B1B")} onClick={handleReject}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  hdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: "4px 0" },
  backBtn: { background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 4, display: "block" },
  badge: { padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500 },
  btn: { padding: "9px 16px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  actionBtn: (color) => ({ padding: "9px 16px", border: `1px solid ${color}`, color, borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }),
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 14px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", marginBottom: 12 },
  infoLabel: { fontSize: 11.5, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.4 },
  infoVal: { fontSize: 14, fontWeight: 500, marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 12 },
  th: { padding: "9px 12px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#fff", background: "#1E3A8A", borderBottom: "1px solid #E5E7EB" },
  td: { padding: "10px 12px", fontSize: 13.5, borderBottom: "1px solid #F3F4F6" },
  totalsBox: { maxWidth: 340, marginLeft: "auto", padding: "12px 0" },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F9FAFB", fontSize: 13.5 },
  histRow: { display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer", marginBottom: 4 },
  linkBox: { marginTop: 14, padding: "12px 14px", background: "#EFF6FF", border: "1px solid #1F3C88", borderRadius: 8 },
  linkInput: { flex: 1, padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12.5, fontFamily: "monospace" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 10, padding: 24, width: "100%", maxWidth: 480 },
  textarea: { width: "100%", marginTop: 6, padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 14, height: 90, fontFamily: "inherit", boxSizing: "border-box" },
};
