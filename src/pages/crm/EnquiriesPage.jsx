import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchEnquiries, archiveEnquiry } from "../../store/slices/enquirySlice";
import { useAuth } from "../../hooks/useAuth";
import { ENQUIRY_STATUSES, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from "../../constants/crm";

export default function EnquiriesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { list, loading, pagination } = useSelector((s) => s.enquiries);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchEnquiries({ search, status, priority, page, limit: 20 }));
  }, [dispatch, search, status, priority, page]);

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this enquiry?")) return;
    const res = await dispatch(archiveEnquiry(id));
    if (!res.error) toast.success("Enquiry archived."); else toast.error(res.payload);
  };

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Enquiries</h1>
          <p style={styles.sub}>{isAdmin ? "All enquiries" : "Your assigned enquiries"}</p>
        </div>
      </div>
      <p style={styles.hint}>New enquiries are created from a Lead or Customer's detail page.</p>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search enquiry #, subject…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div style={styles.chips}>
          {["", ...ENQUIRY_STATUSES].map((s) => (
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
              <tr>{["Enquiry #", "Subject", "Lead/Customer", "Status", "Priority", "Assigned", "Actions"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e._id}>
                  <td style={styles.td}><strong style={{ color: "#1F3C88", cursor: "pointer" }} onClick={() => navigate(`/crm/enquiries/${e._id}`)}>{e.enquiryNumber}</strong></td>
                  <td style={styles.td}>{e.subject}</td>
                  <td style={styles.td}>{e.customer ? e.customer.companyName : (e.lead ? e.lead.name : "–")}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: (STATUS_COLORS[e.status] || "#888") + "22", color: STATUS_COLORS[e.status] || "#888" }}>{e.status}</span></td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: (PRIORITY_COLORS[e.priority] || "#888") + "22", color: PRIORITY_COLORS[e.priority] || "#888" }}>{e.priority}</span></td>
                  <td style={styles.td}>{e.assignedTo?.name || "–"}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button style={styles.btn} onClick={() => navigate(`/crm/enquiries/${e._id}`)}>View</button>
                      <button style={styles.btn} onClick={() => navigate(`/quotations/new?enquiryId=${e._id}`)}>Create Quotation</button>
                      <button style={{ ...styles.btn, color: "#DC2626" }} onClick={() => handleArchive(e._id)}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !list.length && <div style={styles.empty}>No enquiries found.</div>}
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
    </div>
  );
}

const styles = {
  hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  hint: { fontSize: 12.5, color: "#9CA3AF", marginBottom: 20 },
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
};
