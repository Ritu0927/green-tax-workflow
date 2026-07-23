import React from "react";
const toneByStatus = {
  "Not Started": "muted",
  "Waiting on Client": "warning",
  "In Preparation": "info",
  "Ready for Review": "review",
  "Changes Requested": "danger",
  Approved: "success",
  Filed: "neutral",
  Verified: "success",
  "Needs Review": "review",
  Requested: "warning"
  ,
  Open: "warning",
  Review: "review",
  "In Progress": "info",
  Blocked: "danger",
  "Awaiting Review": "review",
  "Needs Reviewer Decision": "review",
  Escalate: "danger",
  Complete: "success",
  "In progress": "info",
  "Needs attention": "warning"
};

export function StatusChip({ value }) {
  const tone = toneByStatus[value] ?? "neutral";
  return <span className={`status-chip ${tone}`}>{value}</span>;
}
