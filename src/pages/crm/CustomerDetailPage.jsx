import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchCustomer, updateCustomer, createEnquiryFromCustomer, clearCurrent } from "../../store/slices/customerSlice";
import { CUSTOMER_STATUSES, STATUS_COLORS } from "../../constants/crm";
import DocumentsPanel from "../../components/documents/DocumentsPanel";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: customer, loading } = useSelector((s) => s.customers);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [subject, setSubject] = useState("");

  useEffect(() => {
    dispatch(fetchCustomer(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  if (loading && !customer) return <div style={styles.empty}>Loading…</div>;
  if (!customer) return <div style={styles.empty}>Customer not found.</div>;

  const handleStatusChange = async (status) => {
    const res = await dispatch(updateCustomer({ id, data: { status } }));
    if (!res.error) toast.success("Status updated."); else toast.error(res.payload);
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Subject is required.");
    const res = await dispatch(createEnquiryFromCustomer({ id, data: { subject } }));
    if (!res.error) { toast.success(`Enquiry ${res.payload.enquiryNumber} created.`); navigate(`/crm/enquiries/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  return (
    <div>
      <button style={styles.back} onClick={() => navigate("/crm/customers")}>← Back to Customers</button>

      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>{customer.customerNumber} — {customer.companyName}</h1>
          <p style={styles.sub}>{customer.contactPerson || "No contact person set"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.btn} onClick={() => navigate(`/quotations/new?customerId=${customer._id}`)}>+ New Quotation</button>
          <button style={styles.newBtn} onClick={() => setShowEnquiryForm(true)}>+ Create Enquiry</button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.h3}>Company Information</h3>
          <Row label="Industry" value={customer.industry} />
          <Row label="Website" value={customer.website} />
          <Row label="GSTIN" value={customer.gstin} />
          <Row label="PAN" value={customer.pan} />
          <Row label="Address" value={[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")} />

          <h3 style={{ ...styles.h3, marginTop: 20 }}>Contact Information</h3>
          <Row label="Contact Person" value={customer.contactPerson} />
          <Row label="Email" value={customer.email} />
          <Row label="Phone" value={customer.phone} />
          <Row label="Alternate Phone" value={customer.alternatePhone} />

          <h3 style={{ ...styles.h3, marginTop: 20 }}>Assignment & Source</h3>
          <Row label="Assigned Salesperson" value={customer.assignedTo?.name} />
          <Row label="Created By" value={customer.createdBy?.name} />
          <Row label="Source Lead" value={customer.sourceLead ? `${customer.sourceLead.leadNumber} (${customer.sourceLead.name})` : "Direct entry"} />

          <h3 style={{ ...styles.h3, marginTop: 20 }}>Quotations</h3>
          {!customer.quotations?.length && <p style={{ fontSize: 13, color: "#9CA3AF" }}>No quotations yet.</p>}
          {customer.quotations?.map((q) => (
            <div key={q._id} style={styles.enqRow} onClick={() => navigate(`/quotations/${q._id}`)}>
              <strong style={{ color: "#1F3C88" }}>{q.quotNo}</strong> — ₹ {Number(q.total).toLocaleString("en-IN")} <span style={{ color: "#6B7280" }}>({q.status})</span>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <h3 style={styles.h3}>Status</h3>
          <span style={{ ...styles.badge, background: (STATUS_COLORS[customer.status] || "#888") + "22", color: STATUS_COLORS[customer.status] || "#888", marginBottom: 12, display: "inline-block" }}>{customer.status}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {CUSTOMER_STATUSES.filter((s) => s !== customer.status).map((s) => (
              <button key={s} style={styles.btn} onClick={() => handleStatusChange(s)}>Set to {s}</button>
            ))}
          </div>

          <h3 style={{ ...styles.h3, marginTop: 24 }}>Enquiries ({customer.enquiries?.length || 0})</h3>
          {!customer.enquiries?.length && <p style={{ fontSize: 13, color: "#9CA3AF" }}>No enquiries yet.</p>}
          {customer.enquiries?.map((e) => (
            <div key={e._id} style={styles.enqRow} onClick={() => navigate(`/crm/enquiries/${e._id}`)}>
              <strong style={{ color: "#1F3C88" }}>{e.enquiryNumber}</strong> — {e.subject}
            </div>
          ))}
        </div>
      </div>

      <DocumentsPanel relationKey="customer" relationId={customer._id} allowedTypeGroups={["Customer"]} title="Customer Documents" />

      {showEnquiryForm && (
        <div style={styles.overlay} onClick={() => setShowEnquiryForm(false)}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateEnquiry}>
            <h2 style={styles.modalTitle}>Create Enquiry for {customer.customerNumber}</h2>
            <label style={styles.label}>Subject *<input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
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
