import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchEngagement, fetchDashboard, fetchEngagementHistory, transitionEngagement, clearCurrent,
} from "../../store/slices/isoEngagementSlice";
import { fetchClauses } from "../../store/slices/isoClauseSlice";
import { fetchAssessments, createAssessment, updateAssessment, addAssessmentEvidence, removeAssessmentEvidence } from "../../store/slices/complianceAssessmentSlice";
import { fetchAudits, createAudit, transitionAudit } from "../../store/slices/auditSlice";
import { fetchFindings, createFinding, transitionFinding, addFindingEvidence, removeFindingEvidence } from "../../store/slices/auditFindingSlice";
import { fetchCorrectiveActions, createCorrectiveAction, transitionCorrectiveAction, addCorrectiveActionEvidence, removeCorrectiveActionEvidence } from "../../store/slices/correctiveActionSlice";
import DocumentsPanel from "../../components/documents/DocumentsPanel";
import EvidenceLinker from "../../components/documents/EvidenceLinker";
import { useAuth } from "../../hooks/useAuth";
import {
  STATUS_COLORS, RISK_COLORS, DUE_STATUS_COLORS, label,
  ENGAGEMENT_TRANSITIONS, AUDIT_TRANSITIONS, FINDING_TRANSITIONS, CORRECTIVE_ACTION_TRANSITIONS,
  ASSESSMENT_STATUSES, RISK_LEVELS, AUDIT_TYPES, FINDING_TYPES, CERTIFICATION_DISCLAIMER,
} from "../../constants/isoCompliance";

const TABS = ["Overview", "Compliance", "Evidence", "Audits", "Findings", "Corrective Actions", "History"];

