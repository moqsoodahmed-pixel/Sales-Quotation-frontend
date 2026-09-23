import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createQuotation, updateQuotation } from "../../store/slices/quotationSlice";
import { fetchCustomers } from "../../store/slices/customerSlice";
import { fetchEnquiries, fetchEnquiry } from "../../store/slices/enquirySlice";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import toast from "react-hot-toast";

const fmt = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const DEFAULT_VALID_UNTIL = () => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

export default function NewQuotationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);

  // Step 1: customer & enquiry
  const [manualClient, setManualClient] = useState(false);
  const [client, setClient] = useState({ clientName: "", clientCompany: "", clientEmail: "", clientPhone: "" });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [enquiry, setEnquiry] = useState(null);

  // Step 2: services
  const [catalogue, setCatalogue] = useState([]);
  const [catSearch, setCatSearch] = useState("");
  const [items, setItems] = useState([]);

  // Step 3: discount / validity / terms
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);
  const [validUntil, setValidUntil] = useState(DEFAULT_VALID_UNTIL());
  const [termsText, setTermsText] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { api.get("/services", { params: { limit: 200 } }).then((r) => setCatalogue(r.data.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!customerSearch) { setCustomerResults([]); return; }
    const t = setTimeout(() => {
      dispatch(fetchCustomers({ search: customerSearch, limit: 10 })).then((res) => {
        if (!res.error) setCustomerResults(res.payload.data);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [customerSearch, dispatch]);

  useEffect(() => {
    if (!customer) { setEnquiries([]); return; }
    dispatch(fetchEnquiries({ customer: customer._id, limit: 50 })).then((res) => {
      if (!res.error) setEnquiries(res.payload.data);
    });
  }, [customer, dispatch]);

  // Prefill from ?customerId=... and/or ?enquiryId=... (e.g. "Create Quotation" from a Customer/Enquiry page)
  useEffect(() => {
    if (isEdit) return;
    const prefillEnquiryId = searchParams.get("enquiryId");
    const prefillCustomerId = searchParams.get("customerId");
    if (prefillEnquiryId) {
      dispatch(fetchEnquiry(prefillEnquiryId)).then((res) => {
        if (res.error) return;
        const enq = res.payload;
        setEnquiry(enq);
        const custId = enq.customer?._id || enq.customer;
        if (custId) api.get(`/customers/${custId}`).then((r) => setCustomer(r.data.data)).catch(() => {});
        if (enq.requestedServices?.length) {
          setItems(enq.requestedServices.map((svc) => ({
            serviceId: svc._id, name: svc.name, serviceCode: svc.serviceCode, billingType: "One Time",
            pricingType: svc.pricingType, qty: 1, unitPrice: svc.pricingType === "CUSTOM_QUOTE" ? "" : (svc.defaultPrice || 0), gstPercent: 18,
          })));
        }
      });
    } else if (prefillCustomerId) {
      api.get(`/customers/${prefillCustomerId}`).then((r) => setCustomer(r.data.data)).catch(() => {});
    }
  }, [isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing quotation when editing a draft
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/quotations/${id}`).then((res) => {
      const q = res.data.data;
      if (q.status !== "Draft" && !user?.role?.includes("admin")) {
        toast.error("Only draft quotations can be edited.");
        navigate(`/quotations/${id}`);
        return;
      }
      setClient({ clientName: q.clientName || "", clientCompany: q.clientCompany || "", clientEmail: q.clientEmail || "", clientPhone: q.clientPhone || "" });
      setManualClient(!q.customer);
      if (q.customer) setCustomer(q.customer);
      if (q.enquiry) setEnquiry(q.enquiry);
      setItems((q.items || []).map((i) => ({ ...i, serviceId: i.serviceId || i._id })));
      setDiscountType(q.discountType || "FIXED");
      setDiscountValue(q.discountType === "PERCENTAGE" ? q.discountValue : q.discountAmount || 0);
      setValidUntil(q.validUntil ? q.validUntil.slice(0, 10) : DEFAULT_VALID_UNTIL());
      setTermsText((q.terms || []).join("\n"));
      setNotes(q.internalNotes || "");
      setLoadingExisting(false);
    }).catch(() => { toast.error("Quotation not found."); navigate("/quotations"); });
  }, [isEdit, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectEnquiry = async (enq) => {
    if (!enq) { setEnquiry(null); return; }
    const res = await dispatch(fetchEnquiry(enq._id));
    if (res.error) return;
    const full = res.payload;
    setEnquiry(full);
    if (full.requestedServices?.length) {
      const newItems = full.requestedServices
        .filter((svc) => !items.find((i) => i.serviceId === svc._id))
        .map((svc) => catalogue.find((c) => c._id === svc._id))
        .filter(Boolean)
        .map(toLineItem);
      if (newItems.length) setItems((prev) => [...prev, ...newItems]);
    }
  };

  const toLineItem = (svc) => ({
    serviceId: svc._id,
    name: svc.name,
    serviceCode: svc.serviceCode,
    categoryName: svc.category?.name,
    billingType: svc.billingType,
    pricingType: svc.pricingType,
    qty: 1,
    unitPrice: svc.pricingType === "CUSTOM_QUOTE" ? "" : (svc.defaultPrice || 0),
    gstPercent: svc.gstPercent ?? 18,
  });

  const addItem = (svc) => {
    if (items.find((i) => i.serviceId === svc._id)) return toast.error("Already added — adjust the quantity instead.");
    setItems((prev) => [...prev, toLineItem(svc)]);
  };
  const removeItem = (serviceId) => setItems((prev) => prev.filter((i) => i.serviceId !== serviceId));
  const updateItem = (serviceId, field, val) => setItems((prev) => prev.map((i) => {
    if (i.serviceId !== serviceId) return i;
    if (field === "qty") return { ...i, qty: Math.max(1, parseInt(val) || 1) };
    return { ...i, unitPrice: val === "" ? "" : parseFloat(val) || 0 };
  }));

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.qty * (Number(i.unitPrice) || 0), 0), [items]);
  const discountAmount = useMemo(() => {
    if (discountType === "PERCENTAGE") return Math.min(100, Math.max(0, Number(discountValue) || 0)) / 100 * subtotal;
    return Math.min(subtotal, Math.max(0, Number(discountValue) || 0));
  }, [discountType, discountValue, subtotal]);
  const taxable = Math.max(0, subtotal - discountAmount);
  // Blended preview only - the backend computes tax per-line using each
  // service's own rate; this is just an at-a-glance estimate while editing.
  const blendedRate = items.length ? items.reduce((s, i) => s + (i.gstPercent ?? 18), 0) / items.length : 18;
  const gst = Math.round(taxable * (blendedRate / 100) * 100) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;

  const filtered = catalogue.filter((s) =>
    s.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    s.serviceCode?.toLowerCase().includes(catSearch.toLowerCase()) ||
    s.category?.name?.toLowerCase().includes(catSearch.toLowerCase())
  );

  const validateStep1 = () => {
    if (manualClient) {
      if (!client.clientName.trim()) { toast.error("Client name is required."); return false; }
    } else if (!customer) {
      toast.error("Select a customer, or switch to manual entry.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!items.length) { toast.error("Add at least one service."); return false; }
    const missingPrice = items.find((i) => i.pricingType === "CUSTOM_QUOTE" && (i.unitPrice === "" || Number(i.unitPrice) <= 0));
    if (missingPrice) { toast.error(`"${missingPrice.name}" is a custom-quote service — enter the agreed price.`); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateStep1() || !validateStep2()) return;
    if (discountType === "PERCENTAGE" && (discountValue < 0 || discountValue > 100)) return toast.error("Discount must be between 0 and 100%.");
    if (discountType === "FIXED" && (discountValue < 0 || discountValue > subtotal)) return toast.error("Fixed discount cannot exceed the subtotal.");

    setSaving(true);
    const payload = {
      ...(manualClient ? client : {}),
      customerId: !manualClient && customer ? customer._id : undefined,
      enquiryId: enquiry ? enquiry._id : undefined,
      date: new Date().toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      items: items.map((i) => ({ serviceId: i.serviceId, name: i.name, qty: i.qty, unitPrice: Number(i.unitPrice) || 0, gstPercent: i.gstPercent, billingType: i.billingType })),
      discountType,
      discountValue: Number(discountValue) || 0,
      terms: termsText.split("\n").map((t) => t.trim()).filter(Boolean),
      internalNotes: notes,
    };

    const res = isEdit
      ? await dispatch(updateQuotation({ id, data: payload }))
      : await dispatch(createQuotation(payload));
    setSaving(false);

    if (!res.error) { toast.success(isEdit ? "Quotation updated!" : "Quotation created!"); navigate(`/quotations/${res.payload._id}`); }
    else toast.error(res.payload);
  };

  if (loadingExisting) return <div style={{ padding: 40, textAlign: "center", color: "#1F3C88" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={styles.hdr}>
        <h1 style={styles.h1}>{isEdit ? "Edit Draft Quotation" : "New Quotation"}</h1>
        <button style={styles.backBtn} onClick={() => navigate("/quotations")}>← Cancel</button>
      </div>

      <div style={styles.steps}>
        {["Customer & Enquiry", "Select Services", "Discount & Validity", "Review & Save"].map((s, i) => (
          <div key={s} style={{ ...styles.step, ...(step === i + 1 ? styles.stepActive : step > i + 1 ? styles.stepDone : {}) }} onClick={() => i + 1 < step && setStep(i + 1)}>
            <span style={styles.stepNum}>{step > i + 1 ? "✓" : i + 1}</span> {s}
          </div>
        ))}
      </div>

      {/* Step 1: Customer & Enquiry */}
      {step === 1 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Customer</h2>
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={manualClient} onChange={(e) => { setManualClient(e.target.checked); setCustomer(null); setEnquiry(null); }} />
            No customer in CRM yet — enter client details manually
          </label>

          {manualClient ? (
            <div style={styles.grid2}>
              {[["Client / Company Name *", "clientName"], ["Company", "clientCompany"], ["Email", "clientEmail"], ["Phone", "clientPhone"]].map(([l, k]) => (
                <div key={k}>
                  <label style={styles.label}>{l}</label>
                  <input style={styles.input} value={client[k]} onChange={(e) => setClient({ ...client, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {customer ? (
                <div style={styles.selectedBox}>
                  <div>
                    <strong>{customer.customerNumber} — {customer.companyName}</strong>
                    <div style={{ fontSize: 12.5, color: "#6B7280" }}>{customer.contactPerson} · {customer.email} · {customer.phone}</div>
                  </div>
                  <button style={styles.btn} onClick={() => { setCustomer(null); setEnquiry(null); }}>Change</button>
                </div>
              ) : (
                <>
                  <input style={styles.input} placeholder="Search customer number, company, contact, email, phone…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {customerResults.map((c) => (
                      <div key={c._id} style={styles.pickRow} onClick={() => { setCustomer(c); setCustomerSearch(""); setCustomerResults([]); }}>
                        <strong>{c.customerNumber} — {c.companyName}</strong>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{c.contactPerson} {c.email && `· ${c.email}`}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {customer && (
                <>
                  <h2 style={{ ...styles.cardTitle, marginTop: 24 }}>Enquiry (optional)</h2>
                  {enquiry ? (
                    <div style={styles.selectedBox}>
                      <div><strong>{enquiry.enquiryNumber}</strong> — {enquiry.subject}</div>
                      <button style={styles.btn} onClick={() => selectEnquiry(null)}>Remove</button>
                    </div>
                  ) : enquiries.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {enquiries.map((e) => (
                        <div key={e._id} style={styles.pickRow} onClick={() => selectEnquiry(e)}>
                          <strong>{e.enquiryNumber}</strong> — {e.subject} <span style={{ color: "#6B7280", fontSize: 12 }}>({e.status})</span>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ fontSize: 13, color: "#9CA3AF" }}>No enquiries for this customer.</p>}
                </>
              )}
            </>
          )}

          <button style={styles.nextBtn} onClick={() => validateStep1() && setStep(2)}>Next: Select Services →</button>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ ...styles.cardTitle, margin: 0 }}>Select Services</h2>
            <span style={{ fontSize: 13, color: "#1F3C88", fontWeight: 600 }}>{items.length} selected</span>
          </div>
          <input style={{ ...styles.input, marginBottom: 14 }} placeholder="Search name, code, category…" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
          <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((svc) => {
              const added = items.find((i) => i.serviceId === svc._id);
              return (
                <div key={svc._id} style={{ ...styles.svcRow, ...(added ? styles.svcRowAdded : {}) }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{svc.name} {svc.serviceCode && <code style={{ fontSize: 11, color: "#6B7280" }}>({svc.serviceCode})</code>}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{svc.category?.name} · {svc.billingType}{svc.standard ? ` · ${svc.standard.standardName}:${svc.standard.edition}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 12 }}>
                    <div style={{ fontWeight: 600, color: "#1F3C88" }}>
                      {svc.pricingType === "CUSTOM_QUOTE" ? "Custom Quote" : svc.defaultPrice ? fmt(svc.defaultPrice) : "–"}
                    </div>
                  </div>
                  <button style={{ ...styles.addBtn, ...(added ? styles.addBtnAdded : {}) }} onClick={() => added ? removeItem(svc._id) : addItem(svc)}>
                    {added ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button style={styles.backStepBtn} onClick={() => setStep(1)}>← Back</button>
            <button style={styles.nextBtn} onClick={() => validateStep2() && setStep(3)}>Next: Discount & Validity →</button>
          </div>
        </div>
      )}

      {/* Step 3: Discount / Validity / Terms */}
      {step === 3 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Discount</h2>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Discount Type</label>
              <select style={styles.input} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>{discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (₹)"}</label>
              <input style={styles.input} type="number" min={0} max={discountType === "PERCENTAGE" ? 100 : undefined} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>

          <h2 style={{ ...styles.cardTitle, marginTop: 20 }}>Validity</h2>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Valid Until</label>
              <input style={styles.input} type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <h2 style={{ ...styles.cardTitle, marginTop: 20 }}>Terms & Notes</h2>
          <label style={styles.label}>Terms (one per line)</label>
          <textarea style={{ ...styles.input, height: 90, marginBottom: 14 }} value={termsText} onChange={(e) => setTermsText(e.target.value)} placeholder="This quotation is valid for 14 days from the date of issue.&#10;50% advance payment required." />
          <label style={styles.label}>Internal Notes (not shown on PDF)</label>
          <textarea style={{ ...styles.input, height: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button style={styles.backStepBtn} onClick={() => setStep(2)}>← Back</button>
            <button style={styles.nextBtn} onClick={() => setStep(4)}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Review & Save</h2>
          <table style={styles.table}>
            <thead><tr>{["Service", "Billing", "Qty", "Unit Price", "Amount", ""].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.serviceId}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{item.categoryName}{item.pricingType === "CUSTOM_QUOTE" && " · Custom Quote"}</div>
                  </td>
                  <td style={styles.td}>{item.billingType}</td>
                  <td style={styles.td}><input type="number" style={styles.numInput} value={item.qty} min={1} onChange={(e) => updateItem(item.serviceId, "qty", e.target.value)} /></td>
                  <td style={styles.td}><input type="number" style={styles.numInput} value={item.unitPrice} min={0} placeholder={item.pricingType === "CUSTOM_QUOTE" ? "Enter price" : undefined} onChange={(e) => updateItem(item.serviceId, "unitPrice", e.target.value)} /></td>
                  <td style={styles.td}><strong>{fmt(item.qty * (Number(item.unitPrice) || 0))}</strong></td>
                  <td style={styles.td}><button style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 16 }} onClick={() => removeItem(item.serviceId)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.totalsBox}>
            <div style={styles.totalRow}><span style={{ color: "#6B7280" }}>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div style={styles.totalRow}><span style={{ color: "#6B7280" }}>Discount {discountType === "PERCENTAGE" ? `(${discountValue}%)` : ""}</span><span>– {fmt(discountAmount)}</span></div>
            <div style={styles.totalRow}><span style={{ color: "#6B7280" }}>Taxable Amount</span><span>{fmt(taxable)}</span></div>
            <div style={styles.totalRow}><span style={{ color: "#6B7280" }}>GST (est. {blendedRate.toFixed(1)}%)</span><span>{fmt(gst)}</span></div>
            <div style={{ ...styles.totalRow, borderTop: "2px solid #1F3C88", paddingTop: 10, fontWeight: 700, fontSize: 16, color: "#1F3C88" }}>
              <span>TOTAL (est.)</span><span>{fmt(total)}</span>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>Final totals are calculated by the server at save time.</p>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button style={styles.backStepBtn} onClick={() => setStep(3)}>← Back</button>
            <button style={{ ...styles.nextBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "💾 Save Draft"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  hdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  backBtn: { background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13 },
  steps: { display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" },
  step: { flex: 1, minWidth: 140, padding: "10px 16px", background: "#F3F4F6", borderRadius: 8, fontSize: 13, color: "#6B7280", cursor: "default", display: "flex", alignItems: "center", gap: 8 },
  stepActive: { background: "#EFF6FF", color: "#1F3C88", fontWeight: 600 },
  stepDone: { background: "#D1FAE5", color: "#065F46", cursor: "pointer" },
  stepNum: { width: 22, height: 22, borderRadius: "50%", background: "currentColor", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "20px 24px", marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: "0 0 16px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 16, cursor: "pointer" },
  selectedBox: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#EFF6FF", border: "1px solid #1F3C88", borderRadius: 8, fontSize: 13.5 },
  pickRow: { display: "flex", flexDirection: "column", padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 7, cursor: "pointer", fontSize: 13.5 },
  nextBtn: { padding: "11px 24px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  backStepBtn: { padding: "11px 20px", border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  btn: { padding: "6px 14px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12.5 },
  svcRow: { display: "flex", alignItems: "center", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff" },
  svcRowAdded: { borderColor: "#1F3C88", background: "#EFF6FF" },
  addBtn: { padding: "6px 14px", borderRadius: 6, border: "1px solid #1F3C88", color: "#1F3C88", background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" },
  addBtnAdded: { background: "#1F3C88", color: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 16 },
  th: { padding: "9px 12px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" },
  td: { padding: "10px 12px", fontSize: 13.5, borderBottom: "1px solid #F3F4F6" },
  numInput: { width: 90, padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 5, fontSize: 13, textAlign: "right" },
  totalsBox: { background: "#F9FAFB", borderRadius: 8, padding: "14px 20px", maxWidth: 380, marginLeft: "auto" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13.5 },
};
