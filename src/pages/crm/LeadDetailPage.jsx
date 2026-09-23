import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchLead, updateLead, convertLead, createEnquiryFromLead, clearCurrent } from "../../store/slices/leadSlice";
import { LEAD_STATUSES, PRIORITIES, STATUS_COLORS } from "../../constants/crm";

export default function LeadDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: lead, loading } = useSelector((s) => s.leads);
  const [note, setNote] = useState("");
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [subject, setSubject] = useState("");

  useEffect(() => {
    dispatch(fetchLead(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  if (loading && !lead) return <div style={styles.empty}>Loading…</div>;
  if (!lead) return <div style={styles.empty}>Lead not found.</div>;

  const handleStatusChange = async (status) => {
    const res = await dispatch(updateLead({ id, data: { status } }));
    if (!res.error) toast.success("Status updated."); else toast.error(res.payload);
  };

  const handleConvert = async () => {
    if (!window.confirm("Convert this lead into a customer?")) return;
    const res = await dispatch(convertLead({ id }));
    if (!res.error) { toast.success(`Converted to ${res.payload.customer.customerNumber}`); navigate(`/crm/customers/${res.payload.customer._id}`); }
    else toast.error(res.payload);
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Subject is required.");
    const res = await dispatch(createEnquiryFromLead({ id, data: { subject, notes: note } }));
    if (!res.error) { toast.success(`Enquiry ${res.payload.enquiryNumber} created.`); navigate(`/crm/enquiries/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  return (
    <div>
      <button style={styles.back} onClick={() => navigate("/crm/leads")}>← Back to Leads</button>

      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>{lead.leadNumber} — {lead.name}</h1>
          <p style={styles.sub}>{lead.companyName || "No company"}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {lead.status !== "CONVERTED" && <button style={styles.newBtn} onClick={handleConvert}>Convert to Customer</button>}
          <button style={styles.btn} onClick={() => setShowEnquiryForm(true)}>+ Create Enquiry</button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.h3}>Details</h3>
          <Row label="Email" value={lead.email} />
          <Row label="Phone" value={lead.phone} />
          <Row label="Website" value={lead.website} />
          <Row label="Industry" value={lead.industry} />
          <Row label="Location" value={lead.location} />
          <Row label="Source" value={lead.source} />
          <Row label="Requirement" value={lead.requirement} />
          <Row label="Notes" value={lead.notes} />
          <Row label="Assigned To" value={lead.assignedTo?.name} />
          <Row label="Created By" value={lead.createdBy?.name} />
          <Row label="Next Follow-up" value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString("en-IN") : "–"} />
          {lead.customerId && <Row label="Converted Customer" value={lead.customerId.customerNumber} />}
        </div>

        <div style={styles.card}>
          <h3 style={styles.h3}>Status</h3>
          <span style={{ ...styles.badge, background: (STATUS_COLORS[lead.status] || "#888") + "22", color: STATUS_COLORS[lead.status] || "#888", marginBottom: 12, display: "inline-block" }}>{lead.status}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {LEAD_STATUSES.filter((s) => s !== lead.status).map((s) => (
              <button key={s} style={styles.btn} onClick={() => handleStatusChange(s)}>Set to {s}</button>
            ))}
          </div>

          <h3 style={{ ...styles.h3, marginTop: 24 }}>Enquiries ({lead.enquiries?.length || 0})</h3>
          {!lead.enquiries?.length && <p style={{ fontSize: 13, color: "#9CA3AF" }}>No enquiries yet.</p>}
          {lead.enquiries?.map((e) => (
            <div key={e._id} style={styles.enqRow} onClick={() => navigate(`/crm/enquiries/${e._id}`)}>
              <strong style={{ color: "#1F3C88" }}>{e.enquiryNumber}</strong> — {e.subject}
            </div>
          ))}
        </div>
      </div>

      {showEnquiryForm && (
        <div style={styles.overlay} onClick={() => setShowEnquiryForm(false)}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateEnquiry}>
            <h2 style={styles.modalTitle}>Create Enquiry from {lead.leadNumber}</h2>
            <label style={styles.label}>Subject *<input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
            <label style={styles.label}>Notes<textarea style={{ ...styles.input, height: 60 }} value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btn} onClick={() => setShowEnquiryForm(false)}>Cancel</button>
              <button type="submit" style={styles.newBtn}>Create Enquiry</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div style={styles.row}>
    <span style={styles.rowLabel}>{label}</span>
    <span style={styles.rowValue}>{value || "–"}</span>
  </div>
);

const styles = {
  back: { background: "none", border: "none", color: "#1F3C88", cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0 },
  hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 20, fontWeight: 700, margin: 0 },
  h3: { fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#1F3C88" },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  newBtn: { padding: "9px 16px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 },
  btn: { padding: "7px 12px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12.5, textAlign: "left" },
  grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 },
  row: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13.5, gap: 12 },
  rowLabel: { color: "#6B7280" },
  rowValue: { fontWeight: 500, textAlign: "right" },
  badge: { padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500 },
  enqRow: { padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13, cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 10, padding: 24, width: "100%", maxWidth: 480 },
  modalTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 16px" },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 14 },
  input: { padding: "8px 11px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13.5, fontFamily: "inherit" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 },
};
