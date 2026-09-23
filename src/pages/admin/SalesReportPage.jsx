import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserStats } from "../../store/slices/userSlice";

const fmt = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function SalesReportPage() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((s) => s.users);

  useEffect(() => { dispatch(fetchUserStats()); }, [dispatch]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Sales Team Report</h1>
      <p style={{ color: "#6B7280", fontSize: 13.5, marginBottom: 24 }}>See quotation activity per sales person.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {(stats || []).map(({ user, totalQuotations, acceptedQuotations, totalValue }) => (
          <div key={user._id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.avatar}>{user.name[0].toUpperCase()}</div>
              <div>
                <div style={styles.name}>{user.name}</div>
                <div style={styles.email}>{user.email}</div>
                <span style={{ ...styles.badge, background: user.isActive ? "#D1FAE5" : "#FEE2E2", color: user.isActive ? "#065F46" : "#991B1B" }}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div style={styles.stats}>
              {[
                { label: "Quotations", value: totalQuotations, color: "#1F3C88" },
                { label: "Accepted", value: acceptedQuotations, color: "#065F46" },
                { label: "Total Value", value: fmt(totalValue), color: "#1D4ED8" },
              ].map(s => (
                <div key={s.label} style={styles.stat}>
                  <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
            {user.lastLogin && (
              <div style={styles.lastLogin}>
                Last login: {new Date(user.lastLogin).toLocaleString("en-IN")}
              </div>
            )}
          </div>
        ))}
        {!loading && !stats?.length && (
          <div style={{ color: "#9CA3AF", gridColumn: "1/-1", textAlign: "center", padding: 40 }}>No sales users found.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: "50%", background: "#1F3C88", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 15, fontWeight: 600 }, email: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  badge: { fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99 },
  stats: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, borderTop: "1px solid #F3F4F6", paddingTop: 14 },
  stat: { textAlign: "center" }, statVal: { fontSize: 20, fontWeight: 700 }, statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  lastLogin: { fontSize: 11, color: "#9CA3AF", marginTop: 12, textAlign: "center" },
};
