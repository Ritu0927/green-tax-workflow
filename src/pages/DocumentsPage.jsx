import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { SecurityBadge } from "../components/SecurityBadge";
import { StatusChip } from "../components/StatusChip";
import { formatDateLabel } from "../utils/formatters";

const ATTENTION_FILTERS = ["Needs Review", "Missing Information", "Failed", "Ready to Use", "All Documents"];

function getConfidenceLevel(confidence) {
  if (confidence >= 0.9) {
    return "High";
  }
  if (confidence >= 0.8) {
    return "Medium";
  }
  return "Low";
}

function getDocumentStorageKey(clientId) {
  return `green-ledger-selected-document-${clientId}`;
}

function normalizeSearchValue(value) {
  return (value ?? "").trim().toLowerCase();
}

function isUnresolvedAlertStatus(status) {
  return ["Open", "In Review", "Waiting on Client", "Escalated"].includes(status);
}

function isResolvedAlertStatus(status) {
  return ["Resolved"].includes(status);
}

function isUnresolvedFieldStatus(status) {
  return ["Unreviewed", "Needs Review", "Corrected"].includes(status);
}

function getDocumentViewState(document, analysis, linkedWorkflowItems) {
  const unresolvedAlerts = (analysis?.insights ?? []).filter((alert) => isUnresolvedAlertStatus(alert.reviewStatus));
  const unresolvedFields = (analysis?.extractedFields ?? []).filter((field) => isUnresolvedFieldStatus(field.reviewStatus));
  const waitingItems = linkedWorkflowItems.filter((item) => item.visibility === "Client" && ["Not Started", "In Progress", "Waiting", "Submitted"].includes(item.status));
  const status = document.processingStatus;

  if (status === "Failed") {
    return {
      attentionGroup: "Failed",
      openAlertCount: unresolvedAlerts.length || 1,
      unresolvedAlerts,
      unresolvedFields
    };
  }

  if (unresolvedAlerts.some((alert) => alert.reviewStatus === "Waiting on Client") || waitingItems.length) {
    return {
      attentionGroup: "Missing Information",
      openAlertCount: unresolvedAlerts.length,
      unresolvedAlerts,
      unresolvedFields
    };
  }

  if (status === "Needs Review" || unresolvedAlerts.length || unresolvedFields.length) {
    return {
      attentionGroup: "Needs Review",
      openAlertCount: unresolvedAlerts.length,
      unresolvedAlerts,
      unresolvedFields
    };
  }

  if (status === "Verified" || status === "Analyzed") {
    return {
      attentionGroup: "Ready to Use",
      openAlertCount: 0,
      unresolvedAlerts,
      unresolvedFields
    };
  }

  return {
    attentionGroup: "All Documents",
    openAlertCount: unresolvedAlerts.length,
    unresolvedAlerts,
    unresolvedFields
  };
}

function getSelectedPreviewLocation(document, analysis, selectedFieldName, selectedAlertId) {
  if (selectedFieldName) {
    return analysis?.extractedFields?.find((field) => field.name === selectedFieldName)?.sourceLocation ?? "Page 1";
  }

  if (selectedAlertId) {
    const alert = analysis?.insights?.find((item) => item.id === selectedAlertId);
    if (!alert) {
      return "Page 1";
    }
    const relatedField = analysis?.extractedFields?.find((field) => field.label === alert.relatedField);
    return relatedField?.sourceLocation ?? "Page 1";
  }

  return `Page ${Math.max(document?.pageCount ? 1 : 0, 1)}`;
}

