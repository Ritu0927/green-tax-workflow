import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../app/appContext";
import { SecurityBadge } from "../components/SecurityBadge";
import { StatusChip } from "../components/StatusChip";
import { canApproveReturn, canEditField, canViewInternalNotes } from "../utils/permissions";
import { formatConfidence, formatDateLabel } from "../utils/formatters";

function buildFallbackFields(activeReturn) {
  return activeReturn.sections.map((section, index) => ({
    section,
    fields: [
      {
        id: `fallback-${index}`,
        label: `${section} amount`,
        value: "Pending review",
        sourceValue: "Working support",
        sourceDocumentId: null,
        sourcePage: "Not linked",
        sourceField: "Manual workpaper support",
        transformation: "Reviewer traceability still needed",
        confidence: 0.51,
        aiGenerated: false,
        verified: false,
        editable: true,
        locked: false,
        reviewState: "Awaiting Review"
      }
    ]
  }));
}

export function ReturnWorkspacePage() {
  const { activeClient, activeReturn, activeRole, mockData } = useAppContext();
  const fieldGroups = mockData.returnFieldGroups[activeReturn.id] ?? buildFallbackFields(activeReturn);
  const [selectedSection, setSelectedSection] = useState(fieldGroups[0]?.section ?? activeReturn.sections[0]);
  const selectedGroup = fieldGroups.find((group) => group.section === selectedSection) ?? fieldGroups[0];
  const [selectedFieldId, setSelectedFieldId] = useState(selectedGroup?.fields[0]?.id);

  useEffect(() => {
    const nextGroup = fieldGroups.find((group) => group.section === selectedSection) ?? fieldGroups[0];
    setSelectedSection(nextGroup?.section ?? activeReturn.sections[0]);
    setSelectedFieldId(nextGroup?.fields[0]?.id ?? null);
  }, [activeReturn.id]);

  const selectedField =
    selectedGroup?.fields.find((field) => field.id === selectedFieldId) ?? selectedGroup?.fields[0];

  const linkedDoc = mockData.documents.find((doc) => doc.id === selectedField?.sourceDocumentId);
  const aiInsights = mockData.aiInsights.filter((item) => item.returnId === activeReturn.id);
  const notes = mockData.reviewNotes.filter((note) => note.returnId === activeReturn.id);
  const auditEvents = mockData.auditEvents.filter(
    (event) => event.target === activeReturn.id || event.target === selectedField?.sourceDocumentId || event.target === activeClient.id
  );

  const ownerActionLabel =
    activeReturn.status === "Waiting on Client"
      ? "Client owns next action"
      : activeReturn.status === "Ready for Review"
        ? "Reviewer owns next action"
        : "Firm owns next action";

  const canEdit = canEditField(activeRole) && selectedField?.editable;
  const canApprove = canApproveReturn(activeRole);
  const canSeeInternal = canViewInternalNotes(activeRole);

  return (
    <div className="page-grid">
      <section className="panel workspace-hero">
        <div>
          <p className="eyebrow">Return Workspace</p>
          <h2>{activeClient.name} · {activeReturn.form} · Tax Year {activeReturn.taxYear}</h2>
          <p className="muted">{activeReturn.stageNote}</p>
        </div>
        <div className="workspace-hero-meta">
          <StatusChip value={activeReturn.status} />
          <SecurityBadge label={`Owner · ${activeReturn.owner}`} tone="neutral" />
          <SecurityBadge label="Masked SSN · XXX-XX-4821" tone="neutral" />
          <SecurityBadge label={ownerActionLabel} tone="success" />
        </div>
      </section>

      <section className="workspace-layout">
        <aside className="panel workspace-side">
          <div className="section-heading">
            <h3>Return Sections</h3>
            <span className="tag neutral">{fieldGroups.length} sections</span>
          </div>
          <div className="section-tabs">
            {fieldGroups.map((group) => (
              <button
                key={group.section}
                className={`section-tab ${group.section === selectedSection ? "active" : ""}`}
                onClick={() => {
                  setSelectedSection(group.section);
                  setSelectedFieldId(group.fields[0]?.id ?? null);
                }}
              >
                {group.section}
              </button>
            ))}
          </div>

          <div className="field-list">
            {selectedGroup?.fields.map((field) => (
              <button
                key={field.id}
                className={`field-item ${field.id === selectedField?.id ? "active" : ""}`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <div>
                  <strong>{field.label}</strong>
                  <p>{field.value}</p>
                </div>
                <StatusChip value={field.reviewState} />
              </button>
            ))}
          </div>
        </aside>

        <section className="panel workspace-main">
          <div className="section-heading">
            <div>
              <h3>{selectedField?.label}</h3>
              <p className="muted">Every tax value is linked to evidence, transformation logic, and review status.</p>
            </div>
            <div className="inline-tags">
              <span className={`tag ${selectedField?.aiGenerated ? "review" : "neutral"}`}>{selectedField?.aiGenerated ? "AI-generated" : "Manual"}</span>
              <span className={`tag ${selectedField?.verified ? "success" : "warning"}`}>{selectedField?.verified ? "Verified" : "Awaiting review"}</span>
              <span className={`tag ${selectedField?.locked ? "neutral" : "info"}`}>{selectedField?.locked ? "Locked" : selectedField?.editable ? "Editable" : "Read-only"}</span>
            </div>
          </div>

          <div className="detail-grid">
            <article className="detail-card">
              <span className="eyebrow">Return value</span>
              <strong>{selectedField?.value}</strong>
              <p className="muted">Source value {selectedField?.sourceValue}</p>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Source evidence</span>
              <strong>{linkedDoc?.label ?? "Manual support pending"}</strong>
              <p className="muted">{selectedField?.sourcePage} · {selectedField?.sourceField}</p>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Confidence</span>
              <strong>{formatConfidence(selectedField?.confidence ?? 0)}</strong>
              <p className="muted">{selectedField?.transformation}</p>
            </article>
          </div>

          <div className="traceability-grid">
            <article className="panel inset-panel">
              <h4>Traceability</h4>
              <ul className="stack-list">
                <li className="stack-row">
                  <div>
                    <strong>Source document</strong>
                    <p>{linkedDoc?.label ?? "No linked document yet"}</p>
                  </div>
                  <span className="meta-text">{linkedDoc?.type ?? "Unlinked"}</span>
                </li>
                <li className="stack-row">
                  <div>
                    <strong>Location</strong>
                    <p>{selectedField?.sourcePage} · {selectedField?.sourceField}</p>
                  </div>
                </li>
                <li className="stack-row">
                  <div>
                    <strong>Transformation</strong>
                    <p>{selectedField?.transformation}</p>
                  </div>
                </li>
              </ul>
            </article>

            <article className="panel inset-panel">
              <h4>Affordances</h4>
              <ul className="stack-list">
                <li className="stack-row">
                  <div>
                    <strong>Clickable</strong>
                    <p>Linked objects move between the return, documents, and collaboration without losing context.</p>
                  </div>
                </li>
                <li className="stack-row">
                  <div>
                    <strong>{selectedField?.editable ? "Editable" : "Read-only"}</strong>
                    <p>{selectedField?.locked ? "Verified fields stay locked until a reviewer reopens them." : "Editable values still require explicit reviewer approval."}</p>
                  </div>
                </li>
              </ul>
            </article>
          </div>

          <div className="action-bar">
            <button className={`button ${canEdit ? "" : "disabled"}`} disabled={!canEdit}>Correct value</button>
            <button className={`button secondary ${canApprove ? "" : "disabled"}`} disabled={!canApprove}>Accept recommendation</button>
            <button className="button ghost">Escalate</button>
            <button className="button danger ghost">Request changes</button>
          </div>
        </section>

        <aside className="workspace-rail">
          <article className="panel">
            <div className="section-heading">
              <h3>AI Review</h3>
              <span className="tag review">{aiInsights.length} insights</span>
            </div>
            <ul className="message-list">
              {aiInsights.map((insight) => (
                <li key={insight.id}>
                  <div className="list-title-row">
                    <strong>{insight.recommendation}</strong>
                    <StatusChip value={insight.reviewStatus} />
                  </div>
                  <p>{insight.evidence}</p>
                  <p><strong>Why:</strong> {insight.rationale}</p>
                  <p><strong>Source:</strong> {insight.sourceDocument} · {formatConfidence(insight.confidence)}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h3>Reviewer Notes</h3>
              <span className="tag neutral">{canSeeInternal ? "Internal visible" : "Hidden for client"}</span>
            </div>
            {canSeeInternal ? (
              <ul className="timeline-list">
                {notes.map((note) => (
                  <li key={note.id}>
                    <strong>{note.author}</strong>
                    <p>{note.body}</p>
                    <span className="meta-text">{note.date}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-note">Internal CPA notes are not shown in the client view.</div>
            )}
          </article>

          <article className="panel">
            <div className="section-heading">
              <h3>Audit History</h3>
              <span className="tag success">{formatDateLabel(activeReturn.dueDate)}</span>
            </div>
            <ul className="timeline-list">
              {auditEvents.map((event) => (
                <li key={event.id}>
                  <strong>{event.actor}</strong>
                  <p>{event.action}</p>
                  <span className="meta-text">{event.time}</span>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
