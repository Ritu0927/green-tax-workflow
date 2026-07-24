import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { SecurityBadge } from "../components/SecurityBadge";
import { StatusChip } from "../components/StatusChip";
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
  const {
    activeClient,
    activeReturn,
    mockData,
    documentAnalyses,
    acceptInsightRecommendation,
    saveFieldCorrection,
    escalateInsight,
    setDocumentFocusContext,
    hasPermission
  } = useAppContext();
  const navigate = useNavigate();
  const fieldGroups = mockData.returnFieldGroups[activeReturn.id] ?? buildFallbackFields(activeReturn);
  const [selectedSection, setSelectedSection] = useState(fieldGroups[0]?.section ?? activeReturn.sections[0]);
  const selectedGroup = fieldGroups.find((group) => group.section === selectedSection) ?? fieldGroups[0];
  const [selectedFieldId, setSelectedFieldId] = useState(selectedGroup?.fields[0]?.id);
  const [editMode, setEditMode] = useState(false);
  const [editedValue, setEditedValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [recommendationNotice, setRecommendationNotice] = useState("");
  const [escalateMode, setEscalateMode] = useState(false);
  const [escalationNote, setEscalationNote] = useState("");

  useEffect(() => {
    const nextGroup = fieldGroups.find((group) => group.section === selectedSection) ?? fieldGroups[0];
    setSelectedSection(nextGroup?.section ?? activeReturn.sections[0]);
    setSelectedFieldId(nextGroup?.fields[0]?.id ?? null);
    setEditMode(false);
    setEscalateMode(false);
    setRecommendationNotice("");
    setEditedValue("");
    setCorrectionReason("");
    setEditError("");
  }, [activeReturn.id]);

  const selectedField = selectedGroup?.fields.find((field) => field.id === selectedFieldId) ?? selectedGroup?.fields[0];

  const linkedDoc = mockData.documents.find((doc) => doc.id === selectedField?.sourceDocumentId);
  const linkedDocAnalysis = linkedDoc ? documentAnalyses[linkedDoc.id] : null;
  const linkedExtractedField = linkedDocAnalysis?.extractedFields?.find((field) => {
    const normalizedFieldLabel = selectedField?.label?.toLowerCase() ?? "";
    const normalizedSourceField = selectedField?.sourceField?.toLowerCase() ?? "";
    return field.label.toLowerCase() === normalizedFieldLabel || normalizedSourceField.includes(field.label.toLowerCase());
  }) ?? linkedDocAnalysis?.extractedFields?.[0];
  const linkedFieldAlerts = linkedDocAnalysis?.insights?.filter(
    (alert) => alert.relatedField === linkedExtractedField?.label && ["Open", "In Review", "Waiting on Client", "Escalated"].includes(alert.reviewStatus)
  ) ?? [];
  const aiInsights = mockData.aiInsights.filter((item) => item.returnId === activeReturn.id);
  const actionableInsight = aiInsights.find((item) => item.fieldId === selectedField?.id) ?? aiInsights[0];
  const notes = mockData.reviewNotes.filter((note) => note.returnId === activeReturn.id);
  const auditEvents = mockData.auditEvents.filter(
    (event) => event.target === activeReturn.id || event.target === selectedField?.sourceDocumentId || event.target === activeClient.id
  );
  const openDocumentRequests = mockData.documentRequests.filter(
    (request) => request.clientId === activeClient.id && request.linkedDocumentId === selectedField?.sourceDocumentId
  );

  const ownerActionLabel =
    activeReturn.status === "Waiting on Client"
      ? "Client owns next action"
      : activeReturn.status === "Ready for Review"
        ? "Reviewer owns next action"
        : "Firm owns next action";

  const canEdit = hasPermission("editReturnValues") && selectedField?.editable;
  const canRespondToAi = hasPermission("respondToAiInsights");
  const canApprove = hasPermission("approveReturns");
  const canSeeInternal = hasPermission("addInternalNotes") || hasPermission("viewAuditHistory");
  const recommendationAccepted = actionableInsight?.status === "accepted";
  const acceptDisabled = !canRespondToAi || !actionableInsight?.actionable || recommendationAccepted;
  const acceptDisabledReason = recommendationAccepted
    ? "This recommendation has already been accepted."
    : !actionableInsight?.actionable
      ? "This recommendation requires more evidence before it can be accepted."
      : !canRespondToAi
        ? "This account cannot act on AI-assisted review items."
        : "";

  async function handleSaveCorrection() {
    const numericPattern = /^-?\$?\d[\d,]*(\.\d+)?$/;
    if (!numericPattern.test(editedValue.trim())) {
      setEditError("Enter a numeric corrected value.");
      return;
    }
    if (!correctionReason.trim()) {
      setEditError("Correction reason is required.");
      return;
    }

    setIsSavingCorrection(true);
    await saveFieldCorrection({
      returnId: activeReturn.id,
      fieldId: selectedField.id,
      previousValue: selectedField.value,
      nextValue: editedValue.trim(),
      reason: correctionReason.trim()
    });
    setIsSavingCorrection(false);
    setEditMode(false);
    setEditError("");
    setCorrectionReason("");
    setRecommendationNotice("Correction saved. Human review is still required.");
  }

  async function handleAcceptRecommendation() {
    if (acceptDisabled || !selectedField) {
      return;
    }

    await acceptInsightRecommendation(actionableInsight.id);
    setRecommendationNotice("Recommendation accepted. Workflow action created and logged for review.");
  }

  async function handleEscalate() {
    if (!escalationNote.trim()) {
      return;
    }
    await escalateInsight({
      insightId: actionableInsight?.id,
      returnId: activeReturn.id,
      fieldId: selectedField?.id,
      note: escalationNote.trim()
    });
    setRecommendationNotice("Insight escalated for additional review.");
    setEscalateMode(false);
    setEscalationNote("");
  }

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
              <p className="muted">{activeReturn.nextAction}</p>
            </div>
            <div className="inline-tags">
              <span className={`tag ${selectedField?.aiGenerated ? "review" : "neutral"}`}>{selectedField?.aiGenerated ? "AI-generated" : "Manual"}</span>
              <span className={`tag ${selectedField?.verified ? "success" : "warning"}`}>{selectedField?.manualStatus ?? (selectedField?.verified ? "Verified" : selectedField?.reviewState)}</span>
              <span className={`tag ${selectedField?.locked ? "neutral" : "info"}`}>{selectedField?.locked ? "Locked" : selectedField?.editable ? "Editable" : "Read-only"}</span>
            </div>
          </div>

          <div className="detail-grid">
            <article className="detail-card">
              <span className="eyebrow">Return value</span>
              <strong>{selectedField?.value}</strong>
              <p className="muted">Review status {selectedField?.reviewState}</p>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Original source value</span>
              <strong>{selectedField?.sourceValue}</strong>
              <p className="muted">{linkedDoc?.label ?? "Manual support pending"}</p>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Confidence</span>
              <strong>{formatConfidence(selectedField?.confidence ?? 0)}</strong>
              <p className="muted">{selectedField?.transformation}</p>
            </article>
          </div>

          <article className="panel inset-panel source-evidence-panel">
            <h4>Source Evidence</h4>
            <ul className="stack-list">
              <li className="stack-row">
                <div>
                  <strong>Document</strong>
                  {linkedDoc ? (
                    <button
                      className="text-link inline-text-link"
                      onClick={() => {
                        setDocumentFocusContext({
                          clientId: activeClient.id,
                          returnId: activeReturn.id,
                          documentId: linkedDoc.id,
                          alertId: null,
                          fieldName: linkedExtractedField?.name ?? null
                        });
                        navigate("/documents");
                      }}
                    >
                      {linkedDoc.label}
                    </button>
                  ) : (
                    <p>No linked document yet</p>
                  )}
                </div>
              </li>
              <li className="stack-row">
                <div>
                  <strong>Location</strong>
                  <p>{selectedField?.sourcePage} · {selectedField?.sourceField}</p>
                </div>
              </li>
              <li className="stack-row">
                <div>
                  <strong>Extracted value</strong>
                  <p>{linkedExtractedField?.value ?? selectedField?.sourceValue ?? "Not available"}</p>
                </div>
              </li>
              <li className="stack-row">
                <div>
                  <strong>Verification status</strong>
                  <p>
                    {linkedExtractedField?.reviewStatus ?? "Needs Review"}
                    {linkedExtractedField?.verifiedBy ? ` · Verified by ${linkedExtractedField.verifiedBy}` : ""}
                  </p>
                </div>
              </li>
              <li className="stack-row">
                <div>
                  <strong>Open alerts</strong>
                  <p>{linkedFieldAlerts.length} unresolved</p>
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

          <div className="action-bar">
            <button
              className={`button ${acceptDisabled ? "disabled" : ""}`}
              disabled={acceptDisabled}
              title={acceptDisabledReason}
              onClick={handleAcceptRecommendation}
            >
              {recommendationAccepted ? "Recommendation accepted" : "Accept recommendation"}
            </button>
            <button
              className={`button secondary ${canEdit ? "" : "disabled"}`}
              disabled={!canEdit || isSavingCorrection}
              onClick={() => {
                setEditMode((current) => !current);
                setEditedValue(selectedField?.value ?? "");
                setEditError("");
              }}
            >
              {isSavingCorrection ? "Saving..." : "Correct value"}
            </button>
            <button
              className={`button ghost ${canRespondToAi ? "" : "disabled"}`}
              onClick={() => {
                if (canRespondToAi) {
                  setEscalateMode((current) => !current);
                }
              }}
              disabled={!canRespondToAi}
            >
              Escalate
            </button>
          </div>

          {editMode ? (
            <div className="panel inset-panel inline-editor">
              <div className="section-heading">
                <h4>Correct return value</h4>
              </div>
              <label className="form-field">
                <span className="context-label">Current value</span>
                <input value={editedValue} onChange={(event) => setEditedValue(event.target.value)} />
              </label>
              <label className="form-field">
                <span className="context-label">Correction reason</span>
                <textarea value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} rows={3} />
              </label>
              {editError ? <p className="form-error">{editError}</p> : null}
              <div className="inline-actions">
                <button className="button" onClick={handleSaveCorrection} disabled={isSavingCorrection}>Save correction</button>
                <button className="button ghost" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </div>
          ) : null}

          {escalateMode ? (
            <div className="panel inset-panel inline-editor">
              <div className="section-heading">
                <h4>Escalation note</h4>
              </div>
              <label className="form-field">
                <span className="context-label">Note</span>
                <textarea value={escalationNote} onChange={(event) => setEscalationNote(event.target.value)} rows={3} />
              </label>
              <div className="inline-actions">
                <button className="button" onClick={handleEscalate} disabled={!escalationNote.trim()}>Submit escalation</button>
                <button className="button ghost" onClick={() => setEscalateMode(false)}>Cancel</button>
              </div>
            </div>
          ) : null}

          {recommendationNotice ? <p className="action-confirmation">{recommendationNotice}</p> : null}
          {openDocumentRequests.length ? (
            <div className="panel inset-panel inline-editor">
              <div className="section-heading">
                <h4>Open document requests</h4>
              </div>
              <ul className="stack-list">
                {openDocumentRequests.map((request) => (
                  <li key={request.id} className="stack-row">
                    <div>
                      <strong>{request.title}</strong>
                      <p>{request.owner} · Due {formatDateLabel(request.dueDate)}</p>
                    </div>
                    <StatusChip value={request.status} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
                    <StatusChip value={insight.reviewStatus ?? "Human review required"} />
                  </div>
                  <p><strong>Suggested action:</strong> {insight.recommendedAction}</p>
                  <p>{insight.reason ?? insight.evidence}</p>
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
