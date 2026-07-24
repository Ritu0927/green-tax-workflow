import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientSurveySections, getVisibleQuestions } from "../data/clientSurveySchema";
import { useAppContext } from "../app/appContext";
import { StatusChip } from "../components/StatusChip";
import { SummaryCard } from "../components/SummaryCard";
import { formatDateLabel } from "../utils/formatters";

function buildRelatedLabel(item, mockData) {
  if (item.relatedDocumentId) {
    const document = mockData.documents.find((entry) => entry.id === item.relatedDocumentId);
    return document ? `${document.type} · ${document.relatedSection}` : item.relatedReturnSection;
  }

  return item.relatedReturnSection || "Return overview";
}

function formatAnswer(value) {
  if (value === "yes") {
    return "Yes";
  }
  if (value === "no") {
    return "No";
  }
  return value;
}

export function ClientHomePage() {
  const {
    activeClient,
    activeReturn,
    mockData,
    intakeSummariesByClientId,
    saveSurveyAnswers,
    saveSurveyProgress,
    submitSurvey,
    addManualChecklistItem,
    markSurveyAnswerForClarification,
    hasPermission
  } = useAppContext();
  const navigate = useNavigate();
  const [expandedActivity, setExpandedActivity] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const [submissionNotice, setSubmissionNotice] = useState("");
  const [manualItemDraft, setManualItemDraft] = useState("");

  const surveyState = intakeSummariesByClientId[activeClient.id];

  useEffect(() => {
    setSurveyStep(surveyState?.currentSectionIndex ?? 0);
  }, [activeClient.id, surveyState?.currentSectionIndex]);

  const workflowItems = useMemo(() => {
    const visibilityOrder = {
      "Needs Review": 0,
      Waiting: 1,
      "In Progress": 2,
      "Not Started": 3,
      Completed: 4
    };

    return mockData.workflowItems
      .filter((item) => item.clientId === activeClient.id && (hasPermission("viewOwnWorkspace") ? item.visibility !== "Internal" : true))
      .sort((a, b) => {
        const aRank = visibilityOrder[a.status] ?? 9;
        const bRank = visibilityOrder[b.status] ?? 9;
        if (aRank !== bRank) {
          return aRank - bRank;
        }
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      });
  }, [activeClient.id, hasPermission, mockData.workflowItems]);

  const nextWorkflowItem = workflowItems.find((item) => item.status !== "Completed") ?? workflowItems[0];
  const openItems = workflowItems.filter((item) => item.status !== "Completed");
  const completedCount = workflowItems.length - openItems.length;

  const contextualMessages = mockData.messages
    .filter((message) => message.clientId === activeClient.id && message.channel === "Client")
    .map((message) => {
      const relatedItem = workflowItems.find(
        (item) => item.relatedEntityId === message.linkedTo || item.relatedDocumentId === message.linkedTo
      );
      return {
        ...message,
        relatedItemLabel: relatedItem?.title ?? buildRelatedLabel({ relatedDocumentId: null, relatedReturnSection: activeReturn.sections?.[0] }, mockData)
      };
    });

  const activityItems = (mockData.clientActivity[activeClient.id] ?? [
    { id: "fallback-activity", title: "Return status updated", detail: activeReturn.stageNote, time: "Today" }
  ]);
  const visibleActivity = expandedActivity ? activityItems : activityItems.slice(0, 3);

  const surveyCompleted = Boolean(surveyState?.submittedAt);
  const completedSections = surveyState?.completedSections ?? 0;
  const totalSections = surveyState?.totalSections ?? clientSurveySections.length;
  const surveyActionLabel = surveyCompleted
    ? "Review answers"
    : completedSections > 0
      ? "Continue survey"
      : "Start survey";
  const surveyPrimaryStatus = surveyCompleted ? "Checklist generated" : `${completedSections} of ${totalSections} sections completed`;
  const isReviewStep = surveyStep >= clientSurveySections.length;
  const currentSection = clientSurveySections[Math.min(surveyStep, clientSurveySections.length - 1)];
  const visibleQuestions = currentSection ? getVisibleQuestions(currentSection, surveyState?.answers ?? {}) : [];

  const openRelatedItem = (item) => {
    if (item.actionType === "answer" || item.type === "questionnaire" || item.source === "survey" || item.source === "manual") {
      setSurveyOpen(true);
      setSurveyStep(Math.max(0, surveyState?.currentSectionIndex ?? 0));
      return;
    }

    if (item.relatedDocumentId || item.actionType === "upload") {
      navigate("/documents");
      return;
    }

    navigate("/return-workspace");
  };

  const handleAnswerChange = (questionId, value) => {
    saveSurveyAnswers(activeClient.id, { [questionId]: value });
  };

  const handleNext = () => {
    const nextStep = Math.min(surveyStep + 1, clientSurveySections.length);
    setSurveyStep(nextStep);
    saveSurveyProgress(activeClient.id, nextStep);
  };

  const handleBack = () => {
    const previousStep = Math.max(surveyStep - 1, 0);
    setSurveyStep(previousStep);
    saveSurveyProgress(activeClient.id, previousStep);
  };

  const handleSubmitSurvey = () => {
    submitSurvey(activeClient.id);
    setSubmissionNotice("Checklist generated. The client checklist and intake summary are now updated.");
    setSurveyOpen(false);
  };

  const intakeHighlights = surveyState?.summary ?? [];
  const intakeRequirements = surveyState?.requirements ?? [];
  const answeredQuestions = surveyState?.answeredQuestions ?? [];

  return (
    <div className="page-grid">
      <section className="summary-row client-workspace-overview">
        <SummaryCard label="Client" value={activeClient.name} meta={`${activeReturn.form} · Tax Year ${activeReturn.taxYear}`} tone="accent" />
        <SummaryCard label="Return Status" value={activeReturn.status} meta={`Next-action owner: ${activeReturn.owner}`} />
        <SummaryCard label="Progress" value={`${activeClient.progress}%`} meta={`${completedCount} completed · ${openItems.length} still active`} />
        <SummaryCard label="Upcoming Deadline" value={formatDateLabel(activeReturn.dueDate)} meta={activeReturn.stageNote} />
      </section>

      <section className="panel survey-entry-card">
        <div>
          <p className="eyebrow">Client intake survey</p>
          <h3>Tell us what changed this year</h3>
          <p className="muted">Answer a few questions so we can build your personalized tax checklist.</p>
        </div>
        <div className="survey-entry-actions">
          <div className="client-next-step panel inset-panel">
            <span className="eyebrow">Survey progress</span>
            <strong>{surveyPrimaryStatus}</strong>
            <p className="muted">{completedSections} of {totalSections} sections completed</p>
          </div>
          <div className="inline-actions">
            <button
              className="button"
              onClick={() => {
                setSurveyOpen(true);
                setSurveyStep(surveyCompleted ? clientSurveySections.length : surveyState?.currentSectionIndex ?? 0);
              }}
            >
              {surveyCompleted ? "Review answers" : surveyActionLabel}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setSurveyOpen(true);
                setSurveyStep(clientSurveySections.length);
              }}
            >
              {surveyCompleted ? "Checklist generated" : "Review answers"}
            </button>
          </div>
        </div>
      </section>

      {surveyOpen ? (
        <section className="panel survey-panel">
          <div className="section-heading">
            <div>
              <h3>{isReviewStep ? "Review your answers" : currentSection.title}</h3>
              <p className="muted">{isReviewStep ? "Check your answers before submitting the survey." : currentSection.description}</p>
            </div>
            <span className="tag neutral">{Math.min(surveyStep + 1, clientSurveySections.length)} of {clientSurveySections.length}</span>
          </div>

          {!isReviewStep ? (
            <div className="survey-question-list">
              {visibleQuestions.map((question) => (
                <article key={question.id} className="survey-question-card">
                  <div className="survey-question-copy">
                    <strong>{question.label}</strong>
                  </div>

                  {question.type === "yes-no" ? (
                    <div className="segmented-control">
                      {["yes", "no"].map((option) => (
                        <button
                          key={option}
                          className={`segment ${surveyState?.answers?.[question.id] === option ? "active" : ""}`}
                          onClick={() => handleAnswerChange(question.id, option)}
                        >
                          {option === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      className="filter-select"
                      value={surveyState?.answers?.[question.id] ?? ""}
                      onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                    >
                      <option value="">Select one</option>
                      {question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="survey-review-grid">
              <article className="panel inset-panel">
                <div className="section-heading">
                  <h4>Your answers</h4>
                </div>
                <ul className="compact-list">
                  {answeredQuestions.map((item) => (
                    <li key={item.questionId}>
                      <strong>{item.questionLabel}</strong>
                      <p>{formatAnswer(item.value)}</p>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="panel inset-panel">
                <div className="section-heading">
                  <h4>Checklist preview</h4>
                </div>
                <ul className="compact-list">
                  {intakeRequirements.map((item) => (
                    <li key={item}>
                      <strong>{item}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          )}

          <div className="survey-footer">
            <div className="inline-actions">
              <button className="button ghost" onClick={() => setSurveyOpen(false)}>Save and continue later</button>
              <button className="button ghost" onClick={handleBack} disabled={surveyStep === 0}>Back</button>
            </div>
            <div className="inline-actions">
              {!isReviewStep ? (
                <button className="button" onClick={handleNext}>Next</button>
              ) : (
                <button className="button" onClick={handleSubmitSurvey}>Submit survey</button>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {submissionNotice ? <p className="action-confirmation">{submissionNotice}</p> : null}

      <section className="panel client-workspace-banner">
        <div>
          <p className="eyebrow">Client Workspace</p>
          <h2>{activeReturn.nextAction}</h2>
          <p className="muted">Tasks, document requests, survey follow-up, and messages are all connected to the same return workflow here.</p>
        </div>
        <div className="client-next-step panel inset-panel">
          <span className="eyebrow">Next required action</span>
          <strong>{nextWorkflowItem?.title ?? activeReturn.nextAction}</strong>
          <p className="muted">Owner: {nextWorkflowItem?.owner ?? activeReturn.owner} · Due {formatDateLabel(nextWorkflowItem?.dueDate ?? activeReturn.dueDate)}</p>
        </div>
      </section>

      {hasPermission("viewFirmDashboard") || hasPermission("reviewDocuments") || hasPermission("manageUsers") ? (
        <section className="panel intake-summary-panel">
          <div className="section-heading">
            <div>
              <h3>Client Intake Summary</h3>
              <p className="muted">Compact intake context for the firm side of the workflow.</p>
            </div>
            <span className="tag review">{surveyCompleted ? "Checklist generated" : "Survey in progress"}</span>
          </div>

          <div className="two-column-grid">
            <article className="panel inset-panel">
              <div className="section-heading">
                <h4>Client reported</h4>
              </div>
              <ul className="compact-list">
                {intakeHighlights.length ? (
                  intakeHighlights.map((item) => (
                    <li key={item}>
                      <strong>{item}</strong>
                    </li>
                  ))
                ) : (
                  <li>
                    <strong>No submitted survey yet</strong>
                    <p>The client has not finished the intake questions.</p>
                  </li>
                )}
              </ul>
            </article>

            <article className="panel inset-panel">
              <div className="section-heading">
                <h4>Generated requirements</h4>
              </div>
              <ul className="compact-list">
                {intakeRequirements.length ? (
                  intakeRequirements.map((item) => (
                    <li key={item}>
                      <strong>{item}</strong>
                    </li>
                  ))
                ) : (
                  <li>
                    <strong>No generated requirements yet</strong>
                    <p>Submit the survey to create a personalized checklist.</p>
                  </li>
                )}
              </ul>
            </article>
          </div>

          <div className="two-column-grid">
            <article className="panel inset-panel">
              <div className="section-heading">
                <h4>Review answers</h4>
              </div>
              <ul className="compact-list">
                {answeredQuestions.slice(0, 6).map((item) => (
                  <li key={item.questionId}>
                    <div className="list-title-row">
                      <strong>{item.questionLabel}</strong>
                      <button className="text-link" onClick={() => markSurveyAnswerForClarification(activeClient.id, item.questionId)}>
                        Mark for clarification
                      </button>
                    </div>
                    <p>{formatAnswer(item.value)}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel inset-panel">
              <div className="section-heading">
                <h4>Add manual checklist item</h4>
              </div>
              <label className="form-field">
                <span className="context-label">Manual follow-up</span>
                <input value={manualItemDraft} onChange={(event) => setManualItemDraft(event.target.value)} placeholder="Example: Upload tuition statement" />
              </label>
              <div className="inline-actions">
                <button
                  className="button secondary"
                  disabled={!manualItemDraft.trim()}
                  onClick={() => {
                    addManualChecklistItem(activeClient.id, manualItemDraft.trim());
                    setManualItemDraft("");
                  }}
                >
                  Add item
                </button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="client-workspace-grid">
        <article className="panel client-workspace-primary">
          <div className="section-heading">
            <div>
              <h3>Action Checklist</h3>
              <p className="muted">Survey-generated requirements, document requests, and workflow actions all land in one list.</p>
            </div>
            <span className="tag neutral">{openItems.length} active</span>
          </div>

          <ul className="workflow-list">
            {workflowItems.map((item) => (
              <li key={item.id} className={`workflow-item ${item.status === "Completed" ? "completed" : ""}`}>
                <div className="workflow-item-main">
                  <div className="list-title-row">
                    <strong>{item.title}</strong>
                    <StatusChip value={item.status} />
                  </div>
                  <p>{item.description}</p>
                  <div className="workflow-meta">
                    <span>Owner: {item.owner}</span>
                    <span>Due: {formatDateLabel(item.dueDate)}</span>
                    <span>Related: {buildRelatedLabel(item, mockData)}</span>
                  </div>
                </div>
                {item.actionLabel ? (
                  <button className="button secondary" onClick={() => openRelatedItem(item)}>
                    {item.actionLabel}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="panel client-workspace-secondary">
          <div className="section-heading">
            <div>
              <h3>Communication</h3>
              <p className="muted">Messages stay tied to the same work items shown in the checklist.</p>
            </div>
            <span className="tag success">{contextualMessages.length} threads</span>
          </div>

          <ul className="message-list">
            {contextualMessages.map((message) => (
              <li key={message.id}>
                <div className="list-title-row">
                  <strong>{message.author}</strong>
                  <span className="meta-text">{message.date}</span>
                </div>
                <p>{message.excerpt}</p>
                <div className="workflow-meta">
                  <span>Related item: {message.relatedItemLabel}</span>
                </div>
                <input
                  className="reply-input"
                  type="text"
                  value={replyDrafts[message.id] ?? ""}
                  onChange={(event) => setReplyDrafts((current) => ({ ...current, [message.id]: event.target.value }))}
                  placeholder={`Reply about ${message.relatedItemLabel.toLowerCase()}`}
                />
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Recent Activity</h3>
            <p className="muted">The timeline stays short by default so completed work does not dominate the screen.</p>
          </div>
          {activityItems.length > 3 ? (
            <button className="text-link" onClick={() => setExpandedActivity((value) => !value)}>
              {expandedActivity ? "Show less" : "Show all"}
            </button>
          ) : null}
        </div>
        <ul className="timeline-list">
          {visibleActivity.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <span className="meta-text">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