export default function EngagementDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("Overview");
  const { current: engagement, dashboard, history, loading } = useSelector((s) => s.isoEngagements);

  useEffect(() => {
    dispatch(fetchEngagement(id));
    dispatch(fetchDashboard(id));
    dispatch(fetchEngagementHistory(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  const reload = () => { dispatch(fetchDashboard(id)); };

  if (loading && !engagement) return <div style={styles.empty}>Loading…</div>;
  if (!engagement) return <div style={styles.empty}>Engagement not found.</div>;

  const handleTransition = async (action) => {
    if (!window.confirm(`Perform action: ${action.replace(/_/g, " ")}?`)) return;
    const res = await dispatch(transitionEngagement({ id, action }));
    if (!res.error) { toast.success("Updated!"); dispatch(fetchEngagement(id)); dispatch(fetchEngagementHistory(id)); }
    else toast.error(res.payload);
  };

  return (
    <div>
      <button style={styles.back} onClick={() => navigate("/iso-engagements")}>← Back to Engagements</button>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>{engagement.engagementNumber} — {engagement.title}</h1>
          <p style={styles.sub}>{engagement.customer?.companyName} · {engagement.isoStandard?.standardName}:{engagement.isoStandard?.edition}</p>
        </div>
        <span style={{ ...styles.badge, background: (STATUS_COLORS[engagement.status] || "#888") + "22", color: STATUS_COLORS[engagement.status] || "#888" }}>{label(engagement.status)}</span>
      </div>
      <p style={styles.disclaimer}>{CERTIFICATION_DISCLAIMER}</p>

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab engagement={engagement} dashboard={dashboard} onTransition={handleTransition} isAdmin={isAdmin} />}
      {tab === "Compliance" && <ComplianceTab engagementId={id} isoStandardId={engagement.isoStandard?._id} onChange={reload} />}
      {tab === "Evidence" && <DocumentsPanel relationKey="isoEngagement" relationId={id} title="Engagement Documents" />}
      {tab === "Audits" && <AuditsTab engagementId={id} onChange={reload} />}
      {tab === "Findings" && <FindingsTab engagementId={id} onChange={reload} />}
      {tab === "Corrective Actions" && <CorrectiveActionsTab engagementId={id} onChange={reload} />}
      {tab === "History" && <HistoryTab history={history} />}
    </div>
  );
}

function OverviewTab({ engagement, dashboard, onTransition, isAdmin }) {
  const transitions = ENGAGEMENT_TRANSITIONS[engagement.status] || [];
  return (
    <div>
      <div style={styles.card}>
        <h3 style={styles.h3}>Details</h3>
        <div style={styles.grid2}>
          <Row label="Scope" value={engagement.scope} />
          <Row label="Target Certification Date" value={engagement.targetCertificationDate ? new Date(engagement.targetCertificationDate).toLocaleDateString("en-IN") : "–"} />
          <Row label="Start Date" value={engagement.startDate ? new Date(engagement.startDate).toLocaleDateString("en-IN") : "–"} />
          <Row label="Expected Completion" value={engagement.expectedCompletionDate ? new Date(engagement.expectedCompletionDate).toLocaleDateString("en-IN") : "–"} />
          <Row label="Assigned To" value={engagement.assignedTo?.name} />
          <Row label="Created By" value={engagement.createdBy?.name} />
        </div>
      </div>

      {transitions.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.h3}>Actions</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {transitions.map(([action, lbl]) => <button key={action} style={styles.actionBtn} onClick={() => onTransition(action)}>{lbl}</button>)}
          </div>
        </div>
      )}

      {dashboard && (
        <div style={styles.grid3}>
          <div style={styles.card}>
            <h3 style={styles.h3}>Compliance</h3>
            {ASSESSMENT_STATUSES.map((s) => <Row key={s} label={label(s)} value={dashboard.compliance[s]} />)}
            {dashboard.compliance.compliancePercent !== null && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                <strong style={{ color: "#1F3C88" }}>{dashboard.compliance.compliancePercent}%</strong> assessment completion indicator
                <p style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 4 }}>{dashboard.compliance.compliancePercentFormula}</p>
              </div>
            )}
          </div>
          <div style={styles.card}>
            <h3 style={styles.h3}>Findings</h3>
            <Row label="Total" value={dashboard.findings.total} />
            <Row label="Open" value={dashboard.findings.open} />
            <Row label="Major NC" value={dashboard.findings.majorNonconformity} />
            <Row label="Minor NC" value={dashboard.findings.minorNonconformity} />
            <Row label="Closed" value={dashboard.findings.closed} />
          </div>
          <div style={styles.card}>
            <h3 style={styles.h3}>Corrective Actions</h3>
            <Row label="Open" value={dashboard.correctiveActions.open} />
            <Row label="In Progress" value={dashboard.correctiveActions.inProgress} />
            <Row label="Verification" value={dashboard.correctiveActions.verification} />
            <Row label="Overdue" value={dashboard.correctiveActions.overdue} />
            <Row label="Closed" value={dashboard.correctiveActions.closed} />
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceTab({ engagementId, isoStandardId, onChange }) {
  const dispatch = useDispatch();
  const { list: clauses } = useSelector((s) => s.isoClauses);
  const { list: assessments } = useSelector((s) => s.assessments);
  const [editing, setEditing] = useState(null);

  useEffect(() => { if (isoStandardId) dispatch(fetchClauses({ isoStandard: isoStandardId })); }, [dispatch, isoStandardId]);
  useEffect(() => { dispatch(fetchAssessments({ engagement: engagementId })); }, [dispatch, engagementId]);

  const assessmentFor = (clauseId) => assessments.find((a) => (a.clause?._id || a.clause) === clauseId);

  const openEditor = async (clause) => {
    const existing = assessmentFor(clause._id);
    if (existing) { setEditing(existing); return; }
    const res = await dispatch(createAssessment({ engagement: engagementId, clause: clause._id }));
    if (!res.error) setEditing(res.payload); else toast.error(res.payload);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.h3}>Clause Assessments ({clauses.length})</h3>
      {!clauses.length && <p style={{ fontSize: 13, color: "#9CA3AF" }}>No clauses defined for this ISO standard yet. Admins can add clauses via the ISO Clauses admin area.</p>}
      <table style={styles.table}>
        <thead><tr>{["Clause", "Title", "Status", "Risk", "Owner", "Evidence"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
        <tbody>
          {clauses.map((c) => {
            const a = assessmentFor(c._id);
            return (
              <tr key={c._id} style={{ cursor: "pointer" }} onClick={() => openEditor(c)}>
                <td style={styles.td}>{c.clauseNumber}</td>
                <td style={styles.td}>{c.title}</td>
                <td style={styles.td}><span style={{ ...styles.badge, background: (STATUS_COLORS[a?.status || "NOT_ASSESSED"]) + "22", color: STATUS_COLORS[a?.status || "NOT_ASSESSED"] }}>{label(a?.status || "NOT_ASSESSED")}</span></td>
                <td style={styles.td}>{a?.riskLevel ? <span style={{ ...styles.badge, background: RISK_COLORS[a.riskLevel] + "22", color: RISK_COLORS[a.riskLevel] }}>{a.riskLevel}</span> : "–"}</td>
                <td style={styles.td}>{a?.owner?.name || "–"}</td>
                <td style={styles.td}>{a?.evidence?.length || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editing && (
        <AssessmentEditor assessment={editing} onClose={() => setEditing(null)} onSaved={() => { dispatch(fetchAssessments({ engagement: engagementId })); onChange(); }} />
      )}
    </div>
  );
}

function AssessmentEditor({ assessment, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState(assessment.status);
  const [riskLevel, setRiskLevel] = useState(assessment.riskLevel || "");
  const [gapDescription, setGapDescription] = useState(assessment.gapDescription || "");
  const [notes, setNotes] = useState(assessment.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await dispatch(updateAssessment({ id: assessment._id, data: { status, riskLevel: riskLevel || undefined, gapDescription, notes } }));
    setSaving(false);
    if (!res.error) { toast.success("Assessment updated!"); onSaved(); onClose(); }
    else toast.error(res.payload);
  };

  const handleLink = async (documentId, note) => {
    const res = await dispatch(addAssessmentEvidence({ id: assessment._id, documentId, note }));
    if (!res.error) toast.success("Evidence linked!"); else toast.error(res.payload);
  };
  const handleUnlink = async (documentId) => {
    const res = await dispatch(removeAssessmentEvidence({ id: assessment._id, documentId }));
    if (!res.error) toast.success("Evidence unlinked."); else toast.error(res.payload);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Assess Clause</h2>
        <label style={styles.label}>Status
          <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ASSESSMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        <label style={styles.label}>Risk Level
          <select style={styles.input} value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="">None</option>
            {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label style={styles.label}>Gap Description<textarea style={{ ...styles.input, height: 60 }} value={gapDescription} onChange={(e) => setGapDescription(e.target.value)} /></label>
        <label style={styles.label}>Notes<textarea style={{ ...styles.input, height: 50 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>

        <h3 style={{ ...styles.h3, marginTop: 14 }}>Evidence</h3>
        <EvidenceLinker evidence={assessment.evidence} onLink={handleLink} onUnlink={handleUnlink} />

        <div style={styles.modalActions}>
          <button style={styles.btn} onClick={onClose}>Close</button>
          <button style={styles.newBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function AuditsTab({ engagementId, onChange }) {
  const dispatch = useDispatch();
  const { list: audits } = useSelector((s) => s.audits);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ auditType: "INTERNAL", title: "", scope: "" });
  const [selected, setSelected] = useState(null);

  useEffect(() => { dispatch(fetchAudits({ engagement: engagementId })); }, [dispatch, engagementId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required.");
    const res = await dispatch(createAudit({ engagement: engagementId, ...form }));
    if (!res.error) { toast.success("Audit created!"); setShowForm(false); setForm({ auditType: "INTERNAL", title: "", scope: "" }); }
    else toast.error(res.payload);
  };

  const handleTransition = async (audit, action) => {
    const res = await dispatch(transitionAudit({ id: audit._id, action }));
    if (!res.error) { toast.success("Updated!"); dispatch(fetchAudits({ engagement: engagementId })); onChange(); }
    else toast.error(res.payload);
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={styles.h3}>Audits ({audits.length})</h3>
        <button style={styles.btn} onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New Audit"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.inlineForm}>
          <select style={styles.input} value={form.auditType} onChange={(e) => setForm({ ...form, auditType: e.target.value })}>
            {AUDIT_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
          <input style={styles.input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input style={styles.input} placeholder="Scope (optional)" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
          <button type="submit" style={styles.newBtn}>Create</button>
        </form>
      )}

      {audits.map((a) => (
        <div key={a._id} style={styles.listRow} onClick={() => setSelected(a)}>
          <div><strong>{a.auditNumber}</strong> — {a.title} <span style={{ color: "#6B7280", fontSize: 12 }}>({label(a.auditType)})</span></div>
          <span style={{ ...styles.badge, background: STATUS_COLORS[a.status] + "22", color: STATUS_COLORS[a.status] }}>{label(a.status)}</span>
        </div>
      ))}

      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{selected.auditNumber} — {selected.title}</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {(AUDIT_TRANSITIONS[selected.status] || []).map(([action, lbl]) => (
                <button key={action} style={styles.actionBtn} onClick={() => { handleTransition(selected, action); setSelected(null); }}>{lbl}</button>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btn} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FindingsTab({ engagementId, onChange }) {
  const dispatch = useDispatch();
  const { list: audits } = useSelector((s) => s.audits);
  const { list: findings } = useSelector((s) => s.findings);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ audit: "", type: "OBSERVATION", title: "", description: "" });
  const [selected, setSelected] = useState(null);

  useEffect(() => { dispatch(fetchAudits({ engagement: engagementId })); dispatch(fetchFindings({ engagement: engagementId })); }, [dispatch, engagementId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.audit) return toast.error("Select an audit.");
    if (!form.title.trim()) return toast.error("Title is required.");
    const res = await dispatch(createFinding(form));
    if (!res.error) { toast.success("Finding created!"); setShowForm(false); setForm({ audit: "", type: "OBSERVATION", title: "", description: "" }); }
    else toast.error(res.payload);
  };

  const handleTransition = async (finding, action) => {
    const res = await dispatch(transitionFinding({ id: finding._id, action }));
    if (!res.error) { toast.success("Updated!"); dispatch(fetchFindings({ engagement: engagementId })); onChange(); }
    else toast.error(res.payload);
  };

  const handleLink = async (documentId, note) => {
    const res = await dispatch(addFindingEvidence({ id: selected._id, documentId, note }));
    if (!res.error) toast.success("Evidence linked!"); else toast.error(res.payload);
  };
  const handleUnlink = async (documentId) => {
    const res = await dispatch(removeFindingEvidence({ id: selected._id, documentId }));
    if (!res.error) toast.success("Evidence unlinked."); else toast.error(res.payload);
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={styles.h3}>Findings ({findings.length})</h3>
        <button style={styles.btn} onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New Finding"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.inlineForm}>
          <select style={styles.input} value={form.audit} onChange={(e) => setForm({ ...form, audit: e.target.value })}>
            <option value="">Select audit…</option>
            {audits.map((a) => <option key={a._id} value={a._id}>{a.auditNumber} — {a.title}</option>)}
          </select>
          <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {FINDING_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
          <input style={styles.input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea style={{ ...styles.input, height: 50 }} placeholder="Objective finding / description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="submit" style={styles.newBtn}>Create</button>
        </form>
      )}

      {findings.map((f) => (
        <div key={f._id} style={styles.listRow} onClick={() => setSelected(f)}>
          <div><strong>{f.findingNumber}</strong> — {f.title} <span style={{ color: "#6B7280", fontSize: 12 }}>({label(f.type)})</span></div>
          <span style={{ ...styles.badge, background: STATUS_COLORS[f.status] + "22", color: STATUS_COLORS[f.status] }}>{label(f.status)}</span>
        </div>
      ))}

      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{selected.findingNumber} — {selected.title}</h2>
            <p style={{ fontSize: 13, color: "#374151" }}>{selected.description}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {(FINDING_TRANSITIONS[selected.status] || []).map(([action, lbl]) => (
                <button key={action} style={styles.actionBtn} onClick={() => { handleTransition(selected, action); setSelected(null); }}>{lbl}</button>
              ))}
            </div>
            <h3 style={styles.h3}>Evidence</h3>
            <EvidenceLinker evidence={selected.evidence} onLink={handleLink} onUnlink={handleUnlink} />
            <div style={styles.modalActions}>
              <button style={styles.btn} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CorrectiveActionsTab({ engagementId, onChange }) {
  const dispatch = useDispatch();
  const { list: findings } = useSelector((s) => s.findings);
  const { list: actions } = useSelector((s) => s.correctiveActions);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ finding: "", rootCause: "", correction: "", correctiveAction: "", dueDate: "" });
  const [selected, setSelected] = useState(null);
  const [verifyNote, setVerifyNote] = useState("");

  useEffect(() => { dispatch(fetchFindings({ engagement: engagementId })); dispatch(fetchCorrectiveActions({ engagement: engagementId })); }, [dispatch, engagementId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.finding) return toast.error("Select a finding.");
    const res = await dispatch(createCorrectiveAction(form));
    if (!res.error) { toast.success("Corrective action created!"); setShowForm(false); setForm({ finding: "", rootCause: "", correction: "", correctiveAction: "", dueDate: "" }); }
    else toast.error(res.payload);
  };

  const handleTransition = async (ca, action, comment) => {
    const res = await dispatch(transitionCorrectiveAction({ id: ca._id, action, comment }));
    if (!res.error) { toast.success("Updated!"); dispatch(fetchCorrectiveActions({ engagement: engagementId })); onChange(); setSelected(null); }
    else toast.error(res.payload);
  };

  const handleLink = async (documentId, note) => {
    const res = await dispatch(addCorrectiveActionEvidence({ id: selected._id, documentId, note }));
    if (!res.error) toast.success("Evidence linked!"); else toast.error(res.payload);
  };
  const handleUnlink = async (documentId) => {
    const res = await dispatch(removeCorrectiveActionEvidence({ id: selected._id, documentId }));
    if (!res.error) toast.success("Evidence unlinked."); else toast.error(res.payload);
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={styles.h3}>Corrective Actions ({actions.length})</h3>
        <button style={styles.btn} onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New Action"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.inlineForm}>
          <select style={styles.input} value={form.finding} onChange={(e) => setForm({ ...form, finding: e.target.value })}>
            <option value="">Select finding…</option>
            {findings.map((f) => <option key={f._id} value={f._id}>{f.findingNumber} — {f.title}</option>)}
          </select>
          <textarea style={{ ...styles.input, height: 50 }} placeholder="Root cause" value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} />
          <textarea style={{ ...styles.input, height: 50 }} placeholder="Correction (immediate fix)" value={form.correction} onChange={(e) => setForm({ ...form, correction: e.target.value })} />
          <textarea style={{ ...styles.input, height: 50 }} placeholder="Corrective action (systemic fix)" value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} />
          <label style={{ fontSize: 12, color: "#6B7280" }}>Due date</label>
          <input type="date" style={styles.input} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <button type="submit" style={styles.newBtn}>Create</button>
        </form>
      )}

      {actions.map((ca) => (
        <div key={ca._id} style={styles.listRow} onClick={() => setSelected(ca)}>
          <div><strong>{ca.actionNumber}</strong> {ca.dueDate && <span style={{ color: "#6B7280", fontSize: 12 }}>— due {new Date(ca.dueDate).toLocaleDateString("en-IN")}</span>}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ ...styles.badge, background: (DUE_STATUS_COLORS[ca.dueStatus] || "#888") + "22", color: DUE_STATUS_COLORS[ca.dueStatus] || "#888" }}>{label(ca.dueStatus)}</span>
            <span style={{ ...styles.badge, background: STATUS_COLORS[ca.status] + "22", color: STATUS_COLORS[ca.status] }}>{label(ca.status)}</span>
          </div>
        </div>
      ))}

      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{selected.actionNumber}</h2>
            <Row label="Root Cause" value={selected.rootCause} />
            <Row label="Correction" value={selected.correction} />
            <Row label="Corrective Action" value={selected.correctiveAction} />
            <Row label="Responsible" value={selected.responsiblePerson?.name} />
            <Row label="Completed (by responsible person)" value={selected.completedAt ? new Date(selected.completedAt).toLocaleString("en-IN") : "Not yet"} />
            <Row label="Verified (independent check)" value={selected.verifiedAt ? `${new Date(selected.verifiedAt).toLocaleString("en-IN")} by ${selected.verifiedBy?.name || ""}` : "Not yet"} />

            {["VERIFY_INEFFECTIVE"].some((a) => (CORRECTIVE_ACTION_TRANSITIONS[selected.status] || []).some(([act]) => act === a)) && (
              <textarea style={{ ...styles.input, height: 50, marginTop: 8 }} placeholder="Verification note (required for Ineffective)" value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} />
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {(CORRECTIVE_ACTION_TRANSITIONS[selected.status] || []).map(([action, lbl]) => (
                <button key={action} style={styles.actionBtn} onClick={() => handleTransition(selected, action, verifyNote)}>{lbl}</button>
              ))}
            </div>

            <h3 style={{ ...styles.h3, marginTop: 14 }}>Evidence</h3>
            <EvidenceLinker evidence={selected.evidence} onLink={handleLink} onUnlink={handleUnlink} />

            <div style={styles.modalActions}>
              <button style={styles.btn} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ history }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.h3}>Workflow History ({history.length})</h3>
      {history.slice().reverse().map((h) => (
        <div key={h._id} style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600 }}>{h.action.replace(/_/g, " ")}</span>
            <span style={{ color: "#9CA3AF" }}>{new Date(h.performedAt).toLocaleString("en-IN")}</span>
          </div>
          <div style={{ color: "#6B7280" }}>{h.performedBy?.name || "System"}{h.comment && ` — "${h.comment}"`}</div>
        </div>
      ))}
    </div>
  );
}

const Row = ({ label: l, value }) => (
  <div style={styles.row}><span style={styles.rowLabel}>{l}</span><span style={styles.rowValue}>{value || "–"}</span></div>
);

const styles = {
  back: { background: "none", border: "none", color: "#1F3C88", cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0 },
  hdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 20, fontWeight: 700, margin: 0 },
  h3: { fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#1F3C88" },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  disclaimer: { fontSize: 11, color: "#9CA3AF", marginBottom: 16, maxWidth: 700 },
  badge: { padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap" },
  tabs: { display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap", borderBottom: "1px solid #E5E7EB" },
  tab: { padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#6B7280", borderBottom: "2px solid transparent" },
  tabActive: { color: "#1F3C88", fontWeight: 600, borderBottomColor: "#1F3C88" },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20, marginBottom: 16 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  row: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13, gap: 12 },
  rowLabel: { color: "#6B7280" },
  rowValue: { fontWeight: 500, textAlign: "right" },
  btn: { padding: "7px 14px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  newBtn: { padding: "9px 16px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 },
  actionBtn: { padding: "8px 14px", border: "1px solid #1F3C88", color: "#1F3C88", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  inlineForm: { display: "flex", flexDirection: "column", gap: 8, background: "#F9FAFB", padding: 14, borderRadius: 8, marginBottom: 14 },
  listRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: "1px solid #F3F4F6", cursor: "pointer", fontSize: 13.5 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" },
  td: { padding: "9px 10px", fontSize: 13, borderBottom: "1px solid #F3F4F6" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 10, padding: 24, width: "100%", maxWidth: 600, maxHeight: "88vh", overflowY: "auto" },
  modalTitle: { fontSize: 17, fontWeight: 700, margin: "0 0 14px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 10 },
  input: { padding: "8px 11px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13.5, fontFamily: "inherit" },
  empty: { padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
};
