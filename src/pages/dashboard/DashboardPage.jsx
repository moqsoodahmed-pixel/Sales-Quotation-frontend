import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSummary, fetchQuotationDashboard, fetchCrmDashboard, fetchIsoDashboard } from "../../store/slices/dashboardSlice";
import { useAuth } from "../../hooks/useAuth";
import DateRangeFilter from "../../components/dashboard/DateRangeFilter";
import { STATUS_LABELS as Q_LABELS, STATUS_COLORS as Q_COLORS, ALL_STATUSES as Q_STATUSES } from "../../constants/quotationStatus";
import { STATUS_COLORS as ISO_COLORS, label as isoLabel, CERTIFICATION_DISCLAIMER } from "../../constants/isoCompliance";

const fmt = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { summary, quotations, crm, iso, loading, error } = useSelector((s) => s.dashboard);
  const [range, setRange] = useState("last30days");

  useEffect(() => {
    const params = { range };
    dispatch(fetchSummary(params));
    dispatch(fetchQuotationDashboard(params));
    dispatch(fetchCrmDashboard(params));
    dispatch(fetchIsoDashboard(params));
  }, [dispatch, range]);

  return (
    <div>
      <div style={styles.hdr}>
        <div>
          <h1 style={styles.h1}>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p style={styles.sub}>{isAdmin ? "Organization-wide overview" : "Your assigned pipeline and workload"}</p>
        </div>
        <button style={styles.newBtn} onClick={() => navigate("/quotations/new")}>+ New Quotation</button>
      </div>

      <DateRangeFilter range={range} onChange={setRange} />

      {error && <div style={styles.errorBox}>Failed to load dashboard: {error}</div>}
      {loading && !summary && <div style={styles.empty}>Loading dashboard…</div>}

      {summary && (
        <div style={styles.statsGrid}>
          {[
            { label: "Total Leads", value: summary.leads.total, sub: `${summary.leads.new} new in range`, color: "#1F3C88" },
            { label: "Customers", value: summary.customers.total, sub: "All time", color: "#0369A1" },
            { label: "Open Enquiries", value: summary.enquiries.open, sub: "Active pipeline", color: "#0F766E" },
            { label: "Active Quotations", value: summary.quotations.active, sub: "Draft → Sent", color: "#B45309" },
            { label: "Accepted Quotations", value: summary.quotations.accepted, sub: fmt(summary.quotations.acceptedValue), color: "#166534" },
            { label: "Active ISO Engagements", value: summary.isoEngagements.active, sub: "In progress", color: "#6D28D9" },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
              <div style={styles.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {summary?.followUps.overdue > 0 && (
        <div style={styles.alertBox}>⚠ {summary.followUps.overdue} overdue follow-up{summary.followUps.overdue !== 1 ? "s" : ""} across leads and enquiries.</div>
      )}

      <div style={styles.row}>
        <div style={{ ...styles.card, flex: 1 }}>
          <div style={styles.cardHdr}><h2 style={styles.cardTitle}>Quotation Pipeline</h2></div>
          <div style={{ padding: "12px 20px" }}>
            {quotations && Q_STATUSES.map((st) => (
              <div key={st} style={styles.statusRow}>
                <span style={{ ...styles.statusDot, background: Q_COLORS[st] || "#888" }} />
                <span style={{ flex: 1, fontSize: 13.5 }}>{Q_LABELS[st]}</span>
                <span style={styles.statusCount}>{quotations.pipeline[st]}</span>
                <span style={styles.statusVal}>{fmt(quotations.pipelineValue[st])}</span>
              </div>
            ))}
            {quotations && (
              <div style={styles.summaryFooter}>
                <div>Acceptance rate: <strong>{quotations.acceptanceRate !== null ? `${quotations.acceptanceRate}%` : "–"}</strong></div>
                <div style={{ fontSize: 10.5, color: "#9CA3AF" }}>{quotations.acceptanceRateFormula}</div>
                <div style={{ marginTop: 6 }}>Average quotation value: <strong>{fmt(quotations.averageQuotationValue)}</strong></div>
                <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 4 }}>{quotations.note}</div>
              </div>
            )}
            {!quotations && !loading && <div style={{ color: "#9CA3AF", fontSize: 13 }}>No data.</div>}
          </div>
        </div>

        <div style={{ ...styles.card, flex: 1 }}>
          <div style={styles.cardHdr}><h2 style={styles.cardTitle}>CRM</h2></div>
          <div style={{ padding: "12px 20px" }}>
            {crm && (
              <>
                <div style={styles.kv}><span>Leads created</span><strong>{crm.leads.created}</strong></div>
                <div style={styles.kv}><span>Lead conversion rate</span><strong>{crm.leads.conversionRate !== null ? `${crm.leads.conversionRate}%` : "–"}</strong></div>
                <div style={styles.kv}><span>New customers</span><strong>{crm.customers.total}</strong></div>
                <div style={styles.kv}><span>Open enquiries</span><strong>{crm.enquiries.open}</strong></div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>FOLLOW-UPS</div>
                  <div style={styles.kv}><span>Overdue (leads/enquiries)</span><strong style={{ color: "#991B1B" }}>{crm.followUps.leads.overdue}/{crm.followUps.enquiries.overdue}</strong></div>
                  <div style={styles.kv}><span>Today</span><strong>{crm.followUps.leads.today}/{crm.followUps.enquiries.today}</strong></div>
                  <div style={styles.kv}><span>Upcoming</span><strong>{crm.followUps.leads.upcoming}/{crm.followUps.enquiries.upcoming}</strong></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <h2 style={styles.cardTitle}>ISO Compliance Overview</h2>
          <button style={styles.viewAll} onClick={() => navigate("/iso-engagements")}>View all →</button>
        </div>
        <p style={styles.disclaimer}>{CERTIFICATION_DISCLAIMER}</p>
        {iso && (
          <div style={styles.grid4}>
            <div>
              <div style={styles.sectionTitle}>Engagements</div>
              {Object.entries(iso.engagements).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} style={styles.kv}><span>{isoLabel(k)}</span><strong>{v}</strong></div>
              ))}
              {Object.values(iso.engagements).every((v) => v === 0) && <div style={styles.noneMsg}>None</div>}
            </div>
            <div>
              <div style={styles.sectionTitle}>Compliance</div>
              <div style={styles.kv}><span>Compliant</span><strong style={{ color: "#166534" }}>{iso.compliance.COMPLIANT}</strong></div>
              <div style={styles.kv}><span>Partial</span><strong style={{ color: "#B45309" }}>{iso.compliance.PARTIALLY_COMPLIANT}</strong></div>
              <div style={styles.kv}><span>Non-compliant</span><strong style={{ color: "#991B1B" }}>{iso.compliance.NON_COMPLIANT}</strong></div>
              {iso.compliance.complianceIndicator !== null && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  <strong style={{ color: "#1F3C88" }}>{iso.compliance.complianceIndicator}%</strong> compliance indicator
                  <div style={{ color: "#9CA3AF", marginTop: 2 }}>{iso.compliance.complianceIndicatorFormula}</div>
                </div>
              )}
            </div>
            <div>
              <div style={styles.sectionTitle}>Findings</div>
              <div style={styles.kv}><span>Total</span><strong>{iso.findings.byStatus ? Object.values(iso.findings.byStatus).reduce((a, b) => a + b, 0) : 0}</strong></div>
              <div style={styles.kv}><span>Major NC</span><strong style={{ color: "#991B1B" }}>{iso.findings.byType.MAJOR_NONCONFORMITY}</strong></div>
              <div style={styles.kv}><span>Minor NC</span><strong style={{ color: "#B45309" }}>{iso.findings.byType.MINOR_NONCONFORMITY}</strong></div>
              <div style={styles.kv}><span>Closed</span><strong>{iso.findings.byStatus.CLOSED}</strong></div>
            </div>
            <div>
              <div style={styles.sectionTitle}>Corrective Actions</div>
              <div style={styles.kv}><span>Open</span><strong>{iso.correctiveActions.OPEN}</strong></div>
              <div style={styles.kv}><span>In progress</span><strong>{iso.correctiveActions.IN_PROGRESS}</strong></div>
              <div style={styles.kv}><span>Overdue</span><strong style={{ color: "#991B1B" }}>{iso.correctiveActions.overdue}</strong></div>
              <div style={styles.kv}><span>Closed</span><strong>{iso.correctiveActions.CLOSED}</strong></div>
            </div>
          </div>
        )}
        {!iso && !loading && <div style={styles.empty}>No data.</div>}
      </div>
    </div>
  );
}

