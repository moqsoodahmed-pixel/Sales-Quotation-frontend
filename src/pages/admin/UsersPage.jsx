import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, createUser, updateUser, resetPassword } from "../../store/slices/userSlice";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const ROLE_COLORS = { superadmin: "#1D4ED8", admin: "#0369A1", sales: "#0F766E" };

export default function UsersPage() {
  const dispatch = useDispatch();
  const { user: me, isSuperAdmin } = useAuth();
  const { list, loading } = useSelector((s) => s.users);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'resetpw'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales", phone: "" });
  const [pwForm, setPwForm] = useState({ newPassword: "", confirm: "" });
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  const filtered = list.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm({ name: "", email: "", password: "", role: "sales", phone: "" }); setModal("create"); };
  const openEdit = (u) => { setSelected(u); setForm({ name: u.name, phone: u.phone || "", role: u.role, isActive: u.isActive }); setModal("edit"); };
  const openReset = (u) => { setSelected(u); setPwForm({ newPassword: "", confirm: "" }); setModal("resetpw"); };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("Name, email & password are required.");
    const res = await dispatch(createUser(form));
    if (!res.error) { toast.success("User created!"); setModal(null); }
    else toast.error(res.payload);
  };

  const handleEdit = async () => {
    const res = await dispatch(updateUser({ id: selected._id, data: form }));
    if (!res.error) { toast.success("User updated!"); setModal(null); }
    else toast.error(res.payload);
  };

  const handleReset = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Passwords don't match.");
    if (pwForm.newPassword.length < 6) return toast.error("Min 6 characters.");
    const res = await dispatch(resetPassword({ id: selected._id, newPassword: pwForm.newPassword }));
    if (!res.error) { toast.success("Password reset!"); setModal(null); }
    else toast.error(res.payload);
  };

  const availableRoles = isSuperAdmin
    ? ["superadmin", "admin", "sales"]
    : ["admin", "sales"];

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Team & Users</h1>
          <p style={styles.sub}>Manage sales team accounts and access levels.</p>
        </div>
        <button style={styles.newBtn} onClick={openCreate}>+ Add User</button>
      </div>

      {/* Role legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { role: "superadmin", desc: "Full system access. Can create admins." },
          { role: "admin", desc: "Manage users, view all quotations." },
          { role: "sales", desc: "Create quotations. Sees only own records." },
        ].filter(r => isSuperAdmin || r.role !== "superadmin").map(r => (
          <div key={r.role} style={{ ...styles.legend, borderLeft: `4px solid ${ROLE_COLORS[r.role]}` }}>
            <span style={{ ...styles.roleBadge, background: ROLE_COLORS[r.role] + "22", color: ROLE_COLORS[r.role] }}>{r.role}</span>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{r.desc}</span>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <input style={styles.search} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: 13, color: "#6B7280" }}>{filtered.length} users</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead><tr>{["User", "Email", "Phone", "Role", "Status", "Created", "Actions"].map(h =>
              <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ ...styles.avatar, background: ROLE_COLORS[u.role] }}>{u.name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name}</div>
                        {u._id === me?._id && <div style={{ fontSize: 11, color: "#1F3C88" }}>You</div>}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>{u.phone || "–"}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, background: ROLE_COLORS[u.role] + "22", color: ROLE_COLORS[u.role] }}>{u.role}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, ...(u.isActive ? styles.active : styles.inactive) }}>{u.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={styles.btn} onClick={() => openEdit(u)}>Edit</button>
                      <button style={styles.btn} onClick={() => openReset(u)}>Reset PW</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHdr}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                {modal === "create" ? "Add New User" : modal === "edit" ? "Edit User" : "Reset Password"}
              </h2>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {modal === "resetpw" ? (
                <>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Reset password for <strong>{selected?.name}</strong></p>
                  {[["New Password", "newPassword", "password"], ["Confirm Password", "confirm", "password"]].map(([label, key, type]) => (
                    <div key={key} style={styles.formGroup}>
                      <label style={styles.formLabel}>{label}</label>
                      <input style={styles.formInput} type={type} value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} />
                    </div>
                  ))}
                  <button style={styles.submitBtn} onClick={handleReset}>Reset Password</button>
                </>
              ) : (
                <>
                  {[
                    ["Full Name *", "name", "text"],
                    ...(modal === "create" ? [["Email *", "email", "email"], ["Password *", "password", "password"]] : []),
                    ["Phone", "phone", "tel"],
                  ].map(([label, key, type]) => (
                    <div key={key} style={styles.formGroup}>
                      <label style={styles.formLabel}>{label}</label>
                      <input style={styles.formInput} type={type} value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Role</label>
                    <select style={styles.formInput} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      {availableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  {modal === "edit" && (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Status</label>
                      <select style={styles.formInput} value={form.isActive ? "true" : "false"} onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  )}
                  <button style={styles.submitBtn} onClick={modal === "create" ? handleCreate : handleEdit}>
                    {modal === "create" ? "Create User" : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 }, sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  newBtn: { padding: "10px 20px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  legend: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 },
  roleBadge: { padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 600 },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" },
  cardHdr: { padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12 },
  search: { flex: 1, padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13.5, maxWidth: 300 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", whiteSpace: "nowrap" },
  td: { padding: "11px 14px", fontSize: 13.5, borderBottom: "1px solid #E5E7EB" }, tr: {},
  avatar: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 },
  statusBadge: { padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500 },
  active: { background: "#D1FAE5", color: "#065F46" }, inactive: { background: "#FEE2E2", color: "#991B1B" },
  btn: { padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 12 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 10, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.3)" },
  modalHdr: { padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6B7280" },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 14 }, formLabel: { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 5 },
  formInput: { width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13.5, fontFamily: "inherit", boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: 11, background: "#1F3C88", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 14, marginTop: 6 },
};
