import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearError } from "../../store/slices/authSlice";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { loading, error, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate("/dashboard"); }, [isAuthenticated, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please enter email and password.");
    dispatch(login(form));
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>LauncherDesk<sup style={{ fontSize: 10, fontWeight: 400 }}>™</sup></div>
          <div style={styles.sub}>Quotation Management System</div>
        </div>

        {/* Role hints */}
        <div style={styles.roles}>
          <span style={styles.roleBadge("#1D4ED8")}>Super Admin</span>
          <span style={styles.roleBadge("#0369A1")}>Admin</span>
          <span style={styles.roleBadge("#0F766E")}>Sales</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>
          <button style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={styles.footer}>DutyLaunch Solutions Private Limited</div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0D1B4B 0%, #1F3C88 60%, #2B5CE6 100%)", padding: 20 },
  card: { background: "#fff", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  header: { textAlign: "center", marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: 900, color: "#1F3C88", letterSpacing: -1 },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  roles: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" },
  roleBadge: (c) => ({ background: c + "22", color: c, padding: "3px 12px", borderRadius: 99, fontSize: 11.5, fontWeight: 600 }),
  form: { display: "flex", flexDirection: "column", gap: 16 },
  group: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { padding: "10px 13px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 14, outline: "none", fontFamily: "inherit" },
  btn: { padding: "11px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 7, fontSize: 14.5, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  footer: { textAlign: "center", marginTop: 28, fontSize: 11, color: "#9CA3AF" },
};
