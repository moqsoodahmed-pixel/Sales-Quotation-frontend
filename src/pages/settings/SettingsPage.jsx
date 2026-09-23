import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchSettings, updateSettings } from "../../store/slices/settingsSlice";

const FIELDS = [
  { key: "company", label: "Company Name" },
  { key: "cin", label: "CIN" },
  { key: "gstin", label: "GSTIN" },
  { key: "regAdd", label: "Registered Address" },
  { key: "corpAdd", label: "Corporate Address" },
  { key: "phone1", label: "Phone (Primary)" },
  { key: "phone2", label: "Phone (Secondary)" },
  { key: "email1", label: "Email (Primary)" },
  { key: "email2", label: "Email (Secondary)" },
  { key: "website1", label: "Website (Primary)" },
  { key: "website2", label: "Website (Secondary)" },
  { key: "quotPrefix", label: "Quotation Number Prefix" },
  { key: "defaultGST", label: "Default GST (%)", type: "number" },
  { key: "defaultValidity", label: "Default Validity (days)", type: "number" },
];

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { data, loading, saving } = useSelector((s) => s.settings);
  const [form, setForm] = useState(null);
  const [terms, setTerms] = useState([]);

  useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

  useEffect(() => {
    if (data) {
      setForm(data);
      setTerms(data.defaultTerms?.length ? data.defaultTerms : [""]);
    }
  }, [data]);

  if (loading || !form) {
    return <div style={{ color: "#6B7280", padding: 40 }}>Loading settings…</div>;
  }

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleTermChange = (i, value) => {
    setTerms((t) => t.map((term, idx) => (idx === i ? value : term)));
  };
  const addTerm = () => setTerms((t) => [...t, ""]);
  const removeTerm = (i) => setTerms((t) => t.filter((_, idx) => idx !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.company?.trim()) return toast.error("Company name is required.");

    const payload = {
      ...form,
      defaultGST: Number(form.defaultGST),
      defaultValidity: Number(form.defaultValidity),
      defaultTerms: terms.map((t) => t.trim()).filter(Boolean),
    };
    const action = await dispatch(updateSettings(payload));
    if (updateSettings.fulfilled.match(action)) {
      toast.success("Settings updated!");
    } else {
      toast.error(action.payload || "Failed to update settings");
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Company Settings</h1>
      <p style={{ color: "#6B7280", fontSize: 13.5, marginBottom: 24 }}>
        These details appear on generated quotations and PDFs.
      </p>

      <form onSubmit={handleSave} style={styles.card}>
        <div style={styles.grid}>
          {FIELDS.map(({ key, label, type }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input
                type={type || "text"}
                value={form[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                style={styles.input}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={styles.label}>Default Quotation Terms</label>
          {terms.map((term, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={term}
                onChange={(e) => handleTermChange(i, e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              />
              <button type="button" onClick={() => removeTerm(i)} style={styles.removeBtn}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addTerm} style={styles.addBtn}>+ Add term</button>
        </div>

        <button type="submit" disabled={saving} style={styles.saveBtn}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 4 },
  input: { padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13.5 },
  addBtn: { background: "none", border: "1px dashed #9CA3AF", color: "#374151", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  removeBtn: { background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 6, width: 32, cursor: "pointer" },
  saveBtn: { marginTop: 24, background: "#1F3C88", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
