import React from "react";
export function SecurityBadge({ label, tone = "neutral" }) {
  return <span className={`security-badge ${tone}`}>{label}</span>;
}
