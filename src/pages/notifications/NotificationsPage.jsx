import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchPreferences, updatePreference,
} from "../../store/slices/notificationSlice";
import { ALL_NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, SEVERITY_COLORS, entityLink } from "../../constants/notifications";

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, preferences, loading } = useSelector((s) => s.notifications);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    const params = { page, limit: 20 };
    if (filter === "unread") params.isRead = false;
    if (filter === "read") params.isRead = true;
    dispatch(fetchNotifications(params));
  }, [dispatch, filter, page]);

  useEffect(() => { if (showPrefs) dispatch(fetchPreferences()); }, [showPrefs, dispatch]);

  const handleClick = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    const link = entityLink(n.entityType, n.entityId);
    if (link) navigate(link);
  };

  const handleMarkAll = async () => {
    const res = await dispatch(markAllNotificationsRead());
    if (!res.error) { toast.success("All notifications marked read."); dispatch(fetchNotifications({ page, limit: 20 })); }
  };

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Notifications</h1>
          <p style={styles.sub}>Events relevant to your work</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.btn} onClick={() => setShowPrefs((v) => !v)}>{showPrefs ? "Hide Preferences" : "Preferences"}</button>
          <button style={styles.newBtn} onClick={handleMarkAll}>Mark All Read</button>
        </div>
      </div>

      {showPrefs && (
        <div style={styles.card}>
          <h3 style={styles.h3}>Notification Preferences</h3>
          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Disable in-app notifications you don't want to see. All types are enabled by default.</p>
          {ALL_NOTIFICATION_TYPES.map((type) => {
            const pref = preferences.find((p) => p.notificationType === type);
            const enabled = pref ? pref.inAppEnabled : true;
            return (
              <div key={type} style={styles.prefRow}>
                <span style={{ fontSize: 13 }}>{NOTIFICATION_TYPE_LABELS[type] || type}</span>
                <label style={styles.toggle}>
                  <input type="checkbox" checked={enabled} onChange={(e) => dispatch(updatePreference({ notificationType: type, inAppEnabled: e.target.checked }))} />
                  {enabled ? "On" : "Off"}
                </label>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.chips}>
        {["all", "unread", "read"].map((f) => (
          <button key={f} style={{ ...styles.chip, ...(filter === f ? styles.chipActive : {}) }} onClick={() => { setFilter(f); setPage(1); }}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div style={styles.card}>
        {loading && <div style={styles.empty}>Loading…</div>}
        {!loading && !list.length && <div style={styles.empty}>No notifications.</div>}
        {list.map((n) => (
          <div key={n._id} style={{ ...styles.row, background: n.isRead ? "#fff" : "#EFF6FF" }} onClick={() => handleClick(n)}>
            <span style={{ ...styles.severityDot, background: SEVERITY_COLORS[n.severity] || "#888" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: n.isRead ? 400 : 600 }}>{n.title}</div>
              {n.message && <div style={{ fontSize: 12.5, color: "#6B7280" }}>{n.message}</div>}
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{NOTIFICATION_TYPE_LABELS[n.type] || n.type} · {new Date(n.createdAt).toLocaleString("en-IN")}</div>
            </div>
            {!n.isRead && <span style={styles.unreadDot} />}
          </div>
        ))}
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
  hdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  btn: { padding: "8px 14px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  newBtn: { padding: "9px 16px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 },
  chips: { display: "flex", gap: 6, marginBottom: 16 },
  chip: { padding: "6px 14px", borderRadius: 99, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 12.5 },
  chipActive: { background: "#1F3C88", color: "#fff", borderColor: "#1F3C88" },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 8, marginBottom: 16 },
  h3: { fontSize: 14, fontWeight: 700, margin: "8px 12px 4px", color: "#1F3C88" },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderBottom: "1px solid #F3F4F6", cursor: "pointer", borderRadius: 6 },
  severityDot: { width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", background: "#1F3C88", flexShrink: 0, marginTop: 5 },
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
  pager: { display: "flex", alignItems: "center", gap: 12, justifyContent: "center", padding: 14, borderTop: "1px solid #E5E7EB" },
  prefRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #F3F4F6" },
  toggle: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" },
};
