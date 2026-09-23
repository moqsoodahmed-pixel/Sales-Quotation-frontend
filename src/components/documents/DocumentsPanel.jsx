import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchDocuments, uploadDocument, deactivateDocument, downloadDocumentFile } from "../../store/slices/documentSlice";
import { DOCUMENT_TYPE_GROUPS, DOCUMENT_TYPE_LABELS, STATUS_COLORS, formatBytes } from "../../constants/documentTypes";

// Reusable documents section, mounted on Customer/Enquiry/Quotation detail
// pages and (scoped to a single service) as ISO evidence in the catalogue.
// relationKey: "customer" | "enquiry" | "quotation" | "service" | "isoStandard"
export default function DocumentsPanel({ relationKey, relationId, title = "Documents", allowedTypeGroups }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.documents);
  const [showUpload, setShowUpload] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => dispatch(fetchDocuments({ [relationKey]: relationId, limit: 50 }));
  useEffect(() => { if (relationId) load(); }, [relationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const types = allowedTypeGroups
    ? Object.entries(DOCUMENT_TYPE_GROUPS).filter(([g]) => allowedTypeGroups.includes(g))
    : Object.entries(DOCUMENT_TYPE_GROUPS);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Choose a file to upload.");
    if (!documentType) return toast.error("Select a document type.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append(`${relationKey}Id`, relationId);
    if (description) formData.append("description", description);
    if (expiryDate) formData.append("expiryDate", expiryDate);

    setUploading(true);
    const res = await dispatch(uploadDocument(formData));
    setUploading(false);
    if (!res.error) {
      toast.success("Document uploaded!");
      setShowUpload(false); setFile(null); setDocumentType(""); setDescription(""); setExpiryDate("");
      load();
    } else toast.error(res.payload);
  };

  const handleDownload = async (doc) => {
    try { await downloadDocumentFile(doc._id, doc.originalFilename); }
    catch { toast.error("Download failed."); }
  };

  const handleDeactivate = async (doc) => {
    if (!window.confirm(`Deactivate "${doc.originalFilename}"?`)) return;
    const res = await dispatch(deactivateDocument(doc._id));
    if (!res.error) toast.success("Document deactivated."); else toast.error(res.payload);
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={styles.h3}>{title} ({list.length})</h3>
        <button style={styles.btn} onClick={() => setShowUpload((v) => !v)}>{showUpload ? "Cancel" : "+ Upload"}</button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} style={styles.uploadForm}>
          <select style={styles.input} value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            <option value="">Select document type…</option>
            {types.map(([group, list2]) => (
              <optgroup key={group} label={group}>
                {list2.map((t) => <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>)}
              </optgroup>
            ))}
          </select>
          <input type="file" style={styles.input} onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
          <input style={styles.input} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label style={{ fontSize: 12, color: "#6B7280" }}>Expiry date (optional)</label>
          <input type="date" style={styles.input} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          <button type="submit" style={styles.newBtn} disabled={uploading}>{uploading ? "Uploading…" : "Upload"}</button>
        </form>
      )}

      {loading && <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</p>}
      {!loading && !list.length && <p style={{ fontSize: 13, color: "#9CA3AF" }}>No documents yet.</p>}

      {list.map((doc) => (
        <div key={doc._id} style={styles.row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.originalFilename}</div>
            <div style={{ fontSize: 11.5, color: "#6B7280" }}>
              {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType} · {formatBytes(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString("en-IN")}
              {doc.expiryDate && ` · expires ${new Date(doc.expiryDate).toLocaleDateString("en-IN")}`}
            </div>
          </div>
          <span style={{ ...styles.badge, background: (STATUS_COLORS[doc.status] || "#888") + "22", color: STATUS_COLORS[doc.status] || "#888" }}>{doc.status}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={styles.smallBtn} onClick={() => handleDownload(doc)}>Download</button>
            {doc.isActive && <button style={{ ...styles.smallBtn, color: "#DC2626" }} onClick={() => handleDeactivate(doc)}>Deactivate</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20, marginTop: 16 },
  h3: { fontSize: 14, fontWeight: 700, margin: 0, color: "#1F3C88" },
  btn: { padding: "7px 14px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  smallBtn: { padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 11.5 },
  newBtn: { padding: "9px 16px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 },
  uploadForm: { display: "flex", flexDirection: "column", gap: 8, background: "#F9FAFB", padding: 14, borderRadius: 8, marginBottom: 14 },
  input: { padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, fontFamily: "inherit" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F3F4F6" },
  badge: { padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" },
};
