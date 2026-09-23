import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import NotificationBell from "../notifications/NotificationBell";
import toast from "react-hot-toast";

const ALL = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES];
const ADMIN_ONLY = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const NAV = [
  { path: "/dashboard", label: "Dashboard", icon: "⬛", roles: ALL },
  { section: "CRM" },
  { path: "/crm/leads", label: "Leads", icon: "🧲", roles: ALL },
  { path: "/crm/customers", label: "Customers", icon: "🏢", roles: ALL },
  { path: "/crm/enquiries", label: "Enquiries", icon: "❓", roles: ALL },
  { path: "/admin/catalogue", label: "Service Catalogue", icon: "📋", roles: ALL },
  { path: "/iso-engagements", label: "ISO Compliance", icon: "✅", roles: ALL },
  { section: "Quotations" },
  { path: "/quotations", label: "Quotations", icon: "📄", roles: ALL },
  { path: "/quotations/new", label: "New Quotation", icon: "➕", roles: ALL },
  { section: "Management" },
  { path: "/admin/users", label: "Team & Users", icon: "👥", roles: ADMIN_ONLY },
  { path: "/admin/sales-report", label: "Sales Report", icon: "📊", roles: ADMIN_ONLY },
  { path: "/settings", label: "Settings", icon: "⚙️", roles: ADMIN_ONLY },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const visibleNav = NAV.filter((n) => !n.path || n.roles.includes(user?.role));

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 240 }}>
        <div style={styles.logoArea}>
          {!collapsed && (
            <>
              <div style={styles.logoText}>LauncherDesk<sup style={{ fontSize: 9, fontWeight: 400 }}>™</sup></div>
              <div style={styles.logoSub}>Quotation System</div>
            </>
          )}
          <button style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "→" : "←"}</button>
        </div>

        <nav style={styles.nav}>
          {visibleNav.map((item, i) =>
            item.section ? (
              !collapsed && <div key={i} style={styles.navSection}>{item.section}</div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === item.path || location.pathname.startsWith(item.path + "/")
                    ? styles.navLinkActive : {}),
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          )}
        </nav>

        <div style={styles.userArea}>
          <div style={styles.avatar}>{(user?.name || "U")[0].toUpperCase()}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>{user?.role}</div>
            </div>
          )}
          {!collapsed && (
            <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">⏻</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <NotificationBell />
        </div>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  app: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  sidebar: { background: "#0D1B4B", color: "#fff", display: "flex", flexDirection: "column", transition: "width .25s", flexShrink: 0, position: "sticky", top: 0, height: "100vh" },
  logoArea: { padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 8, minHeight: 70 },
  logoText: { fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: -0.5, flex: 1 },
  logoSub: { fontSize: 10, color: "rgba(255,255,255,.45)", marginTop: 2 },
  collapseBtn: { background: "rgba(255,255,255,.1)", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", borderRadius: 4, fontSize: 12 },
  nav: { flex: 1, padding: "10px 0", overflowY: "auto" },
  navSection: { fontSize: 10, color: "rgba(255,255,255,.35)", padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: ".8px" },
  navLink: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "rgba(255,255,255,.7)", textDecoration: "none", fontSize: 13.5, borderLeft: "3px solid transparent", transition: ".15s", whiteSpace: "nowrap", overflow: "hidden" },
  navLinkActive: { color: "#fff", background: "rgba(255,255,255,.12)", borderLeftColor: "#60A5FA" },
  userArea: { padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#1F3C88", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 13, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userRole: { fontSize: 11, color: "rgba(255,255,255,.5)", textTransform: "capitalize" },
  logoutBtn: { background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 16, padding: 4, flexShrink: 0 },
  main: { flex: 1, background: "#F9FAFB", overflow: "auto" },
  topBar: { display: "flex", justifyContent: "flex-end", padding: "10px 24px", borderBottom: "1px solid #E5E7EB", background: "#fff" },
  content: { padding: 24, maxWidth: 1400, margin: "0 auto" },
};
