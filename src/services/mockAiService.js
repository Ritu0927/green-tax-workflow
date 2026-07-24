import { getDocumentAnalysisDefinition } from "../data/documentAnalysis";
import { mockData } from "../data/mockData";

function wait(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), 500 + Math.floor(Math.random() * 401));
  });
}

function findDocument(documentId) {
  return mockData.documents.find((item) => item.id === documentId);
}

function findReturn(returnId) {
  return mockData.returns.find((item) => item.id === returnId);
}

function findClient(clientId) {
  return mockData.clients.find((item) => item.id === clientId);
}

function findAlertDefinition(alertId) {
  const matchingDocument = mockData.documents.find((document) => {
    const definition = getDocumentAnalysisDefinition(document.id);
    return definition?.alerts?.some((alert) => alert.id === alertId);
  });

  if (!matchingDocument) {
    return null;
  }

  const definition = getDocumentAnalysisDefinition(matchingDocument.id);
  const alert = definition?.alerts?.find((item) => item.id === alertId);

  if (!alert) {
    return null;
  }

  return {
    document: matchingDocument,
    client: findClient(matchingDocument.clientId),
    targetReturn: findReturn(matchingDocument.returnId),
    definition,
    alert
  };
}

function buildRequestTitle(alert, document) {
  if (document.documentType === "1099-INT") {
    return "Upload final 1099-INT";
  }
  if (alert.relatedField === "Provider tax ID") {
    return "Provide dependent-care provider tax ID";
  }
  return `Provide information for ${document.label}`;
}

function buildRequestMessage(alert, document) {
  if (document.documentType === "1099-INT") {
    return "Please upload the final 2025 1099-INT from First Harbor Bank so we can complete your interest-income review.";
  }
  if (alert.relatedField === "Provider tax ID") {
    return "Please provide the dependent-care provider tax ID so we can complete your dependent-care review.";
  }
  return `Please provide the missing information for ${document.label} so we can continue review.`;
}

function buildComparison(documentId, returnId, definition) {
  const targetReturn = findReturn(returnId);
  const fieldGroup = mockData.returnFieldGroups[returnId]?.flatMap((group) => group.fields) ?? [];
  const extractedPrimary = definition?.extractedFields?.[0];
  const reviewChecks = (definition?.alerts ?? []).map((alert) => ({
    type: alert.id,
    label: alert.title,
    outcome: alert.suggestedAction,
    confidence: 0.84
  }));

  if (targetReturn && definition && targetReturn.taxYear !== String(definition.taxYear)) {
    reviewChecks.push({
      type: "tax-year-mismatch",
      label: "Tax-year mismatch",
      outcome: "Confirm whether the document belongs to another tax year.",
      confidence: 0.88
    });
  }

  const linkedField = fieldGroup.find((field) => field.sourceDocumentId === documentId);

  return {
    documentId,
    returnId,
    comparisonStatus: "complete",
    extractedValue: extractedPrimary?.value ?? null,
    returnValue: linkedField?.value ?? "Pending",
    roundedExtractedValue: extractedPrimary?.value ?? null,
    reviewChecks
  };
}

function buildAnalysis(documentId) {
  const document = findDocument(documentId);
  const definition = getDocumentAnalysisDefinition(documentId);

  if (!document || !definition) {
    return {
      documentId,
      documentType: document?.documentType ?? document?.type ?? "Unknown",
      issuer: document?.label ?? "Unclassified document",
      taxYear: Number(findReturn(document?.returnId)?.taxYear ?? 2025),
      status: "analysis_complete",
      extractedFields: [],
      insights: [],
      comparison: {
        documentId,
        returnId: document?.returnId ?? null,
        comparisonStatus: "complete",
        reviewChecks: []
      },
      analyzedAt: "2026-07-24 10:18 AM"
    };
  }

  return {
    documentId,
    documentType: definition.documentType,
    issuer: definition.issuer,
    taxYear: definition.taxYear,
    status: "analysis_complete",
    extractedFields: definition.extractedFields,
    insights: definition.alerts,
    comparison: buildComparison(documentId, document.returnId, definition),
    analyzedAt: "2026-07-24 10:18 AM"
  };
}

