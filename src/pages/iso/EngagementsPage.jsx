import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchEngagements, createEngagement } from "../../store/slices/isoEngagementSlice";
import { fetchCustomers } from "../../store/slices/customerSlice";
import { fetchStandards } from "../../store/slices/catalogueSlice";
import { useAuth } from "../../hooks/useAuth";
import { ENGAGEMENT_STATUSES, STATUS_COLORS, label, CERTIFICATION_DISCLAIMER } from "../../constants/isoCompliance";

const emptyForm = { customerId: "", isoStandardId: "", title: "", scope: "" };

export default function EngagementsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { list, pagination, loading } = useSelector((s) => s.isoEngagements);
  const { list: customers } = useSelector((s) => s.customers);
  const { standards } = useSelector((s) => s.catalogue);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchCustomers({ limit: 100 })); dispatch(fetchStandards()); }, [dispatch]);
  useEffect(() => { dispatch(fetchEngagements({ search, status, page, limit: 20 })); }, [dispatch, search, status, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required.");
    if (!form.customerId) return toast.error("Select a customer.");
    if (!form.isoStandardId) return toast.error("Select an ISO standard.");
    setSaving(true);
    const res = await dispatch(createEngagement(form));
    setSaving(false);
    if (!res.error) { toast.success("Engagement created!"); setShowForm(false); setForm(emptyForm); navigate(`/iso-engagements/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>ISO Compliance Engagements</h1>
          <p style={styles.sub}>{isAdmin ? "All engagements" : "Your assigned engagements"}</p>
        </div>
        <button style={styles.newBtn} onClick={() => setShowForm(true)}>+ New Engagement</button>
      </div>
      <p style={styles.disclaimer}>{CERTIFICATION_DISCLAIMER}</p>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search title, engagement #…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div style={styles.chips}>
          {["", ...ENGAGEMENT_STATUSES].map((s) => (
            <button key={s || "all"} style={{ ...styles.chip, ...(status === s ? styles.chipActive : {}) }} onClick={() => { setStatus(s); setPage(1); }}>{s ? label(s) : "All"}</button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead><tr>{["Engagement #", "Title", "Customer", "Standard", "Status", "Target Date", "Actions"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e._id}>
                  <td style={styles.td}><strong style={{ color: "#1F3C88", cursor: "pointer" }} onClick={() => navigate(`/iso-engagements/${e._id}`)}>{e.engagementNumber}</strong></td>
                  <td style={styles.td}>{e.title}</td>
                  <td style={styles.td}>{e.customer ? `${e.customer.customerNumber} — ${e.customer.companyName}` : "–"}</td>
                  <td style={styles.td}>{e.isoStandard ? `${e.isoStandard.standardName}:${e.isoStandard.edition}` : "–"}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: (STATUS_COLORS[e.status] || "#888") + "22", color: STATUS_COLORS[e.status] || "#888" }}>{label(e.status)}</span></td>
                  <td style={styles.td}>{e.targetCertificationDate ? new Date(e.targetCertificationDate).toLocaleDateString("en-IN") : "–"}</td>
                  <td style={styles.td}><button style={styles.btn} onClick={() => navigate(`/iso-engagements/${e._id}`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !list.length && <div style={styles.empty}>No engagements found.</div>}
          {loading && <div style={styles.empty}>Loading…</div>}
        </div>
        {pagination?.pages > 1 && (
          <div style={styles.pager}>
            <button style={styles.btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ fontSize: 13 }}>Page {pagination.page} of {pagination.pages}</span>
            <button style={styles.btn} disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2 style={styles.modalTitle}>New ISO Engagement</h2>
            <div style={styles.formGrid}>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Title *<input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label style={styles.label}>Customer *
                <select style={styles.input} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.customerNumber} — {c.companyName}</option>)}
                </select>
              </label>
              <label style={styles.label}>ISO Standard *
                <select style={styles.input} value={form.isoStandardId} onChange={(e) => setForm({ ...form, isoStandardId: e.target.value })}>
                  <option value="">Select standard</option>
                  {standards.map((s) => <option key={s._id} value={s._id}>{s.standardName}:{s.edition}</option>)}
                </select>
              </label>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Scope<textarea style={{ ...styles.input, height: 60 }} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} /></label>
            </div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btn} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" style={styles.newBtn} disabled={saving}>{saving ? "Saving…" : "Create Engagement"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  disclaimer: { fontSize: 11.5, color: "#9CA3AF", marginBottom: 20, maxWidth: 700 },
  newBtn: { padding: "10px 20px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  filters: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 20px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  search: { padding: "9px 13px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 14, maxWidth: 360 },
  chips: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { padding: "5px 14px", borderRadius: 99, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 12.5 },
  chipActive: { background: "#1F3C88", color: "#fff", borderColor: "#1F3C88" },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", whiteSpace: "nowrap" },
  td: { padding: "11px 14px", fontSize: 13.5, borderBottom: "1px solid #E5E7EB" },
  badge: { padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500 },
  btn: { padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 12 },
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
  pager: { display: "flex", alignItems: "center", gap: 12, justifyContent: "center", padding: 14, borderTop: "1px solid #E5E7EB" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 10, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 16px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { padding: "8px 11px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13.5, fontFamily: "inherit" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
};
