import React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { SecurityBadge } from "../components/SecurityBadge";
import { StatusChip } from "../components/StatusChip";
import { formatConfidence, formatDateLabel } from "../utils/formatters";

export function DocumentsPage() {
  const {
    activeClient,
    activeReturn,
    mockData,
    setActiveClientId,
    setActiveReturnId,
    documentAnalyses,
    analysisStatusByDocumentId,
    runDocumentAnalysis,
    hasPermission
  } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const documents = useMemo(() => {
    return mockData.documents.filter((item) => item.clientId === activeClient.id).filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase()) ||
        item.relatedSection.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [activeClient.id, categoryFilter, mockData.documents, search]);

  const [selectedDocumentId, setSelectedDocumentId] = useState(documents[0]?.id ?? null);
  const selectedDocument = documents.find((item) => item.id === selectedDocumentId) ?? documents[0];

  const linkedTasks = mockData.tasks.filter(
    (task) => task.linkedTo === selectedDocument?.id && (hasPermission("viewDocuments") ? true : task.visibility === "Client")
  );
  const analysis = selectedDocument ? documentAnalyses[selectedDocument.id] : null;
  const analysisStatus = selectedDocument ? analysisStatusByDocumentId[selectedDocument.id] : null;
  const isAnalyzing = analysisStatus === "analyzing";
  const canRunAnalysis = hasPermission("respondToAiInsights") || hasPermission("reviewDocuments");
  const canOpenReturnWorkspace = hasPermission("viewAssignedReturns") || hasPermission("reviewDocuments");

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Secure Documents</h3>
            <p className="muted">Documents carry verification state, source-field count, secure access indicators, and links back to the return workspace.</p>
          </div>
          <SecurityBadge label={hasPermission("viewDocuments") ? "Firm view" : "Client view masked"} tone="neutral" />
        </div>

        <div className="controls-row">
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents, categories, or return sections"
          />
          <select className="filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option>All</option>
            {[...new Set(mockData.documents.map((doc) => doc.category))].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="workspace-layout documents-layout">
        <article className="panel workspace-side">
          <div className="section-heading">
            <h3>Document List</h3>
            <span className="tag neutral">{documents.length} items</span>
          </div>
          <div className="field-list">
            {documents.map((doc) => (
              <button
                key={doc.id}
                className={`field-item ${doc.id === selectedDocument?.id ? "active" : ""}`}
                onClick={() => setSelectedDocumentId(doc.id)}
              >
                <div>
                  <strong>{doc.label}</strong>
                  <p>{doc.category} · {doc.relatedSection}</p>
                </div>
                <StatusChip value={doc.verification} />
              </button>
            ))}
          </div>
        </article>

        <article className="panel workspace-main">
          <div className="section-heading">
            <div>
              <h3>{selectedDocument?.label}</h3>
              <p className="muted">{selectedDocument?.type} linked to {activeReturn.form} · {selectedDocument?.relatedSection}</p>
            </div>
            <div className="inline-tags">
              <StatusChip value={selectedDocument?.verification ?? "Requested"} />
              <span className="tag neutral">{selectedDocument?.secureAccess}</span>
              {analysis && canRunAnalysis ? <span className="tag review">AI-assisted review</span> : null}
            </div>
          </div>

          <div className="detail-grid">
            <article className="detail-card">
              <span className="eyebrow">Uploaded</span>
              <strong>{formatDateLabel(selectedDocument?.uploadDate)}</strong>
              <p className="muted">{selectedDocument?.pageCount} pages</p>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Source fields</span>
              <strong>{selectedDocument?.sourceFields ?? 0}</strong>
              <p className="muted">Mapped return values currently traced to this document.</p>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Sensitive data</span>
              <strong>{selectedDocument?.maskedAccount ?? "SSN masked in linked views"}</strong>
              <p className="muted">Least-privilege masking depends on active role.</p>
            </article>
          </div>

          <div className="preview-surface">
            <div className="preview-page">
              <span className="eyebrow">Document preview placeholder</span>
              <strong>{selectedDocument?.previewStatus === "Pending" ? "Pending upload" : "Verified preview available"}</strong>
              <p className="muted">Use this area in the demo to explain where highlighted source pages and extracted fields would appear.</p>
            </div>
          </div>

          <div className="inline-actions">
            <button
              className={`button ${isAnalyzing ? "disabled" : ""}`}
              disabled={!selectedDocument || isAnalyzing || !canRunAnalysis}
              onClick={() => {
                if (canRunAnalysis) {
                  runDocumentAnalysis(selectedDocument.id);
                }
              }}
            >
              {isAnalyzing ? "Analyzing..." : analysis ? "Run mock analysis again" : "Analyze document"}
            </button>
            {canOpenReturnWorkspace ? (
              <button className="button secondary" onClick={() => navigate("/return-workspace")}>Open linked return section</button>
            ) : null}
            <button className="button ghost" onClick={() => navigate("/client-workspace")}>Open client workspace</button>
          </div>

          {analysis && canRunAnalysis ? (
            <div className="analysis-panel">
              <div className="section-heading">
                <div>
                  <h3>Mock analysis</h3>
                  <p className="muted">AI-assisted review only. Human review required before any return change.</p>
                </div>
                <div className="inline-tags">
                  <span className="tag neutral">{analysis.documentType}</span>
                  <span className="tag neutral">{analysis.issuer}</span>
                </div>
              </div>

              <div className="detail-grid analysis-summary-grid">
                <article className="detail-card">
                  <span className="eyebrow">Classification</span>
                  <strong>{analysis.documentType}</strong>
                  <p className="muted">Mock pipeline classified this upload as {analysis.documentType}.</p>
                </article>
                <article className="detail-card">
                  <span className="eyebrow">Tax year</span>
                  <strong>{analysis.taxYear}</strong>
                  <p className="muted">Analysis completed {analysis.analyzedAt}</p>
                </article>
                <article className="detail-card">
                  <span className="eyebrow">Review alerts</span>
                  <strong>{analysis.insights.length}</strong>
                  <p className="muted">Suggested actions only. No return changes applied automatically.</p>
                </article>
              </div>

              <div className="two-column-grid">
                <article className="panel inset-panel">
                  <div className="section-heading">
                    <h4>Extracted Fields</h4>
                    <span className="tag review">Mock analysis</span>
                  </div>
                  <ul className="compact-list">
                    {analysis.extractedFields.map((field) => (
                      <li key={field.name}>
                        <div className="list-title-row">
                          <strong>{field.label}</strong>
                          <span className="meta-text">{formatConfidence(field.confidence)}</span>
                        </div>
                        <p>{String(field.value)}</p>
                        <span className="meta-text">{field.sourceLocation}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="panel inset-panel">
                  <div className="section-heading">
                    <h4>Review Alerts</h4>
                    <span className="tag warning">Human review required</span>
                  </div>
                  <ul className="compact-list">
                    {analysis.insights.map((insight) => (
                      <li key={insight.id}>
                        <div className="list-title-row">
                          <strong>{insight.title}</strong>
                          <StatusChip value={insight.reviewStatus} />
                        </div>
                        <p>{insight.reason}</p>
                        <div className="workflow-meta">
                          <span>Suggested action: {insight.recommendedAction}</span>
                          <span>Confidence: {formatConfidence(insight.confidence)}</span>
                        </div>
                      </li>
                    ))}
                    {analysis.comparison.reviewChecks.map((check) => (
                      <li key={check.type}>
                        <div className="list-title-row">
                          <strong>{check.label}</strong>
                          <span className="meta-text">{formatConfidence(check.confidence)}</span>
                        </div>
                        <p>{check.outcome}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          ) : null}
        </article>

        <article className="workspace-rail">
          <div className="panel">
            <div className="section-heading">
              <h3>Linked Work</h3>
              <span className="tag review">{linkedTasks.length} tasks</span>
            </div>
            <ul className="timeline-list">
              {linkedTasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  <p>{task.owner} · due {formatDateLabel(task.dueDate)}</p>
                  <StatusChip value={task.status} />
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="section-heading">
              <h3>Navigation Links</h3>
              <span className="tag neutral">Context preserved</span>
            </div>
            <div className="stack-list">
              {canOpenReturnWorkspace ? (
                <button
                  className="stack-row interactive"
                  onClick={() => {
                    setActiveClientId(activeClient.id);
                    setActiveReturnId(selectedDocument?.returnId ?? activeReturn.id);
                    navigate("/return-workspace");
                  }}
                >
                  <div>
                    <strong>Return workspace</strong>
                    <p>Open the linked tax section without losing the active client context.</p>
                  </div>
                </button>
              ) : null}
              <button className="stack-row interactive" onClick={() => navigate("/client-workspace")}>
                <div>
                  <strong>Client workspace</strong>
                  <p>Jump to the connected request or message inside the unified workflow page.</p>
                </div>
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
