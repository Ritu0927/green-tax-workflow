import React from "react";
export function SummaryCard({ label, value, meta, tone = "default" }) {
  return (
    <article className={`summary-card panel ${tone}`}>
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <p className="muted">{meta}</p>
    </article>
  );
}
