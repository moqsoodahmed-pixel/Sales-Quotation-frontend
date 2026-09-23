import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUnreadCount, fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../../store/slices/notificationSlice";
import { NOTIFICATION_TYPE_LABELS, SEVERITY_COLORS, entityLink } from "../../constants/notifications";

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { unreadCount, list } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (open) dispatch(fetchNotifications({ limit: 8 }));
  }, [open, dispatch]);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleClick = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    const link = entityLink(n.entityType, n.entityId);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <div style={styles.wrap} ref={ref}>
      <button style={styles.bellBtn} onClick={() => setOpen((v) => !v)}>
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHdr}>
            <strong style={{ fontSize: 13.5 }}>Notifications</strong>
            <button style={styles.markAllBtn} onClick={() => dispatch(markAllNotificationsRead())}>Mark all read</button>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {!list.length && <div style={styles.empty}>No notifications.</div>}
            {list.map((n) => (
              <div key={n._id} style={{ ...styles.item, background: n.isRead ? "#fff" : "#EFF6FF" }} onClick={() => handleClick(n)}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ ...styles.severityDot, background: SEVERITY_COLORS[n.severity] || "#888" }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: n.isRead ? 400 : 600 }}>{n.title}</span>
                </div>
                {n.message && <div style={styles.msg}>{n.message}</div>}
                <div style={styles.meta}>{NOTIFICATION_TYPE_LABELS[n.type] || n.type} · {new Date(n.createdAt).toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>
          <div style={styles.dropdownFooter} onClick={() => { setOpen(false); navigate("/notifications"); }}>View all notifications</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { position: "relative" },
  bellBtn: { position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 6 },
  badge: { position: "absolute", top: 0, right: 0, background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 5px", minWidth: 16, textAlign: "center" },
  dropdown: { position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.12)", zIndex: 100 },
  dropdownHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #F3F4F6" },
  markAllBtn: { background: "none", border: "none", color: "#1F3C88", cursor: "pointer", fontSize: 12 },
  item: { padding: "10px 14px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" },
  severityDot: { width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  msg: { fontSize: 12, color: "#6B7280", marginTop: 2, marginLeft: 15 },
  meta: { fontSize: 10.5, color: "#9CA3AF", marginTop: 4, marginLeft: 15 },
  empty: { padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 },
  dropdownFooter: { padding: "10px 14px", textAlign: "center", fontSize: 12.5, color: "#1F3C88", cursor: "pointer", borderTop: "1px solid #F3F4F6" },
};
