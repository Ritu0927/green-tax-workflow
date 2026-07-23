import React from "react";
import { useMemo } from "react";
import { useAppContext } from "../app/appContext";
import { StatusChip } from "../components/StatusChip";
import { SummaryCard } from "../components/SummaryCard";
import { formatDateLabel } from "../utils/formatters";

export function ClientHomePage() {
  const { activeClient, activeReturn, mockData } = useAppContext();

  const checklist = useMemo(() => {
    const tasks = mockData.tasks
      .filter((item) => item.clientId === activeClient.id && item.visibility === "Client")
      .map((item) => ({ title: item.title, status: item.status, dueDate: item.dueDate }));
    const requests = mockData.documentRequests
      .filter((item) => item.clientId === activeClient.id)
      .map((item) => ({ title: item.title, status: item.status, dueDate: item.dueDate }));
    return [...tasks, ...requests].slice(0, 4);
  }, [activeClient.id, mockData.documentRequests, mockData.tasks]);

  const questionnaire = mockData.questionnaires[activeClient.id] ?? [
    { id: "fallback-1", label: "Personal details", status: activeClient.progress > 40 ? "Complete" : "In progress" },
    { id: "fallback-2", label: "Income and tax documents", status: activeClient.missingDocs > 0 ? "Needs attention" : "Complete" },
    { id: "fallback-3", label: "Banking and signature", status: activeClient.status === "Approved" ? "Complete" : "In progress" }
  ];
  const clientMessages = mockData.messages.filter((item) => item.clientId === activeClient.id && item.channel === "Client");
  const recentActivity = mockData.clientActivity[activeClient.id] ?? [
    { id: "fallback-activity", title: "Return status updated", detail: activeReturn.stageNote, time: "Today" }
  ];

  return (
    <div className="page-grid">
      <section className="panel client-hero">
        <div className="client-hero-main">
          <p className="eyebrow">Client Portal</p>
          <h2>Welcome back, {activeClient.name.split(" ")[0]}</h2>
          <p className="muted">This surface stays calm on purpose. It leads with the next required step, makes progress visible, and keeps the client away from internal CPA complexity.</p>
        </div>
        <div className="client-next-step panel inset-panel">
          <span className="eyebrow">Recommended next step</span>
          <strong>{activeReturn.nextAction}</strong>
          <p className="muted">Return status: {activeReturn.status}. Current owner: {activeReturn.owner}.</p>
        </div>
      </section>

      <section className="summary-row">
        <SummaryCard label="Progress" value={`${activeClient.progress}%`} meta="Onboarding, documents, and questionnaire completion." tone="accent" />
        <SummaryCard label="Missing Documents" value={String(activeClient.missingDocs)} meta="Items stay open until the firm verifies them." />
        <SummaryCard label="Questionnaire" value={`${questionnaire.filter((item) => item.status === "Complete").length}/${questionnaire.length}`} meta="Sections completed so far." />
        <SummaryCard label="Return Status" value={activeReturn.status} meta={`Deadline ${formatDateLabel(activeClient.deadline)}`} />
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="section-heading">
            <h3>Checklist and Missing Items</h3>
            <StatusChip value={activeClient.status} />
          </div>
          <ul className="stack-list">
            {checklist.map((item, index) => (
              <li key={`${item.title}-${index}`} className="stack-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>Due {formatDateLabel(item.dueDate)}</p>
                </div>
                <StatusChip value={item.status} />
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Questionnaire Status</h3>
            <span className="tag neutral">Clear first-run hierarchy</span>
          </div>
          <ul className="stack-list">
            {questionnaire.map((item) => (
              <li key={item.id} className="stack-row">
                <div>
                  <strong>{item.label}</strong>
                  <p>Only the next relevant steps are expanded.</p>
                </div>
                <StatusChip value={item.status} />
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="section-heading">
            <h3>Messages from Your CPA</h3>
            <span className="tag success">{activeClient.unreadMessages} unread</span>
          </div>
          <ul className="message-list">
            {clientMessages.map((message) => (
              <li key={message.id}>
                <div className="list-title-row">
                  <strong>{message.subject}</strong>
                  <span className="meta-text">{message.date}</span>
                </div>
                <p>{message.excerpt}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Recent Activity</h3>
            <span className="tag neutral">{activeClient.secureSession}</span>
          </div>
          <ul className="timeline-list">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <span className="meta-text">{item.time}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
