import React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { SummaryCard } from "../components/SummaryCard";
import { StatusChip } from "../components/StatusChip";
import { daysUntil, formatDateLabel } from "../utils/formatters";

function computePriority(item) {
  const urgencyScore = item.urgency === "High" ? 40 : item.urgency === "Medium" ? 25 : 10;
  const statusScore = item.status === "Waiting on Client" ? 18 : item.status === "Ready for Review" ? 16 : item.status === "Changes Requested" ? 14 : 8;
  const dueScore = Math.max(0, 12 - daysUntil(item.dueDate));
  return urgencyScore + statusScore + dueScore + item.aiFlags + item.reviewItems;
}

export function CpaDashboardPage() {
  const { mockData, setActiveClientId, setActiveReturnId, setDocumentFocusContext, documentExceptionQueue, completeReviewerTask, currentUser, hasPermission } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");

  const joinedReturns = useMemo(() => {
    return mockData.returns
      .map((item) => {
        const client = mockData.clients.find((entry) => entry.id === item.clientId);
        return {
          ...item,
          clientName: client?.name ?? "Unknown client",
          entity: client?.entity ?? "",
          preparer: client?.preparer ?? "",
          reviewer: client?.reviewer ?? "",
          missingDocs: client?.missingDocs ?? 0,
          unreadMessages: client?.unreadMessages ?? 0,
          priority: computePriority(item)
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [mockData.clients, mockData.returns]);

  const filteredReturns = joinedReturns.filter((item) => {
    const matchesSearch =
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.form.toLowerCase().includes(search.toLowerCase()) ||
      item.nextAction.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesOwner =
      ownerFilter === "All" || item.preparer === ownerFilter || item.reviewer === ownerFilter || item.owner === ownerFilter;
    return matchesSearch && matchesStatus && matchesOwner;
  });

  const documentQueueItems = documentExceptionQueue
    .filter((item) => hasPermission("viewAssignedReturns") || hasPermission("reviewDocuments"))
    .map((item) => ({
      ...item,
      priority: computePriority({
        urgency: item.urgency,
        status: item.status === "Waiting on Client" ? "Waiting on Client" : item.status === "Escalated" ? "Ready for Review" : "In Preparation",
        dueDate: item.dueDate,
        aiFlags: item.alertId ? 1 : 0,
        reviewItems: 1
      })
    }));

  const queueItems = [...filteredReturns.map((item) => ({ ...item, kind: "return" })), ...documentQueueItems]
    .filter((item) => {
      const haystack = item.kind === "return"
        ? `${item.clientName} ${item.form} ${item.nextAction}`
        : `${item.clientName} ${item.documentLabel} ${item.issue} ${item.relatedReturnSection}`;
      const matchesSearch = haystack.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesOwner =
        ownerFilter === "All" ||
        item.preparer === ownerFilter ||
        item.reviewer === ownerFilter ||
        item.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    })
    .sort((a, b) => b.priority - a.priority);

  const openContext = (clientId, returnId, route) => {
    setActiveClientId(clientId);
    setActiveReturnId(returnId);
    navigate(route);
  };

  const openDocumentContext = (item) => {
    setActiveClientId(item.clientId);
    if (item.returnId) {
      setActiveReturnId(item.returnId);
    }
    setDocumentFocusContext({
      clientId: item.clientId,
      returnId: item.returnId,
      documentId: item.documentId,
      alertId: item.alertId ?? null,
      fieldName: item.fieldName ?? null
    });
    navigate("/documents");
  };

  const waitingOnClient = joinedReturns.filter((item) => item.status === "Waiting on Client");
  const readyForReview = joinedReturns.filter((item) => item.status === "Ready for Review");
  const approachingDeadlines = joinedReturns.filter((item) => daysUntil(item.dueDate) <= 14).slice(0, 5);

  return (
    <div className="page-grid">
      <section className="summary-row">
        <SummaryCard label="Priority Queue" value={String(queueItems.filter((item) => item.priority >= 45).length)} meta="High-signal returns and document exceptions with urgency or blockers." tone="accent" />
        <SummaryCard label="Waiting on Client" value={String(waitingOnClient.length)} meta="Returns paused on document collection or open client questions." />
        <SummaryCard label="Ready for Review" value={String(readyForReview.length)} meta="Prepared returns that should move directly into reviewer action." />
        <SummaryCard label="Approaching Deadlines" value={String(approachingDeadlines.length)} meta="Returns due within the next two weeks." />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Priority Action Queue</h3>
            <p className="muted">The dashboard is organized around what should happen next, not passive reporting.</p>
          </div>
        </div>

        <div className="controls-row">
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clients, forms, or next actions"
          />
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Waiting on Client</option>
            <option>In Preparation</option>
            <option>Ready for Review</option>
            <option>Changes Requested</option>
            <option>Needs Review</option>
            <option>Escalated</option>
          </select>
          <select className="filter-select" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option>All</option>
            {mockData.teamMembers.map((member) => (
              <option key={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div className="data-table">
          <div className="data-table-head">
            <span>Client</span>
            <span>Status</span>
            <span>Owner</span>
            <span>Deadline</span>
            <span>Next action</span>
            <span>Move</span>
          </div>
          {queueItems.length ? queueItems.map((item) => (
            <div key={item.id} className="data-table-row">
              <div>
                <strong>{item.clientName}</strong>
                <p>{item.kind === "return" ? `${item.form} · ${item.entity}` : `${item.documentLabel} · ${item.relatedReturnSection}`}</p>
                <span className={`tag ${item.kind === "return" ? "neutral" : "review"}`}>{item.kind === "return" ? "Return" : "Document"}</span>
              </div>
              <div>
                <StatusChip value={item.status} />
                <p>{item.kind === "return" ? `${item.urgency} urgency · ${item.aiFlags} AI flags` : `${item.urgency} urgency · document exception`}</p>
              </div>
              <div>
                <strong>{item.owner}</strong>
                {item.kind === "return" ? (
                  <>
                    <p>Next action owner · {item.owner === item.clientName ? "Client" : item.owner === item.reviewer ? "Reviewer" : "Preparer"}</p>
                    <p>Preparer: {item.preparer}</p>
                    <p>Reviewer: {item.reviewer}</p>
                  </>
                ) : (
                  <p>{item.alertId ? "Linked alert" : "Linked task"} · {item.documentLabel}</p>
                )}
              </div>
              <div>
                <strong>{formatDateLabel(item.dueDate)}</strong>
                <p>{daysUntil(item.dueDate)} days remaining</p>
              </div>
              <div>
                <strong>{item.kind === "return" ? item.nextAction : item.issue}</strong>
                <p>{item.kind === "return" ? (item.blockedBy ?? item.stageNote) : item.relatedReturnSection}</p>
              </div>
              <div className="inline-actions">
                {item.kind === "return" ? (
                  <>
                    <button className="button secondary" onClick={() => openContext(item.clientId, item.id, "/return-workspace")}>Open return</button>
                    <button className="button ghost" onClick={() => openContext(item.clientId, item.id, "/documents")}>Documents</button>
                  </>
                ) : (
                  <>
                    <button className="button secondary" onClick={() => openDocumentContext(item)}>Open document</button>
                    {hasPermission("approveReturns") && item.owner === currentUser?.name && item.taskId ? (
                      <button className="button ghost" onClick={() => completeReviewerTask(item.taskId, currentUser)}>Complete review</button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="empty-note">No returns currently require your attention.</div>
          )}
        </div>
      </section>

      <section className="three-column-grid">
        <article className="panel lane">
          <div className="section-heading">
            <h3>Waiting on Client</h3>
            <StatusChip value="Waiting on Client" />
          </div>
          <ul className="compact-list">
            {waitingOnClient.map((item) => (
              <li key={item.id}>
                <strong>{item.clientName}</strong>
                <p>{item.blockedBy}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel lane">
          <div className="section-heading">
            <h3>Ready for Review</h3>
            <StatusChip value="Ready for Review" />
          </div>
          <ul className="compact-list">
            {readyForReview.map((item) => (
              <li key={item.id}>
                <strong>{item.clientName}</strong>
                <p>{item.reviewItems} review items · owner {item.owner}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel lane">
          <div className="section-heading">
            <h3>Workload by Preparer</h3>
            <span className="tag neutral">Capacity</span>
          </div>
          <ul className="compact-list">
            {mockData.teamMembers
              .filter((member) => member.role !== "Client")
              .map((member) => (
                <li key={member.id}>
                  <strong>{member.name}</strong>
                  <p>{member.activeReturns} active returns · capacity {member.capacity}</p>
                </li>
              ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