export function DocumentsPage() {
  const {
    activeClient,
    activeReturn,
    mockData,
    setActiveClientId,
    setActiveReturnId,
    documentAnalyses,
    analysisStatusByDocumentId,
    batchAnalysisState,
    generatedRequestDrafts,
    documentFocusContext,
    clearDocumentFocusContext,
    runDocumentAnalysis,
    runBatchDocumentAnalysis,
    verifyDocumentField,
    correctDocumentField,
    createInformationRequestDraft,
    confirmInformationRequest,
    escalateDocumentAlert,
    getNextDocumentException,
    hasPermission
  } = useAppContext();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [attentionFilter, setAttentionFilter] = useState(null);
  const [hasInitializedAttentionFilter, setHasInitializedAttentionFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selectedFieldName, setSelectedFieldName] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [batchSummary, setBatchSummary] = useState(null);
  const [exceptionProgress, setExceptionProgress] = useState(null);
  const [correctionState, setCorrectionState] = useState(null);
  const [requestDraftState, setRequestDraftState] = useState(null);
  const [escalationState, setEscalationState] = useState(null);

  const canRunAnalysis = hasPermission("respondToAiInsights") || hasPermission("reviewDocuments");
  const canReviewDocuments = canRunAnalysis || hasPermission("editReturnValues");
  const isFirmView = hasPermission("viewDocuments") || canReviewDocuments;
  const showFirmReviewPanels = isFirmView;

  const allClientDocuments = useMemo(
    () => mockData.documents.filter((item) => item.clientId === activeClient.id),
    [activeClient.id, mockData.documents]
  );

  const linkedWorkflowItemsByDocumentId = useMemo(() => {
    return allClientDocuments.reduce((accumulator, document) => {
      accumulator[document.id] = mockData.workflowItems.filter(
        (item) =>
          item.clientId === activeClient.id &&
          (item.relatedDocumentId === document.id || item.relatedEntityId === document.id)
      );
      return accumulator;
    }, {});
  }, [activeClient.id, allClientDocuments, mockData.workflowItems]);

  const documentSummaries = useMemo(() => {
    return allClientDocuments.map((document) => {
      const analysis = documentAnalyses[document.id];
      const documentStatus = analysisStatusByDocumentId[document.id] ?? document.processingStatus;
      const linkedItems = linkedWorkflowItemsByDocumentId[document.id] ?? [];
      const viewState = getDocumentViewState({ ...document, processingStatus: documentStatus }, analysis, linkedItems);
      return {
        ...document,
        processingStatus: documentStatus,
        analysis,
        issuer: analysis?.issuer ?? document.label,
        openAlertCount: viewState.openAlertCount,
        unresolvedAlerts: viewState.unresolvedAlerts,
        unresolvedFields: viewState.unresolvedFields,
        attentionGroup: viewState.attentionGroup,
        linkedWorkflowItems: linkedItems
      };
    });
  }, [allClientDocuments, analysisStatusByDocumentId, documentAnalyses, linkedWorkflowItemsByDocumentId]);

  const overviewCounts = useMemo(() => {
    const total = documentSummaries.length;
    const ready = documentSummaries.filter((document) => document.attentionGroup === "Ready to Use").length;
    const needsReview = documentSummaries.filter((document) => document.attentionGroup === "Needs Review").length;
    const missingInformation = documentSummaries.filter((document) => document.attentionGroup === "Missing Information").length;
    const failed = documentSummaries.filter((document) => document.attentionGroup === "Failed").length;
    return {
      total,
      ready,
      needsReview,
      missingInformation,
      failed
    };
  }, [documentSummaries]);

  useEffect(() => {
    if (hasInitializedAttentionFilter) {
      return;
    }

    setAttentionFilter(overviewCounts.needsReview ? "Needs Review" : "All Documents");
    setHasInitializedAttentionFilter(true);
  }, [hasInitializedAttentionFilter, overviewCounts.needsReview]);

  useEffect(() => {
    if (!documentFocusContext) {
      return;
    }

    if (documentFocusContext.clientId && documentFocusContext.clientId !== activeClient.id) {
      setActiveClientId(documentFocusContext.clientId);
    }

    if (documentFocusContext.returnId && documentFocusContext.returnId !== activeReturn.id) {
      setActiveReturnId(documentFocusContext.returnId);
    }

    if (documentFocusContext.documentId) {
      setSelectedDocumentId(documentFocusContext.documentId);
      setSelectedDocumentIds([documentFocusContext.documentId]);
    }

    setSelectedAlertId(documentFocusContext.alertId ?? null);
    setSelectedFieldName(documentFocusContext.fieldName ?? null);
    clearDocumentFocusContext();
  }, [activeClient.id, activeReturn.id, clearDocumentFocusContext, documentFocusContext, setActiveClientId, setActiveReturnId]);

  const documents = useMemo(() => {
    const query = normalizeSearchValue(search);

    return documentSummaries.filter((document) => {
      const matchesSearch =
        !query ||
        document.label.toLowerCase().includes(query) ||
        document.documentType.toLowerCase().includes(query) ||
        document.category.toLowerCase().includes(query) ||
        document.relatedSection.toLowerCase().includes(query) ||
        (document.issuer ?? "").toLowerCase().includes(query);
      const matchesAttention = attentionFilter === "All Documents" || attentionFilter === null || document.attentionGroup === attentionFilter;
      const matchesCategory = categoryFilter === "All" || document.category === categoryFilter;
      const matchesStatus =
        statusFilter === "All statuses" ||
        document.processingStatus === statusFilter ||
        document.verification === statusFilter;

      return matchesSearch && matchesAttention && matchesCategory && matchesStatus;
    });
  }, [attentionFilter, categoryFilter, documentSummaries, search, statusFilter]);

  useEffect(() => {
    const stored = window.localStorage.getItem(getDocumentStorageKey(activeClient.id));
    const firstAvailable = documents[0]?.id ?? null;
    if (stored && documents.some((document) => document.id === stored)) {
      setSelectedDocumentId(stored);
      return;
    }
    setSelectedDocumentId(firstAvailable);
  }, [activeClient.id, documents]);

  useEffect(() => {
    if (selectedDocumentId) {
      window.localStorage.setItem(getDocumentStorageKey(activeClient.id), selectedDocumentId);
    }
  }, [activeClient.id, selectedDocumentId]);

  useEffect(() => {
    setSelectedDocumentIds((current) => current.filter((id) => documents.some((document) => document.id === id)));
  }, [documents]);

  useEffect(() => {
    const closePanels = (event) => {
      if (event.key === "Escape") {
        setCorrectionState(null);
        setRequestDraftState(null);
        setEscalationState(null);
      }
    };

    window.addEventListener("keydown", closePanels);
    return () => window.removeEventListener("keydown", closePanels);
  }, []);

  const selectedDocument = documents.find((item) => item.id === selectedDocumentId) ?? null;
  const multiSelectActive = selectedDocumentIds.length > 1;
  const activeDocument = multiSelectActive ? null : selectedDocument;
  const activeAnalysis = activeDocument?.analysis ?? null;
  const unresolvedAlerts = activeDocument?.unresolvedAlerts ?? [];
  const resolvedAlerts = (activeAnalysis?.insights ?? []).filter((alert) => isResolvedAlertStatus(alert.reviewStatus));
  const linkedWork = activeDocument
    ? activeDocument.linkedWorkflowItems.filter((item) => (isFirmView ? true : item.visibility === "Client"))
    : [];
  const activeDraft = requestDraftState
    ? generatedRequestDrafts.find((draft) => draft.id === requestDraftState.draftId)
    : null;
  const selectedField = selectedFieldName
    ? activeAnalysis?.extractedFields?.find((field) => field.name === selectedFieldName) ?? null
    : null;
  const selectedAlert = selectedAlertId
    ? activeAnalysis?.insights?.find((alert) => alert.id === selectedAlertId) ?? null
    : null;
  const previewLocation = getSelectedPreviewLocation(activeDocument, activeAnalysis, selectedFieldName, selectedAlertId);
  const allVisibleSelected = documents.length > 0 && documents.every((document) => selectedDocumentIds.includes(document.id));
  const selectedDocuments = documents.filter((document) => selectedDocumentIds.includes(document.id));
  const analyzableSelected = selectedDocuments.filter((document) => document.processingStatus !== "Verified");
  const batchProgressText = batchAnalysisState.isRunning
    ? `Analyzing ${Math.min(batchAnalysisState.completed + 1, batchAnalysisState.total)} of ${batchAnalysisState.total} documents`
    : "";

  const openDocument = (documentId) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentIds((current) => (current.length > 1 ? [documentId] : current));
    setSelectedFieldName(null);
    setSelectedAlertId(null);
    setCorrectionState(null);
    setRequestDraftState(null);
    setEscalationState(null);
    setPreviewPage(1);
  };

  const toggleSelectedDocument = (documentId) => {
    setSelectedDocumentIds((current) => (
      current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId]
    ));
  };

  const clearSelection = () => {
    setSelectedDocumentIds([]);
    setBatchSummary(null);
  };

  const selectAllVisible = () => {
    setSelectedDocumentIds(documents.map((document) => document.id));
  };

  const handleSelectField = (fieldName) => {
    setSelectedFieldName(fieldName);
    const nextField = activeAnalysis?.extractedFields?.find((field) => field.name === fieldName);
    const relatedAlert = unresolvedAlerts.find((alert) => alert.relatedField === nextField?.label);
    setSelectedAlertId(relatedAlert?.id ?? null);
  };

  const handleSelectAlert = (alertId) => {
    setSelectedAlertId(alertId);
    const alert = activeAnalysis?.insights?.find((item) => item.id === alertId);
    const relatedField = activeAnalysis?.extractedFields?.find((field) => field.label === alert?.relatedField);
    setSelectedFieldName(relatedField?.name ?? null);
  };

  const handleAnalyzeSelected = async () => {
    if (!selectedDocumentIds.length || !canRunAnalysis || !analyzableSelected.length) {
      return;
    }

    const results = await runBatchDocumentAnalysis(selectedDocumentIds);
    const summary = {
      processed: results.length,
      ready: results.filter((result) => !result.insights.length).length,
      review: results.filter((result) => result.insights.length).length,
      failed: selectedDocuments.filter((document) => document.processingStatus === "Failed").length
    };
    setBatchSummary(summary);
    setNotice(summary.review ? "Review exceptions" : "Analysis complete.");
  };

  const handleVerifyField = async (fieldName) => {
    if (!activeDocument) {
      return;
    }

    await verifyDocumentField(activeDocument.id, fieldName, { id: "session-user", name: activeClient.preparer ?? "Noah Patel" });
    setNotice("Field verified.");
    setCorrectionState(null);
    const next = getNextDocumentException(activeDocument.id, selectedAlertId);
    if (next) {
      setExceptionProgress(`${Math.max(next.position - 1, 0)} of ${next.totalUnresolved} exceptions resolved`);
    } else {
      setExceptionProgress("All document exceptions are resolved.");
    }
  };

  const handleSaveCorrection = async () => {
    if (!activeDocument || !correctionState) {
      return;
    }

    if (!correctionState.value?.trim() || !correctionState.reason?.trim()) {
      setCorrectionState((current) => ({ ...current, error: "Corrected value and reason are required." }));
      return;
    }

    await correctDocumentField(
      activeDocument.id,
      correctionState.fieldName,
      correctionState.value,
      correctionState.reason,
      { id: "session-user", name: activeClient.preparer ?? "Noah Patel" }
    );

    setCorrectionState(null);
    setNotice("Extraction corrected.");
    const next = getNextDocumentException(activeDocument.id, selectedAlertId);
    if (next) {
      setExceptionProgress(`${Math.max(next.position - 1, 0)} of ${next.totalUnresolved} exceptions resolved`);
    }
  };

  const handleCreateRequestDraft = async (alertId) => {
    const draft = await createInformationRequestDraft(alertId, { id: "session-user", name: activeClient.preparer ?? "Noah Patel" });
    if (!draft) {
      return;
    }

    setRequestDraftState({
      draftId: draft.id,
      message: draft.message,
      dueDate: draft.dueDate,
      error: ""
    });
  };

  const handleConfirmRequest = async () => {
    if (!requestDraftState) {
      return;
    }

    if (!requestDraftState.message?.trim() || !requestDraftState.dueDate?.trim()) {
      setRequestDraftState((current) => ({ ...current, error: "Message and due date are required." }));
      return;
    }

    const result = await confirmInformationRequest(
      requestDraftState.draftId,
      requestDraftState.message,
      requestDraftState.dueDate,
      { id: "session-user", name: activeClient.preparer ?? "Noah Patel" }
    );

    if (result?.error) {
      setRequestDraftState((current) => ({ ...current, error: result.error }));
      return;
    }

    setRequestDraftState(null);
    setNotice("Request created.");
    const next = getNextDocumentException(activeDocument?.id ?? null, selectedAlertId);
    if (next) {
      setExceptionProgress(`${Math.max(next.position - 1, 0)} of ${next.totalUnresolved} exceptions resolved`);
    }
  };

  const handleEscalateAlert = async () => {
    if (!escalationState?.alertId) {
      return;
    }

    if (!escalationState.note?.trim()) {
      setEscalationState((current) => ({ ...current, error: "Escalation note is required." }));
      return;
    }

    const result = await escalateDocumentAlert(escalationState.alertId, escalationState.note, {
      id: "session-user",
      name: activeClient.preparer ?? "Noah Patel"
    });

    if (result?.error) {
      setEscalationState((current) => ({ ...current, error: result.error }));
      return;
    }

    setEscalationState(null);
    setNotice("Alert escalated.");
    const next = getNextDocumentException(activeDocument?.id ?? null, escalationState.alertId);
    if (next) {
      setExceptionProgress(`${Math.max(next.position - 1, 0)} of ${next.totalUnresolved} exceptions resolved`);
    }
  };

  const handleReviewNextException = () => {
    const next = getNextDocumentException(activeDocument?.id ?? null, selectedAlertId);
    if (!next) {
      setExceptionProgress("All document exceptions are resolved.");
      return;
    }

    setSelectedDocumentId(next.documentId);
    setSelectedDocumentIds([next.documentId]);
    setSelectedAlertId(next.alertId ?? null);
    setSelectedFieldName(next.fieldName ?? null);
    setCorrectionState(null);
    setRequestDraftState(null);
    setEscalationState(null);
    setExceptionProgress(`${Math.max(next.position - 1, 0)} of ${next.totalUnresolved} exceptions resolved`);
  };

  return (
    <div className="page-grid">
      <section className="panel documents-header-panel">
        <div className="section-heading">
          <div>
            <h2>Documents</h2>
            <p className="muted">Review uploaded evidence, resolve exceptions, and connect verified values to the return.</p>
          </div>
          <div className="documents-header-meta">
            <SecurityBadge label={isFirmView ? "Firm view" : "Client view masked"} tone="neutral" />
            <p className="meta-text">AI-assisted results require professional review.</p>
          </div>
        </div>

        <div className="documents-overview-grid">
          <button className={`detail-card documents-overview-card ${attentionFilter === "All Documents" ? "active" : ""}`} onClick={() => setAttentionFilter("All Documents")}>
            <span className="eyebrow">Total Documents</span>
            <strong>{overviewCounts.total}</strong>
            <p className="muted">All uploaded evidence for this return.</p>
          </button>
          <button className={`detail-card documents-overview-card ${attentionFilter === "Ready to Use" ? "active" : ""}`} onClick={() => setAttentionFilter("Ready to Use")}>
            <span className="eyebrow">Ready to Use</span>
            <strong>{overviewCounts.ready}</strong>
            <p className="muted">Reviewed or ready for verification.</p>
          </button>
          <button className={`detail-card documents-overview-card ${attentionFilter === "Needs Review" ? "active" : ""}`} onClick={() => setAttentionFilter("Needs Review")}>
            <span className="eyebrow">Needs Review</span>
            <strong>{overviewCounts.needsReview}</strong>
            <p className="muted">Exceptions still require attention.</p>
          </button>
          <button className={`detail-card documents-overview-card ${attentionFilter === "Missing Information" ? "active" : ""}`} onClick={() => setAttentionFilter("Missing Information")}>
            <span className="eyebrow">Missing Information</span>
            <strong>{overviewCounts.missingInformation}</strong>
            <p className="muted">Client follow-up or evidence is missing.</p>
          </button>
          <button className={`detail-card documents-overview-card ${attentionFilter === "Failed" ? "active" : ""}`} onClick={() => setAttentionFilter("Failed")}>
            <span className="eyebrow">Failed</span>
            <strong>{overviewCounts.failed}</strong>
            <p className="muted">Requires manual handling before use.</p>
          </button>
        </div>

        <div className="controls-row documents-controls-row">
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by document, type, category, issuer, or return section"
            aria-label="Search documents"
          />
          <select className="filter-select" value={attentionFilter ?? "Needs Review"} onChange={(event) => setAttentionFilter(event.target.value)} aria-label="Filter by attention status">
            {ATTENTION_FILTERS.map((option) => <option key={option}>{option}</option>)}
          </select>
          <select className="filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category">
            <option>All</option>
            <option>Income</option>
            <option>Investments</option>
            <option>Deductions</option>
            <option>Credits</option>
            <option>Identity</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by processing status">
            <option>All statuses</option>
            <option>Uploaded</option>
            <option>Processing</option>
            <option>Analyzed</option>
            <option>Needs Review</option>
            <option>Verified</option>
            <option>Failed</option>
          </select>
        </div>

        {notice ? <p className="meta-text documents-notice">{notice}</p> : null}
      </section>

      <section className="workspace-layout documents-layout">
        <article className="panel workspace-side documents-side-panel">
          <div className="section-heading">
            <div>
              <h3>Document list</h3>
              <p className="muted">{documents.length} visible documents</p>
            </div>
            <button className="text-link" onClick={allVisibleSelected ? clearSelection : selectAllVisible}>
              {allVisibleSelected ? "Clear all" : "Select all visible"}
            </button>
          </div>

          {selectedDocumentIds.length ? (
            <div className="panel inset-panel batch-toolbar" role="region" aria-label="Selected documents actions">
              <div>
                <strong>{selectedDocumentIds.length} documents selected</strong>
                {batchProgressText ? <p className="meta-text">{batchProgressText}</p> : null}
                {batchSummary ? (
                  <p className="meta-text">
                    {batchSummary.processed} documents processed · {batchSummary.ready} ready to use · {batchSummary.review} need review · {batchSummary.failed} failed
                  </p>
                ) : null}
                {!batchProgressText && selectedDocumentIds.length && analyzableSelected.length !== selectedDocumentIds.length ? (
                  <p className="meta-text">Verified documents are preserved unless reanalyzed individually.</p>
                ) : null}
              </div>
              <div className="inline-actions">
                {canRunAnalysis ? (
                  <button
                    className="button secondary"
                    onClick={handleAnalyzeSelected}
                    disabled={batchAnalysisState.isRunning || !analyzableSelected.length}
                    title={!analyzableSelected.length ? "No selected documents need analysis." : ""}
                  >
                    Analyze selected
                  </button>
                ) : null}
                <button className="button ghost" onClick={clearSelection}>Clear selection</button>
              </div>
            </div>
          ) : null}

          {documents.length ? (
            <div className="field-list document-list" role="listbox" aria-label="Documents">
              {documents.map((document) => {
                const isActive = document.id === selectedDocumentId;
                const isChecked = selectedDocumentIds.includes(document.id);

                return (
                  <div
                    key={document.id}
                    className={`field-item document-list-item ${isActive ? "active" : ""} ${isChecked ? "checked" : ""}`}
                    role="option"
                    tabIndex={0}
                    aria-selected={isActive}
                    onClick={() => openDocument(document.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDocument(document.id);
                      }
                    }}
                  >
                    <div className="document-list-leading">
                      <label className="document-checkbox" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${document.label}`}
                          checked={isChecked}
                          onChange={() => toggleSelectedDocument(document.id)}
                        />
                      </label>
                      <span className="selected-indicator" aria-hidden="true">{isActive ? "Active" : isChecked ? "Selected" : ""}</span>
                    </div>
                    <div className="document-list-copy">
                      <div className="list-title-row">
                        <strong>{document.label}</strong>
                        {document.openAlertCount ? <span className="tag warning">{document.openAlertCount} open</span> : null}
                      </div>
                      <p>{document.documentType} · {document.category}</p>
                      <div className="workflow-meta">
                        <span>{formatDateLabel(document.uploadDate)}</span>
                        <span>{document.relatedSection}</span>
                      </div>
                    </div>
                    <div className="document-list-statuses">
                      <StatusChip value={document.processingStatus} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-note">No documents found for the current filters.</div>
          )}
        </article>

        <article className="panel workspace-main document-center-panel">
          {multiSelectActive ? (
            <div className="empty-note">
              <strong>Review exceptions</strong>
              <p>Select a single document to review extracted fields and alerts.</p>
            </div>
          ) : activeDocument ? (
            <>
              <div className="section-heading">
                <div>
                  <h3>{activeDocument.label}</h3>
                  <p className="muted">{activeDocument.documentType} · {activeDocument.taxYear} · {activeDocument.category}</p>
                </div>
                <div className="inline-tags">
                  <StatusChip value={activeDocument.processingStatus} />
                  <StatusChip value={activeDocument.verification} />
                </div>
              </div>

              <div className="document-header-grid">
                  <div className="workflow-meta document-header-meta">
                    <span>Uploaded: {formatDateLabel(activeDocument.uploadDate)}</span>
                    <span>Pages: {activeDocument.pageCount}</span>
                    <span>Related section: {activeDocument.relatedSection}</span>
                  </div>
                  <p className="meta-text">{showFirmReviewPanels ? activeDocument.analysisSummary : "Your firm uses this document to support the return and request any missing information."}</p>
                </div>

              <div className="preview-surface document-preview-surface">
                <div className="section-heading">
                  <h4>Document Preview</h4>
                  <div className="inline-actions">
                    <button className="button ghost" onClick={() => setPreviewPage((page) => Math.max(1, page - 1))} disabled={previewPage === 1}>
                      Previous
                    </button>
                    <span className="meta-text">Page {previewPage} of {Math.max(activeDocument.pageCount, 1)}</span>
                    <button
                      className="button ghost"
                      onClick={() => setPreviewPage((page) => Math.min(Math.max(activeDocument.pageCount, 1), page + 1))}
                      disabled={previewPage === Math.max(activeDocument.pageCount, 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="preview-page">
                  <div className="preview-document-sheet">
                    <strong>{activeDocument.label}</strong>
                    <span className="meta-text">Focused region: {previewLocation}</span>
                    <div className="preview-document-highlight">
                      <span>{selectedField?.label ?? selectedAlert?.relatedField ?? "Select a field or alert to focus its source location."}</span>
                    </div>
                    <div className="preview-document-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel inset-panel extracted-fields-panel">
                <div className="section-heading">
                  <div>
                    <h4>Extracted fields</h4>
                    <p className="meta-text">Confidence reflects extraction certainty, not tax correctness.</p>
                  </div>
                  {activeAnalysis ? <span className="tag success">Analysis complete</span> : null}
                </div>

                {activeDocument.processingStatus === "Processing" ? (
                  <div className="empty-note">Analysis is currently running for this document.</div>
                ) : activeDocument.processingStatus === "Failed" && !activeAnalysis ? (
                  <div className="empty-note">This document could not be processed and requires manual handling.</div>
                ) : activeAnalysis?.extractedFields?.length ? (
                  <div className="analysis-table">
                    <div className="analysis-table-head">
                      <span>Field</span>
                      <span>Extracted Value</span>
                      {showFirmReviewPanels ? <span>Return Value</span> : null}
                      <span>Source</span>
                      {showFirmReviewPanels ? <span>Confidence</span> : null}
                      <span>Status</span>
                      {showFirmReviewPanels ? <span>Action</span> : null}
                    </div>
                    {activeAnalysis.extractedFields.map((field) => {
                      const canVerifyField = canReviewDocuments && field.reviewStatus !== "Verified";
                      const showCorrectionForm = correctionState?.fieldName === field.name;

                      return (
                        <div key={field.name} className={`analysis-table-row ${selectedFieldName === field.name ? "selected" : ""}`}>
                          <div>
                            <button className="inline-text-link text-link" onClick={() => handleSelectField(field.name)}>
                              {field.label}
                            </button>
                          </div>
                          <div>{field.value}</div>
                          {showFirmReviewPanels ? <div>{field.returnValue ?? "—"}</div> : null}
                          <div>{field.sourceLocation}</div>
                          {showFirmReviewPanels ? <div>{Math.round(field.confidence * 100)}% · {getConfidenceLevel(field.confidence)}</div> : null}
                          <div><StatusChip value={field.reviewStatus} /></div>
                          {showFirmReviewPanels ? (
                            <div className="analysis-row-actions">
                            {canVerifyField ? (
                              <button className="button secondary compact-button" onClick={() => handleVerifyField(field.name)}>
                                Verify field
                              </button>
                            ) : null}
                            {canReviewDocuments && field.reviewStatus !== "Verified" ? (
                              <button
                                className="button ghost compact-button"
                                onClick={() =>
                                  setCorrectionState({
                                    fieldName: field.name,
                                    value: field.value,
                                    reason: "",
                                    originalValue: field.originalValue ?? field.value,
                                    error: ""
                                  })
                                }
                              >
                                Correct extraction
                              </button>
                            ) : null}
                            </div>
                          ) : null}
                          {showCorrectionForm ? (
                            <div className="inline-editor document-action-panel">
                              <div className="form-field">
                                <label>Original value</label>
                                <input type="text" value={correctionState.originalValue} disabled />
                              </div>
                              <div className="form-field">
                                <label>Corrected value</label>
                                <input
                                  type="text"
                                  value={correctionState.value}
                                  onChange={(event) => setCorrectionState((current) => ({ ...current, value: event.target.value, error: "" }))}
                                />
                              </div>
                              <div className="form-field">
                                <label>Correction reason</label>
                                <textarea
                                  rows="3"
                                  value={correctionState.reason}
                                  onChange={(event) => setCorrectionState((current) => ({ ...current, reason: event.target.value, error: "" }))}
                                />
                              </div>
                              {correctionState.error ? <p className="form-error">{correctionState.error}</p> : null}
                              <div className="inline-actions">
                                <button className="button" onClick={handleSaveCorrection}>Save</button>
                                <button className="button ghost" onClick={() => setCorrectionState(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-note">No extracted fields are available for this document.</div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-note">Select a document to review its extracted fields and alerts.</div>
          )}
        </article>

        <article className="workspace-rail documents-rail">
          <div className="panel">
            <div className="section-heading">
              <div>
                <h3>{showFirmReviewPanels ? "Review alerts" : "Document status"}</h3>
                {exceptionProgress ? <p className="meta-text">{exceptionProgress}</p> : null}
              </div>
              {activeDocument ? <span className="tag warning">{showFirmReviewPanels ? "Professional review required" : "Firm review in progress"}</span> : null}
            </div>

            {multiSelectActive ? (
              <div className="empty-note">{showFirmReviewPanels ? "Review alerts are available when one document is selected." : "Document status is available when one document is selected."}</div>
            ) : showFirmReviewPanels && unresolvedAlerts.length ? (
              <ul className="compact-list review-alerts-list">
                {unresolvedAlerts.map((alert) => {
                  const requestDisabled = ["Waiting on Client", "Resolved"].includes(alert.reviewStatus);
                  const escalateDisabled = ["Escalated", "Resolved"].includes(alert.reviewStatus);

                  return (
                    <li key={alert.id} className={selectedAlertId === alert.id ? "selected-alert" : ""}>
                      <div className="list-title-row">
                        <button className="inline-text-link text-link" onClick={() => handleSelectAlert(alert.id)}>
                          {alert.title}
                        </button>
                        <StatusChip value={alert.reviewStatus} />
                      </div>
                      <p>{alert.reason}</p>
                      {alert.supportingEvidence ? <p><strong>Evidence:</strong> {alert.supportingEvidence}</p> : null}
                      <div className="workflow-meta">
                        <span>Severity: {alert.severity}</span>
                        <span>Owner: {alert.owner}</span>
                      </div>
                      <p><strong>Suggested action:</strong> {alert.suggestedAction}</p>
                      {canReviewDocuments ? (
                        <div className="inline-actions">
                          <button
                            className="button secondary compact-button"
                            onClick={() => handleCreateRequestDraft(alert.id)}
                            disabled={requestDisabled}
                            title={requestDisabled ? "A client request is already waiting for a response." : ""}
                          >
                            Request information
                          </button>
                          <button
                            className="button ghost compact-button"
                            onClick={() => setEscalationState({ alertId: alert.id, note: "", error: "" })}
                            disabled={escalateDisabled}
                            title={escalateDisabled ? "This alert is already escalated or resolved." : ""}
                          >
                            Escalate
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : activeDocument ? (
              <div className="empty-note">{showFirmReviewPanels ? "No unresolved review alerts were found for this document." : "This document is available in your return workflow. Your firm will follow up if more information is needed."}</div>
            ) : (
              <div className="empty-note">Select a document to review its current status.</div>
            )}

            {showFirmReviewPanels && resolvedAlerts.length ? (
              <details className="resolved-alerts-toggle">
                <summary>Resolved alerts</summary>
                <ul className="compact-list">
                  {resolvedAlerts.map((alert) => (
                    <li key={alert.id}>
                      <div className="list-title-row">
                        <strong>{alert.title}</strong>
                        <StatusChip value={alert.reviewStatus} />
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {showFirmReviewPanels && activeDraft ? (
              <div className="panel inset-panel document-action-panel top-gap">
                <div className="section-heading">
                  <h4>Draft request</h4>
                  <span className="tag neutral">Not sent</span>
                </div>
                <div className="form-field">
                  <label>Title</label>
                  <input type="text" value={activeDraft.title} disabled />
                </div>
                <div className="form-field">
                  <label>Suggested client message</label>
                  <textarea
                    rows="4"
                    value={requestDraftState.message}
                    onChange={(event) => setRequestDraftState((current) => ({ ...current, message: event.target.value, error: "" }))}
                  />
                </div>
                <div className="form-field">
                  <label>Due date</label>
                  <input
                    type="text"
                    value={requestDraftState.dueDate}
                    onChange={(event) => setRequestDraftState((current) => ({ ...current, dueDate: event.target.value, error: "" }))}
                  />
                </div>
                <div className="workflow-meta">
                  <span>Related document: {activeDocument?.label}</span>
                  <span>Section: {activeDraft.relatedReturnSection}</span>
                  <span>Next owner: {activeDraft.owner}</span>
                </div>
                {requestDraftState.error ? <p className="form-error">{requestDraftState.error}</p> : null}
                <div className="inline-actions">
                  <button className="button" onClick={handleConfirmRequest}>Confirm request</button>
                  <button className="button ghost" onClick={() => setRequestDraftState(null)}>Cancel</button>
                </div>
              </div>
            ) : null}

            {showFirmReviewPanels && escalationState ? (
              <div className="panel inset-panel document-action-panel top-gap">
                <div className="section-heading">
                  <h4>Escalate alert</h4>
                  <span className="tag danger">Reviewer action</span>
                </div>
                <div className="form-field">
                  <label>Escalation note</label>
                  <textarea
                    rows="4"
                    value={escalationState.note}
                    onChange={(event) => setEscalationState((current) => ({ ...current, note: event.target.value, error: "" }))}
                  />
                </div>
                {escalationState.error ? <p className="form-error">{escalationState.error}</p> : null}
                <div className="inline-actions">
                  <button className="button" onClick={handleEscalateAlert}>Escalate</button>
                  <button className="button ghost" onClick={() => setEscalationState(null)}>Cancel</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel">
            <div className="section-heading">
              <h3>Linked work</h3>
              {!multiSelectActive && activeDocument ? <span className="tag review">{linkedWork.length} items</span> : null}
            </div>
            {multiSelectActive ? (
              <div className="empty-note">Linked work is available when one document is selected.</div>
            ) : linkedWork.length ? (
              <ul className="timeline-list compact-timeline">
                {linkedWork.map((item) => (
                  <li key={item.id}>
                    <div className="list-title-row">
                      <strong>{item.title}</strong>
                      <StatusChip value={item.status} />
                    </div>
                    <p>{item.owner} · due {formatDateLabel(item.dueDate)}</p>
                    <div className="workflow-meta">
                      <span>Related section: {item.relatedReturnSection}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-note">No linked work is attached to this document.</div>
            )}
          </div>

          <div className="panel">
            <div className="section-heading">
              <h3>Next action</h3>
              <span className="tag neutral">Exception flow</span>
            </div>
            <div className="stack-list">
              <button className="stack-row interactive" onClick={handleReviewNextException}>
                <div>
                  <strong>Review next exception</strong>
                  <p>Move directly to the next unresolved document issue.</p>
                </div>
              </button>
              {activeDocument ? (
                <>
                  <button
                    className="stack-row interactive"
                    onClick={() => {
                      setActiveClientId(activeClient.id);
                      setActiveReturnId(activeDocument.returnId);
                      navigate("/return-workspace");
                    }}
                  >
                    <div>
                      <strong>Open linked return section</strong>
                      <p>Open the connected tax section for this document.</p>
                    </div>
                  </button>
                  <button className="stack-row interactive" onClick={() => navigate("/client-workspace")}>
                    <div>
                      <strong>Open client workspace</strong>
                      <p>Jump to the related client checklist and follow-up items.</p>
                    </div>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
