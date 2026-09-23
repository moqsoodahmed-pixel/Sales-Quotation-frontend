import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

const fmt = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function PublicQuotationPage() {
  const { token } = useParams();
  const [q, setQ] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const load = () => {
    api.get(`/public/quotations/${token}`)
      .then((res) => { setQ(res.data.data); setError(null); })
      .catch((err) => setError(err.response?.data?.message || "This quotation link is invalid or no longer active."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (action, body) => {
    setSubmitting(true);
    try {
      await api.post(`/public/quotations/${token}/${action}`, body);
      toast.success(action === "accept" ? "Quotation accepted!" : "Response recorded.");
      load();
      setShowReject(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    }
    setSubmitting(false);
  };

  const handleReject = () => {
    if (!reason.trim()) return toast.error("Please provide a reason.");
    respond("reject", { reason });
  };

  if (loading) return <div style={styles.wrap}><div style={styles.card}>Loading…</div></div>;
  if (error) return <div style={styles.wrap}><div style={styles.card}><h2>Unavailable</h2><p>{error}</p></div></div>;

  const canRespond = q.status === "SENT" && !q.isExpired && !q.alreadyRespondedAt;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>LauncherDesk<sup style={{ fontSize: 9 }}>™</sup></div>
          <div style={styles.sub}>Quotation {q.quotNo} (Revision {q.revisionNumber})</div>
        </div>

        {q.isExpired && <div style={styles.notice}>This quotation has expired and can no longer be accepted.</div>}
        {q.alreadyRespondedAt && <div style={styles.notice}>You already responded to this quotation on {new Date(q.alreadyRespondedAt).toLocaleString("en-IN")} (status: {q.status}).</div>}

        <div style={styles.grid2}>
          <div><div style={styles.label}>Client</div><div style={styles.val}>{q.clientCompany || q.clientName}</div></div>
          <div><div style={styles.label}>Date</div><div style={styles.val}>{new Date(q.date).toLocaleDateString("en-IN")}</div></div>
          <div><div style={styles.label}>Valid Until</div><div style={styles.val}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-IN") : "–"}</div></div>
        </div>

        <table style={styles.table}>
          <thead><tr>{["Service", "Qty", "Unit Price", "Amount"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {q.items.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.name}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>{item.qty}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{fmt(item.unitPrice)}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{fmt(item.lineAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.totals}>
          <div style={styles.totalRow}><span>Subtotal</span><span>{fmt(q.subtotal)}</span></div>
          {q.discountAmount > 0 && <div style={styles.totalRow}><span>Discount</span><span>– {fmt(q.discountAmount)}</span></div>}
          <div style={styles.totalRow}><span>GST</span><span>{fmt(q.gstAmount)}</span></div>
          <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: 16, borderTop: "2px solid #1F3C88", paddingTop: 8 }}><span>Total</span><span>{fmt(q.total)}</span></div>
        </div>

        {q.terms?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={styles.label}>Terms</div>
            <ul style={{ fontSize: 12.5, color: "#374151", paddingLeft: 18 }}>{q.terms.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}

        {canRespond && (
          <div style={styles.actions}>
            <button style={styles.acceptBtn} disabled={submitting} onClick={() => respond("accept", {})}>✓ Accept Quotation</button>
            <button style={styles.rejectBtn} disabled={submitting} onClick={() => setShowReject(true)}>✕ Reject</button>
          </div>
        )}

        {showReject && (
          <div style={{ marginTop: 14 }}>
            <textarea style={styles.textarea} placeholder="Reason for rejection…" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={styles.btn} onClick={() => setShowReject(false)}>Cancel</button>
              <button style={styles.rejectBtn} disabled={submitting} onClick={handleReject}>Confirm Rejection</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", background: "#F9FAFB", display: "flex", justifyContent: "center", padding: "40px 16px", fontFamily: "'Inter', system-ui, sans-serif" },
  card: { background: "#fff", borderRadius: 12, padding: "28px 30px", width: "100%", maxWidth: 640, boxShadow: "0 4px 20px rgba(0,0,0,.06)", height: "fit-content" },
  header: { textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" },
  logo: { fontSize: 22, fontWeight: 900, color: "#1F3C88" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  notice: { background: "#FEF3C7", color: "#92400E", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 },
  label: { fontSize: 11, color: "#9CA3AF", textTransform: "uppercase" },
  val: { fontSize: 14, fontWeight: 500, marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 12 },
  th: { padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#6B7280", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" },
  td: { padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #F3F4F6" },
  totals: { maxWidth: 280, marginLeft: "auto" },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13.5 },
  actions: { display: "flex", gap: 10, marginTop: 22 },
  acceptBtn: { flex: 1, padding: "12px", background: "#166534", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  rejectBtn: { flex: 1, padding: "12px", background: "#991B1B", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btn: { flex: 1, padding: "12px", border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  textarea: { width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 13.5, height: 70, fontFamily: "inherit", boxSizing: "border-box" },
};
