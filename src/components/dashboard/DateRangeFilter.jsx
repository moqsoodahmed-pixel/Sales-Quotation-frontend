import React from "react";

const PRESETS = [
  ["today", "Today"], ["yesterday", "Yesterday"], ["last7days", "Last 7 Days"], ["last30days", "Last 30 Days"],
  ["this_month", "This Month"], ["previous_month", "Previous Month"], ["this_quarter", "This Quarter"], ["this_year", "This Year"],
];

export default function DateRangeFilter({ range, onChange }) {
  return (
    <div style={styles.wrap}>
      {PRESETS.map(([value, label]) => (
        <button key={value} style={{ ...styles.chip, ...(range === value ? styles.chipActive : {}) }} onClick={() => onChange(value)}>{label}</button>
      ))}
    </div>
  );
}

const styles = {
  wrap: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 },
  chip: { padding: "6px 13px", borderRadius: 99, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 12.5 },
  chipActive: { background: "#1F3C88", color: "#fff", borderColor: "#1F3C88" },
};
