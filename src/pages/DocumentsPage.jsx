import React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { SecurityBadge } from "../components/SecurityBadge";
import { StatusChip } from "../components/StatusChip";
import { formatDateLabel } from "../utils/formatters";

export function DocumentsPage() {
  const { activeClient, activeReturn, activeRole, mockData, setActiveClientId, setActiveReturnId } = useAppContext();
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

  const linkedTasks = mockData.tasks.filter((task) => task.linkedTo === selectedDocument?.id);

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Secure Documents</h3>
            <p className="muted">Documents carry verification state, source-field count, secure access indicators, and links back to the return workspace.</p>
          </div>
          <SecurityBadge label={activeRole === "client" ? "Client view masked" : "Firm view"} tone="neutral" />
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
            <button className="button secondary" onClick={() => navigate("/return-workspace")}>Open linked return section</button>
            <button className="button ghost" onClick={() => navigate("/collaboration")}>Open related messages</button>
          </div>
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
              <button className="stack-row interactive" onClick={() => navigate("/collaboration")}>
                <div>
                  <strong>Collaboration and tasks</strong>
                  <p>Jump to the request or thread connected to this document.</p>
                </div>
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
