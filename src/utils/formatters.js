export function formatDateLabel(value) {
  if (!value) {
    return "Pending upload";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

export function formatConfidence(value) {
  return `${Math.round(value * 100)}%`;
}

export function daysUntil(value) {
  const current = new Date("2026-07-23T12:00:00");
  const due = new Date(`${value}T12:00:00`);
  return Math.round((due - current) / (1000 * 60 * 60 * 24));
}
