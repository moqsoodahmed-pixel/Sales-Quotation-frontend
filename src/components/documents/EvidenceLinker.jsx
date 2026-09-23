import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { formatBytes } from "../../constants/documentTypes";

// For Assessment/Audit/Finding/CorrectiveAction: these entities LINK an
// existing Phase 6 Document (never upload a new one directly) - the
// Document itself is uploaded once, normally via DocumentsPanel on the
// Customer/Enquiry/Quotation/Engagement it truly belongs to, then
// referenced here as evidence for a specific compliance record.
export default function EvidenceLinker({ evidence, onLink, onUnlink }) {
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [note, setNote] = useState("");

  const runSearch = async () => {
    setSearching(true);
    try {
      const res = await api.get("/documents", { params: { limit: 20 } });
      const q = search.toLowerCase();
      setResults(res.data.data.filter((d) => !q || d.originalFilename.toLowerCase().includes(q)));
    } catch { toast.error("Failed to search documents."); }
    setSearching(false);
  };

  return (
    <div>
      {evidence?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {evidence.map((e) => (
            <div key={e._id} style={styles.row}>
              <span style={{ fontSize: 13 }}>{e.document?.originalFilename || "Document"} {e.note && <span style={{ color: "#6B7280" }}>— {e.note}</span>}</span>
              <button style={styles.smallBtn} onClick={() => onUnlink(e.document?._id || e.document)}>Unlink</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input style={styles.input} placeholder="Search existing documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button style={styles.btn} onClick={runSearch} disabled={searching}>{searching ? "…" : "Search"}</button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
          {results.map((d) => (
            <div key={d._id} style={styles.row}>
              <span style={{ fontSize: 12.5 }}>{d.originalFilename} <span style={{ color: "#9CA3AF" }}>({formatBytes(d.fileSize)})</span></span>
              <button style={styles.smallBtn} onClick={() => { onLink(d._id, note); setNote(""); setResults([]); setSearch(""); }}>Link</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F3F4F6" },
  input: { flex: 1, padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13 },
  btn: { padding: "7px 12px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12.5 },
  smallBtn: { padding: "4px 9px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 11.5 },
};
