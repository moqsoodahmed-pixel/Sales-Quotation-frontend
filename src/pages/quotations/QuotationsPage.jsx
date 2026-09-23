import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchQuotations, deleteQuotation, duplicateQuotation } from "../../store/slices/quotationSlice";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { STATUS, ALL_STATUSES, STATUS_LABELS, STATUS_COLORS } from "../../constants/quotationStatus";

const fmt = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function QuotationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { list, loading, pagination } = useSelector((s) => s.quotations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchQuotations({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quotation?")) return;
    const res = await dispatch(deleteQuotation(id));
    if (!res.error) toast.success("Deleted!");
    else toast.error(res.payload);
  };

  const handleDuplicate = async (id) => {
    const res = await dispatch(duplicateQuotation(id));
    if (!res.error) { toast.success("Duplicated!"); navigate(`/quotations/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  const STATUSES = ["", ...ALL_STATUSES];

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Quotations</h1>
          <p style={styles.sub}>{isAdmin ? "All team quotations" : "Your quotations"}</p>
        </div>
        <button style={styles.newBtn} onClick={() => navigate("/quotations/new")}>+ New Quotation</button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search client, quotation #…" value={search} onChange={e => setSearch(e.target.value)} />
        <div style={styles.chips}>
          {STATUSES.map(s => (
            <button key={s || "all"} style={{ ...styles.chip, ...(statusFilter === s ? styles.chipActive : {}) }} onClick={() => setStatusFilter(s)}>
              {s ? STATUS_LABELS[s] : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>{["Quot. No", "Client", "Customer", "Date", "Amount", "Status", ...(isAdmin ? ["By"] : []), "Actions"].map(h =>
                <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map(q => (
                <tr key={q._id} style={styles.tr}>
                  <td style={styles.td}><strong style={{ color: "#1F3C88", cursor: "pointer" }} onClick={() => navigate(`/quotations/${q._id}`)}>{q.quotNo}</strong></td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{q.clientName}</div>
                    {q.clientEmail && <div style={{ fontSize: 12, color: "#6B7280" }}>{q.clientEmail}</div>}
                  </td>
                  <td style={styles.td}>{q.customer ? `${q.customer.customerNumber} — ${q.customer.companyName}` : "–"}</td>
                  <td style={styles.td}>{new Date(q.date).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}><strong>{fmt(q.total)}</strong></td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: (STATUS_COLORS[q.status] || "#888") + "22", color: STATUS_COLORS[q.status] || "#888" }}>{STATUS_LABELS[q.status] || q.status}</span>
                  </td>
                  {isAdmin && <td style={styles.td}>{q.createdBy?.name || "–"}</td>}
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button style={styles.btn} onClick={() => navigate(`/quotations/${q._id}`)}>View</button>
                      {q.status === STATUS.DRAFT && <button style={styles.btn} onClick={() => navigate(`/quotations/${q._id}/edit`)}>Edit</button>}
                      <button style={styles.btn} onClick={() => handleDuplicate(q._id)}>Copy</button>
                      <button style={{ ...styles.btn, color: "#DC2626" }} onClick={() => handleDelete(q._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !list.length && <div style={styles.empty}>No quotations found. Create your first one!</div>}
          {loading && <div style={styles.empty}>Loading…</div>}
        </div>
      </div>
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
  tr: {},
  badge: { padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500 },
  btn: { padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 12 },
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
};