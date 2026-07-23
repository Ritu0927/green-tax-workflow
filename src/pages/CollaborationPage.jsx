import React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { StatusChip } from "../components/StatusChip";
import { canViewInternalNotes } from "../utils/permissions";
import { formatDateLabel } from "../utils/formatters";

export function CollaborationPage() {
  const { activeClient, activeRole, mockData } = useAppContext();
  const navigate = useNavigate();
  const [view, setView] = useState("All");

  const relatedMessages = mockData.messages.filter((item) => item.clientId === activeClient.id);
  const visibleMessages = relatedMessages.filter((message) => {
    if (view === "All") {
      return canViewInternalNotes(activeRole) ? true : message.channel === "Client";
    }
    return message.channel === view;
  });
  const relatedTasks = mockData.tasks.filter((item) => item.clientId === activeClient.id);
  const relatedRequests = mockData.documentRequests.filter((item) => item.clientId === activeClient.id);
  const nextOwner = useMemo(() => {
    return relatedTasks.find((task) => task.status === "Open")?.owner ?? activeClient.name;
  }, [activeClient.name, relatedTasks]);

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Collaboration and Tasks</h3>
            <p className="muted">Messages, internal notes, document requests, and assigned tasks stay connected to the underlying tax work.</p>
          </div>
          <span className="tag neutral">Next owner · {nextOwner}</span>
        </div>

        <div className="segmented-control">
          {["All", "Client", "Internal"].map((option) => {
            const disabled = option === "Internal" && !canViewInternalNotes(activeRole);
            return (
              <button
                key={option}
                className={`segment ${view === option ? "active" : ""}`}
                onClick={() => !disabled && setView(option)}
                disabled={disabled}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      <section className="workspace-layout collaboration-layout">
        <article className="panel workspace-main">
          <div className="section-heading">
            <h3>Contextual Threads</h3>
            <span className="tag review">{visibleMessages.length} threads</span>
          </div>
          <ul className="message-list">
            {visibleMessages.map((message) => (
              <li key={message.id}>
                <div className="list-title-row">
                  <strong>{message.subject}</strong>
                  <span className={`tag ${message.channel === "Internal" ? "warning" : "success"}`}>{message.channel}</span>
                </div>
                <p>{message.excerpt}</p>
                <div className="list-title-row">
                  <span className="meta-text">{message.author} · {message.date}</span>
                  <button className="text-link" onClick={() => navigate(message.linkedTo.startsWith("doc-") ? "/documents" : "/return-workspace")}>
                    Open linked object
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <aside className="workspace-rail">
          <article className="panel">
            <div className="section-heading">
              <h3>Assigned Tasks</h3>
              <span className="tag neutral">{relatedTasks.length} open</span>
            </div>
            <ul className="timeline-list">
              {relatedTasks.map((task) => (
                <li key={task.id}>
                  <div className="list-title-row">
                    <strong>{task.title}</strong>
                    <StatusChip value={task.status} />
                  </div>
                  <p>{task.type} · {task.owner}</p>
                  <span className="meta-text">Due {formatDateLabel(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h3>Document Requests</h3>
              <span className="tag warning">{relatedRequests.length} active</span>
            </div>
            <ul className="timeline-list">
              {relatedRequests.map((request) => (
                <li key={request.id}>
                  <strong>{request.title}</strong>
                  <p>Owner {request.owner}</p>
                  <span className="meta-text">Due {formatDateLabel(request.dueDate)}</span>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
