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

export async function analyzeDocument(documentId) {
  const document = findDocument(documentId);

  const fallback = {
    documentId,
    documentType: document?.type ?? "Unknown",
    issuer: document?.label ?? "Unclassified document",
    taxYear: Number(findReturn(document?.returnId)?.taxYear ?? 2025),
    status: "analysis_complete",
    extractedFields: []
  };

  if (documentId !== "doc-001") {
    return wait(fallback);
  }

  return wait({
    documentId: "doc-001",
    documentType: "1099-INT",
    issuer: "First Harbor Bank",
    taxYear: 2025,
    status: "analysis_complete",
    extractedFields: [
      {
        name: "interestIncome",
        label: "Interest income",
        value: 1284.12,
        sourceLocation: "Page 1 · Box 1",
        confidence: 0.82
      },
      {
        name: "accountEnding",
        label: "Account ending",
        value: "2184",
        sourceLocation: "Page 1",
        confidence: 0.96
      }
    ]
  });
}

export async function compareDocumentToReturn(documentId, returnId) {
  const analysis = await analyzeDocument(documentId);
  const targetReturn = findReturn(returnId);
  const fieldGroup = mockData.returnFieldGroups[returnId]?.flatMap((group) => group.fields) ?? [];
  const interestField = fieldGroup.find((field) => field.sourceDocumentId === documentId);
  const extractedInterest = analysis.extractedFields.find((field) => field.name === "interestIncome");
  const roundedExtracted = extractedInterest ? `$${Math.round(extractedInterest.value).toLocaleString("en-US")}` : null;
  const returnValue = interestField?.value ?? "Pending";

  const reviewChecks = [];

  if (extractedInterest && interestField && roundedExtracted !== returnValue) {
    reviewChecks.push({
      type: "value_mismatch",
      label: "Value mismatch",
      outcome: "Review the return value.",
      confidence: extractedInterest.confidence
    });
  }

  if (extractedInterest && extractedInterest.confidence < 0.85) {
    reviewChecks.push({
      type: "low_confidence",
      label: "Low confidence",
      outcome: "Verify the field against the source document.",
      confidence: extractedInterest.confidence
    });
  }

  if (targetReturn && Number(targetReturn.taxYear) !== analysis.taxYear) {
    reviewChecks.push({
      type: "tax_year_mismatch",
      label: "Tax-year mismatch",
      outcome: "Confirm whether the document belongs to another tax year.",
      confidence: 0.88
    });
  }

  const duplicateMatch = mockData.documents.find(
    (item) =>
      item.id !== documentId &&
      item.type === analysis.documentType &&
      item.clientId === document?.clientId &&
      item.label.includes("First Harbor Bank")
  );

  if (duplicateMatch) {
    reviewChecks.push({
      type: "duplicate_document",
      label: "Possible duplicate upload",
      outcome: "Review for possible duplicate upload.",
      confidence: 0.79
    });
  }

  return wait({
    documentId,
    returnId,
    comparisonStatus: "complete",
    extractedValue: extractedInterest?.value ?? null,
    returnValue,
    roundedExtractedValue: roundedExtracted,
    reviewChecks
  });
}

export async function getInsightsForReturn(returnId) {
  const baseInsights = mockData.aiInsights.filter((item) => item.returnId === returnId);

  if (returnId !== "ret-2026-001") {
    return wait(baseInsights);
  }

  return wait([
    {
      id: "analysis-insight-doc-001-low-confidence",
      type: "low_confidence",
      title: "Interest income should be verified",
      reason: "The extracted interest-income field is below the mock confidence threshold.",
      sourceDocumentId: "doc-001",
      relatedReturnSection: "Income",
      confidence: 0.82,
      severity: "medium",
      status: "awaiting_review",
      reviewStatus: "Human review required",
      recommendedAction: "Verify the field against the source document",
      recommendation: "Verify the rounded interest amount against the uploaded 1099-INT before reviewer signoff.",
      evidence: "Interest income was extracted from Page 1 · Box 1 with 82% confidence.",
      rationale: "The rounded return value matches the source amount, but the extraction confidence is below the mock 85% verification threshold.",
      actionType: "verify-field",
      actionable: true,
      fieldId: "field-001",
      origin: "mock-analysis"
    },
    ...baseInsights
  ]);
}

export async function createTaskFromInsight(insightId) {
  if (insightId === "analysis-insight-doc-001-low-confidence") {
    return wait({
      task: {
        id: "generated-task-doc-001-review",
        title: "Verify First Harbor Bank interest income",
        clientId: "client-001",
        owner: "Noah Patel",
        dueDate: "2026-07-29",
        status: "Review",
        linkedTo: "doc-001",
        visibility: "Internal",
        type: "AI Review"
      }
    });
  }

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
