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
  Requested: "warning",
  Open: "warning",
  Draft: "muted",
  Review: "review",
  "In Progress": "info",
  Blocked: "danger",
  Submitted: "info",
  "Awaiting Review": "review",
  "Human review required": "review",
  "Needs Reviewer Decision": "review",
  Escalate: "danger",
  Escalated: "danger",
  Accepted: "success",
  "On hold": "warning",
  Uploaded: "muted",
  Processing: "info",
  Analyzed: "info",
  Failed: "danger",
  "In Review": "review",
  Resolved: "success",
  Complete: "success",
  "In progress": "info",
  "Needs attention": "warning"
};

export function StatusChip({ value }) {
  const tone = toneByStatus[value] ?? "neutral";
  return <span className={`status-chip ${tone}`}>{value}</span>;
}
