import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchEnquiry, updateEnquiry, clearCurrent } from "../../store/slices/enquirySlice";
import { ENQUIRY_STATUSES, STATUS_COLORS, PRIORITY_COLORS } from "../../constants/crm";
import DocumentsPanel from "../../components/documents/DocumentsPanel";

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: enquiry, loading } = useSelector((s) => s.enquiries);

  useEffect(() => {
    dispatch(fetchEnquiry(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  if (loading && !enquiry) return <div style={styles.empty}>Loading…</div>;
  if (!enquiry) return <div style={styles.empty}>Enquiry not found.</div>;

  const handleStatusChange = async (status) => {
    const res = await dispatch(updateEnquiry({ id, data: { status } }));
    if (!res.error) toast.success("Status updated."); else toast.error(res.payload);
  };

  return (
    <div>
      <button style={styles.back} onClick={() => navigate("/crm/enquiries")}>← Back to Enquiries</button>

      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>{enquiry.enquiryNumber} — {enquiry.subject}</h1>
          <p style={styles.sub}>
            {enquiry.customer ? `Customer: ${enquiry.customer.companyName}` : ""}
            {enquiry.lead ? `${enquiry.customer ? " · " : ""}Lead: ${enquiry.lead.name}` : ""}
          </p>
        </div>
        <button style={styles.newBtn} onClick={() => navigate(`/quotations/new?enquiryId=${enquiry._id}`)}>
          + Create Quotation
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.h3}>Enquiry Details</h3>
          <Row label="Description" value={enquiry.description} />
          <Row label="Service Category" value={enquiry.serviceCategory?.name} />
          <Row label="Requested Services" value={enquiry.requestedServices?.map((s) => s.name).join(", ")} />
          <Row label="Estimated Budget" value={enquiry.estimatedBudget ? `₹ ${Number(enquiry.estimatedBudget).toLocaleString("en-IN")}` : "–"} />
          <Row label="Expected Start" value={enquiry.expectedStartDate ? new Date(enquiry.expectedStartDate).toLocaleDateString("en-IN") : "–"} />
          <Row label="Priority" value={<span style={{ ...styles.badge, background: (PRIORITY_COLORS[enquiry.priority] || "#888") + "22", color: PRIORITY_COLORS[enquiry.priority] || "#888" }}>{enquiry.priority}</span>} />
          <Row label="Assigned To" value={enquiry.assignedTo?.name} />
          <Row label="Created By" value={enquiry.createdBy?.name} />
          <Row label="Next Follow-up" value={enquiry.nextFollowUpAt ? new Date(enquiry.nextFollowUpAt).toLocaleDateString("en-IN") : "–"} />
          <Row label="Notes" value={enquiry.notes} />
          <Row label="Created" value={new Date(enquiry.createdAt).toLocaleString("en-IN")} />
          <Row label="Updated" value={new Date(enquiry.updatedAt).toLocaleString("en-IN")} />
        </div>

        <div style={styles.card}>
          <h3 style={styles.h3}>Status</h3>
          <span style={{ ...styles.badge, background: (STATUS_COLORS[enquiry.status] || "#888") + "22", color: STATUS_COLORS[enquiry.status] || "#888", marginBottom: 12, display: "inline-block" }}>{enquiry.status}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {ENQUIRY_STATUSES.filter((s) => s !== enquiry.status).map((s) => (
              <button key={s} style={styles.btn} onClick={() => handleStatusChange(s)}>Set to {s}</button>
            ))}
          </div>
        </div>
      </div>

      <DocumentsPanel relationKey="enquiry" relationId={enquiry._id} title="Supporting Documents" />
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
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
};
