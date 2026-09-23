import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchLeads, createLead, archiveLead, convertLead } from "../../store/slices/leadSlice";
import { useAuth } from "../../hooks/useAuth";
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from "../../constants/crm";

const emptyForm = { name: "", companyName: "", email: "", phone: "", source: "OTHER", priority: "MEDIUM", requirement: "", nextFollowUpAt: "" };

export default function LeadsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { list, loading, pagination } = useSelector((s) => s.leads);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchLeads({ search, status, priority, page, limit: 20 }));
  }, [dispatch, search, status, priority, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Invalid email format.");
    setSaving(true);
    const res = await dispatch(createLead(form));
    setSaving(false);
    if (!res.error) { toast.success("Lead created!"); setShowForm(false); setForm(emptyForm); }
    else toast.error(res.payload);
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this lead?")) return;
    const res = await dispatch(archiveLead(id));
    if (!res.error) toast.success("Lead archived."); else toast.error(res.payload);
  };

  const handleConvert = async (id) => {
    if (!window.confirm("Convert this lead into a customer? The lead record will be preserved.")) return;
    const res = await dispatch(convertLead({ id }));
    if (!res.error) { toast.success(`Converted to customer ${res.payload.customer.customerNumber}`); navigate(`/crm/customers/${res.payload.customer._id}`); }
    else toast.error(res.payload);
  };

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Leads</h1>
          <p style={styles.sub}>{isAdmin ? "All leads" : "Your assigned leads"}</p>
        </div>
        <button style={styles.newBtn} onClick={() => setShowForm(true)}>+ Add Lead</button>
      </div>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search name, company, email, phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div style={styles.chips}>
          {["", ...LEAD_STATUSES].map((s) => (
            <button key={s || "all"} style={{ ...styles.chip, ...(status === s ? styles.chipActive : {}) }} onClick={() => { setStatus(s); setPage(1); }}>{s || "All statuses"}</button>
          ))}
        </div>
        <div style={styles.chips}>
          {["", ...PRIORITIES].map((p) => (
            <button key={p || "allp"} style={{ ...styles.chip, ...(priority === p ? styles.chipActive : {}) }} onClick={() => { setPriority(p); setPage(1); }}>{p || "All priorities"}</button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>{["Lead #", "Name", "Company", "Status", "Priority", "Assigned", "Follow-up", "Actions"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l._id}>
                  <td style={styles.td}><strong style={{ color: "#1F3C88", cursor: "pointer" }} onClick={() => navigate(`/crm/leads/${l._id}`)}>{l.leadNumber}</strong></td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{l.name}</div>
                    {l.email && <div style={{ fontSize: 12, color: "#6B7280" }}>{l.email}</div>}
                  </td>
                  <td style={styles.td}>{l.companyName || "–"}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: (STATUS_COLORS[l.status] || "#888") + "22", color: STATUS_COLORS[l.status] || "#888" }}>{l.status}</span></td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: (PRIORITY_COLORS[l.priority] || "#888") + "22", color: PRIORITY_COLORS[l.priority] || "#888" }}>{l.priority}</span></td>
                  <td style={styles.td}>{l.assignedTo?.name || "–"}</td>
                  <td style={styles.td}>{l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toLocaleDateString("en-IN") : "–"}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button style={styles.btn} onClick={() => navigate(`/crm/leads/${l._id}`)}>View</button>
                      {l.status !== "CONVERTED" && <button style={styles.btn} onClick={() => handleConvert(l._id)}>Convert</button>}
                      <button style={{ ...styles.btn, color: "#DC2626" }} onClick={() => handleArchive(l._id)}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !list.length && <div style={styles.empty}>No leads found. Add your first lead!</div>}
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
            <h2 style={styles.modalTitle}>Add Lead</h2>
            <div style={styles.formGrid}>
              <label style={styles.label}>Name *<input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label style={styles.label}>Company<input style={styles.input} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
              <label style={styles.label}>Email<input style={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label style={styles.label}>Phone<input style={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label style={styles.label}>Source
                <select style={styles.input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={styles.label}>Priority
                <select style={styles.input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label style={styles.label}>Next Follow-up<input style={styles.input} type="date" value={form.nextFollowUpAt} onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })} /></label>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Requirement<textarea style={{ ...styles.input, height: 60 }} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} /></label>
            </div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btn} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" style={styles.newBtn} disabled={saving}>{saving ? "Saving…" : "Create Lead"}</button>
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
