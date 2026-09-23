import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchCustomers, createCustomer, archiveCustomer } from "../../store/slices/customerSlice";
import { useAuth } from "../../hooks/useAuth";
import { CUSTOMER_STATUSES, STATUS_COLORS } from "../../constants/crm";

const emptyForm = { companyName: "", contactPerson: "", email: "", phone: "", industry: "", status: "PROSPECT" };

export default function CustomersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { list, loading, pagination } = useSelector((s) => s.customers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers({ search, status, page, limit: 20 }));
  }, [dispatch, search, status, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) return toast.error("Company name is required.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Invalid email format.");
    setSaving(true);
    const res = await dispatch(createCustomer(form));
    setSaving(false);
    if (!res.error) { toast.success("Customer created!"); setShowForm(false); setForm(emptyForm); }
    else toast.error(res.payload);
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this customer?")) return;
    const res = await dispatch(archiveCustomer(id));
    if (!res.error) toast.success("Customer archived."); else toast.error(res.payload);
  };

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Customers</h1>
          <p style={styles.sub}>{isAdmin ? "All customers" : "Your assigned customers"}</p>
        </div>
        <button style={styles.newBtn} onClick={() => setShowForm(true)}>+ Add Customer</button>
      </div>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search company, contact, email, phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div style={styles.chips}>
          {["", ...CUSTOMER_STATUSES].map((s) => (
            <button key={s || "all"} style={{ ...styles.chip, ...(status === s ? styles.chipActive : {}) }} onClick={() => { setStatus(s); setPage(1); }}>{s || "All statuses"}</button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>{["Customer #", "Company", "Contact", "Status", "Assigned", "Created", "Actions"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td style={styles.td}><strong style={{ color: "#1F3C88", cursor: "pointer" }} onClick={() => navigate(`/crm/customers/${c._id}`)}>{c.customerNumber}</strong></td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{c.companyName}</div>
                    {c.email && <div style={{ fontSize: 12, color: "#6B7280" }}>{c.email}</div>}
                  </td>
                  <td style={styles.td}>{c.contactPerson || "–"}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: (STATUS_COLORS[c.status] || "#888") + "22", color: STATUS_COLORS[c.status] || "#888" }}>{c.status}</span></td>
                  <td style={styles.td}>{c.assignedTo?.name || "–"}</td>
                  <td style={styles.td}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button style={styles.btn} onClick={() => navigate(`/crm/customers/${c._id}`)}>View</button>
                      <button style={{ ...styles.btn, color: "#DC2626" }} onClick={() => handleArchive(c._id)}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !list.length && <div style={styles.empty}>No customers found. Add your first customer, or convert a lead!</div>}
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
            <h2 style={styles.modalTitle}>Add Customer</h2>
            <div style={styles.formGrid}>
              <label style={styles.label}>Company Name *<input style={styles.input} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
              <label style={styles.label}>Contact Person<input style={styles.input} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></label>
              <label style={styles.label}>Email<input style={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label style={styles.label}>Phone<input style={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label style={styles.label}>Industry<input style={styles.input} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></label>
              <label style={styles.label}>Status
                <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btn} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" style={styles.newBtn} disabled={saving}>{saving ? "Saving…" : "Create Customer"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
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
