import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchServices, fetchCategories, fetchStandards,
  createService, updateService, updateServiceStatus,
} from "../../store/slices/catalogueSlice";
import { useAuth } from "../../hooks/useAuth";
import { PRICING_TYPES, PRICING_TYPE_LABELS, formatPrice } from "../../constants/catalogue";
import DocumentsPanel from "../../components/documents/DocumentsPanel";

const emptyForm = {
  name: "", serviceCode: "", category: "", standard: "", shortDescription: "",
  description: "", pricingType: "FIXED", defaultPrice: "", currency: "INR",
  taxApplicable: true, gstPercent: 18, displayOrder: 0,
};

export default function CataloguePage() {
  const dispatch = useDispatch();
  const { isAdmin } = useAuth();
  const { services, pagination, categories, standards, loading } = useSelector((s) => s.catalogue);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [standard, setStandard] = useState("");
  const [pricingType, setPricingType] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState(null);

  useEffect(() => { dispatch(fetchCategories()); dispatch(fetchStandards()); }, [dispatch]);
  useEffect(() => {
    dispatch(fetchServices({ search, category, standard, pricingType, page, limit: 20 }));
  }, [dispatch, search, category, standard, pricingType, page]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (svc) => {
    setEditing(svc);
    setForm({
      name: svc.name, serviceCode: svc.serviceCode || "", category: svc.category?._id || "",
      standard: svc.standard?._id || "", shortDescription: svc.shortDescription || "",
      description: svc.description || "", pricingType: svc.pricingType || "FIXED",
      defaultPrice: svc.defaultPrice ?? "", currency: svc.currency || "INR",
      taxApplicable: svc.taxApplicable !== false, gstPercent: svc.gstPercent ?? 18,
      displayOrder: svc.displayOrder || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Service name is required.");
    if (!editing && !form.category) return toast.error("Category is required.");
    if (form.pricingType !== "CUSTOM_QUOTE" && form.defaultPrice === "") return toast.error("Base price is required unless pricing type is Custom Quote.");

    const payload = {
      ...form,
      category: form.category || undefined,
      standard: form.standard || undefined,
      defaultPrice: form.pricingType === "CUSTOM_QUOTE" ? null : Number(form.defaultPrice),
    };

    setSaving(true);
    const action = editing
      ? await dispatch(updateService({ id: editing._id, data: payload }))
      : await dispatch(createService(payload));
    setSaving(false);

    if (!action.error) {
      toast.success(editing ? "Service updated!" : "Service created!");
      setShowForm(false);
    } else toast.error(action.payload);
  };

  const handleToggleStatus = async (svc) => {
    const action = await dispatch(updateServiceStatus({ id: svc._id, isActive: !svc.isActive }));
    if (!action.error) toast.success(svc.isActive ? "Service deactivated." : "Service activated.");
    else toast.error(action.payload);
  };

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Service Catalogue</h1>
          <p style={styles.sub}>{isAdmin ? "Manage the ISO & commercial service catalogue" : "Browse services for your quotations"}</p>
        </div>
        {isAdmin && <button style={styles.newBtn} onClick={openCreate}>+ Add Service</button>}
      </div>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search name, code, description…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div style={styles.filterRow}>
          <select style={styles.select} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select style={styles.select} value={standard} onChange={(e) => { setStandard(e.target.value); setPage(1); }}>
            <option value="">All ISO standards</option>
            {standards.map((s) => <option key={s._id} value={s._id}>{s.standardName}:{s.edition}</option>)}
          </select>
          <select style={styles.select} value={pricingType} onChange={(e) => { setPricingType(e.target.value); setPage(1); }}>
            <option value="">All pricing types</option>
            {PRICING_TYPES.map((p) => <option key={p} value={p}>{PRICING_TYPE_LABELS[p]}</option>)}
          </select>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>{["Code", "Service", "Standard", "Category", "Pricing", "Evidence", ...(isAdmin ? ["Status", "Actions"] : [])].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc._id} style={!svc.isActive ? { opacity: 0.55 } : undefined}>
                  <td style={styles.td}><code style={{ fontSize: 12 }}>{svc.serviceCode || "–"}</code></td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{svc.name}</div>
                    {svc.shortDescription && <div style={{ fontSize: 12, color: "#6B7280", maxWidth: 360 }}>{svc.shortDescription}</div>}
                  </td>
                  <td style={styles.td}>{svc.standard ? `${svc.standard.standardName}:${svc.standard.edition}` : "–"}</td>
                  <td style={styles.td}>{svc.category?.name || "–"}</td>
                  <td style={styles.td}>{formatPrice(svc)}</td>
                  <td style={styles.td}><button style={styles.btn} onClick={() => setEvidenceFor(svc)}>View</button></td>
                  {isAdmin && (
                    <>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: svc.isActive ? "#16653422" : "#6B728022", color: svc.isActive ? "#166534" : "#6B7280" }}>
                          {svc.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button style={styles.btn} onClick={() => openEdit(svc)}>Edit</button>
                          <button style={styles.btn} onClick={() => handleToggleStatus(svc)}>{svc.isActive ? "Deactivate" : "Activate"}</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !services.length && <div style={styles.empty}>No services found.</div>}
          {loading && <div style={styles.empty}>Loading…</div>}
        </div>
        {pagination?.pages > 1 && (
          <div style={styles.pager}>
            <button style={styles.btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ fontSize: 13 }}>Page {pagination.page} of {pagination.pages} ({pagination.total} services)</span>
            <button style={styles.btn} disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2 style={styles.modalTitle}>{editing ? `Edit ${editing.serviceCode || editing.name}` : "Add Service"}</h2>
            <div style={styles.formGrid}>
              <label style={styles.label}>Service Name *<input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label style={styles.label}>Service Code<input style={styles.input} value={form.serviceCode} onChange={(e) => setForm({ ...form, serviceCode: e.target.value })} placeholder="e.g. ISO9001-GAP" /></label>
              <label style={styles.label}>Category {!editing && "*"}
                <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </label>
              <label style={styles.label}>ISO Standard
                <select style={styles.input} value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })}>
                  <option value="">None</option>
                  {standards.map((s) => <option key={s._id} value={s._id}>{s.standardName}:{s.edition}</option>)}
                </select>
              </label>
              <label style={styles.label}>Pricing Type
                <select style={styles.input} value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value })}>
                  {PRICING_TYPES.map((p) => <option key={p} value={p}>{PRICING_TYPE_LABELS[p]}</option>)}
                </select>
              </label>
              {form.pricingType !== "CUSTOM_QUOTE" && (
                <label style={styles.label}>Base Price (INR) *<input style={styles.input} type="number" min="0" value={form.defaultPrice} onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })} /></label>
              )}
              <label style={styles.label}>Tax Rate (%)<input style={styles.input} type="number" min="0" max="28" value={form.gstPercent} onChange={(e) => setForm({ ...form, gstPercent: e.target.value })} /></label>
              <label style={styles.label}>Display Order<input style={styles.input} type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} /></label>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Short Description<input style={styles.input} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} maxLength={240} /></label>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Full Description<textarea style={{ ...styles.input, height: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            </div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btn} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" style={styles.newBtn} disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Service"}</button>
            </div>
          </form>
        </div>
      )}

      {evidenceFor && (
        <div style={styles.overlay} onClick={() => setEvidenceFor(null)}>
          <div style={{ ...styles.modal, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Evidence — {evidenceFor.name}</h2>
            <DocumentsPanel relationKey="service" relationId={evidenceFor._id} allowedTypeGroups={["ISO Evidence"]} title="ISO Evidence" />
            <div style={styles.modalActions}>
              <button style={styles.btn} onClick={() => setEvidenceFor(null)}>Close</button>
            </div>
          </div>
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
  filterRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  select: { padding: "8px 11px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 13, minWidth: 180 },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", whiteSpace: "nowrap" },
  td: { padding: "11px 14px", fontSize: 13.5, borderBottom: "1px solid #E5E7EB" },
  badge: { padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500 },
  btn: { padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 12 },
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
  pager: { display: "flex", alignItems: "center", gap: 12, justifyContent: "center", padding: 14, borderTop: "1px solid #E5E7EB" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 10, padding: 24, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 16px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { padding: "8px 11px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13.5, fontFamily: "inherit" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
};