export async function analyzeDocument(documentId) {
  return wait(buildAnalysis(documentId));
}

export async function reanalyzeDocument(documentId) {
  return wait(buildAnalysis(documentId));
}

export async function analyzeDocuments(documentIds) {
  const results = [];
  for (const documentId of documentIds) {
    // Sequential processing preserves believable per-document progress in the UI.
    // eslint-disable-next-line no-await-in-loop
    results.push(await analyzeDocument(documentId));
  }
  return results;
}

export async function compareDocumentToReturn(documentId, returnId) {
  const definition = getDocumentAnalysisDefinition(documentId);
  return wait(buildComparison(documentId, returnId, definition));
}

export async function getInsightsForReturn(returnId) {
  return wait(mockData.aiInsights.filter((item) => item.returnId === returnId));
}

export async function createTaskFromInsight(insightId) {
  if (insightId === "ai-001") {
    return wait({
      task: {
        id: "generated-task-doc-001-request",
        title: "Request final 1099-INT",
        clientId: "client-001",
        owner: "Avery Stone",
        dueDate: "2026-07-29",
        status: "Open",
        linkedTo: "doc-001",
        visibility: "Client",
        type: "Document Request"
      },
      documentRequest: {
        id: "generated-request-doc-001",
        clientId: "client-001",
        title: "Upload final 1099-INT",
        dueDate: "2026-07-29",
        owner: "Avery Stone",
        status: "Open",
        linkedDocumentId: "doc-001"
      }
    });
  }

  return wait(null);
}

export async function createInformationRequestDraft(alertId, actorName = "Noah Patel") {
  const match = findAlertDefinition(alertId);
  if (!match) {
    return wait(null);
  }

  const { alert, document, client, targetReturn } = match;
  return wait({
    id: `draft-${alertId}`,
    sourceAlertId: alert.id,
    sourceDocumentId: document.id,
    clientId: client?.id ?? null,
    returnId: targetReturn?.id ?? null,
    relatedReturnSection: document.relatedSection,
    title: buildRequestTitle(alert, document),
    message: buildRequestMessage(alert, document),
    owner: client?.name ?? "Client",
    dueDate: client?.deadline ?? targetReturn?.dueDate ?? "2026-08-01",
    status: "Draft",
    createdBy: actorName,
    createdAt: "2026-07-24 4:24 PM"
  });
}

export async function generateTaskFromAlert(alertId, kind = "reviewer-escalation", actorName = "Noah Patel") {
  const match = findAlertDefinition(alertId);
  if (!match) {
    return wait(null);
  }

  const { alert, document, client, targetReturn } = match;
  const title = kind === "reviewer-escalation"
    ? `Review escalated document issue: ${alert.title}`
    : `Review corrected extraction: ${alert.relatedField}`;
  const owner = kind === "reviewer-escalation" ? "Maya Chen, CPA" : "Maya Chen, CPA";

  return wait({
    id: `generated-task-${kind}-${alert.id}`,
    title,
    description: alert.suggestedAction,
    sourceAlertId: alert.id,
    sourceDocumentId: document.id,
    clientId: client?.id ?? null,
    owner,
    dueDate: targetReturn?.dueDate ?? "2026-08-01",
    status: "Not Started",
    linkedTo: document.id,
    visibility: "Internal",
    type: kind === "reviewer-escalation" ? "Escalation Review" : "Correction Review",
    relatedReturnSection: document.relatedSection,
    clientMessage: null,
    createdBy: actorName,
    createdAt: "2026-07-24 4:24 PM"
  });
}

export const createTaskFromAlert = generateTaskFromAlert;