const styles = {
  hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { fontSize: 13.5, color: "#6B7280", marginTop: 4 },
  newBtn: { padding: "10px 20px", background: "#1F3C88", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 },
  statCard: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "16px 20px" },
  statLabel: { fontSize: 11.5, color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: .5 },
  statVal: { fontSize: 24, fontWeight: 700, marginTop: 4 },
  statSub: { fontSize: 11.5, color: "#9CA3AF", marginTop: 2 },
  alertBox: { background: "#FEF3C7", color: "#92400E", padding: "10px 16px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  errorBox: { background: "#FEE2E2", color: "#991B1B", padding: "10px 16px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  row: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 16, minWidth: 280, flex: 1 },
  cardHdr: { padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: 600, margin: 0 },
  viewAll: { background: "none", border: "none", color: "#1F3C88", cursor: "pointer", fontSize: 13 },
  disclaimer: { fontSize: 10.5, color: "#9CA3AF", padding: "8px 20px 0" },
  statusRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F4F6" },
  statusDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  statusCount: { fontSize: 13, fontWeight: 700, minWidth: 30, textAlign: "right" },
  statusVal: { fontSize: 12, color: "#6B7280", minWidth: 90, textAlign: "right" },
  summaryFooter: { marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F4F6", fontSize: 13 },
  kv: { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "14px 20px" },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, color: "#1F3C88", textTransform: "uppercase", marginBottom: 8 },
  noneMsg: { fontSize: 12, color: "#9CA3AF" },
  empty: { padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 },
};
