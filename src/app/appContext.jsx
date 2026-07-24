import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildInitialDocumentAnalyses } from "../data/documentAnalysis";
import { buildWorkflowItemsFromData, mockData } from "../data/mockData";
import { clientSurveySections, countCompletedSurveySections, getSurveyQuestionLabel } from "../data/clientSurveySchema";
import { analyzeDocuments, createInformationRequestDraft as buildInformationRequestDraft, createTaskFromAlert, createTaskFromInsight, reanalyzeDocument } from "../services/mockAiService";
import { buildExistingRequirementKeys, generateChecklistFromSurvey } from "../utils/generateChecklistFromSurvey";
import { useAuth } from "../context/AuthContext";
import { getRoleConfig, hasAnyPermissionForRole } from "../utils/permissions";

const AppContext = createContext(null);

const fallbackClient = {
  id: "client-001",
  name: "Avery Stone",
  status: "Waiting on Client",
  deadline: "2026-08-15",
  unreadMessages: 2,
  missingDocs: 2,
  returnId: "ret-2026-001",
  progress: 68,
  secureSession: "MFA enabled"
};

const fallbackReturn = {
  id: "ret-2026-001",
  clientId: "client-001",
  taxYear: "2025",
  form: "Form 1040",
  status: "Waiting on Client",
  owner: "Avery Stone",
  nextAction: "Upload final 1099-INT and confirm dependent care expenses.",
  sections: ["Income", "Deductions", "Credits", "Payments"],
  stageNote: "Client action required before preparation can resume.",
  dueDate: "2026-08-15"
};

const fallbackMockData = {
  clients: [fallbackClient],
  returns: [fallbackReturn],
  documents: [],
  documentRequests: [],
  tasks: [],
  messages: [],
  aiInsights: [],
  reviewNotes: [],
  returnFieldGroups: {},
  auditEvents: [],
  accessActivity: [],
  userAccounts: [],
  permissionGroups: [],
  securitySettings: [],
  clientActivity: {},
  questionnaires: {},
  teamMembers: []
};

const SURVEY_STORAGE_KEY = "green-ledger-client-survey-v1";
const DOCUMENT_FOCUS_STORAGE_KEY = "green-ledger-document-focus-v1";

function normalizeTitle(title) {
  return (title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isUnresolvedTaskStatus(status) {
  return !["Completed"].includes(status);
}

function isUnresolvedRequestStatus(status) {
  return !["Completed"].includes(status);
}

function isUnresolvedAlertStatus(status) {
  return ["Open", "In Review", "Waiting on Client", "Escalated"].includes(status);
}

function isUnresolvedFieldStatus(status) {
  return ["Unreviewed", "Needs Review", "Corrected"].includes(status);
}

function severityPriority(severity) {
  switch ((severity ?? "").toLowerCase()) {
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

function createTimestamp() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  });
}

function createActivityTimeLabel() {
  return "Today · 4:24 PM";
}

function loadDocumentFocusState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DOCUMENT_FOCUS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function shouldResolveAlertOnFieldAction(alert) {
  const actionText = `${alert.title} ${alert.suggestedAction}`.toLowerCase();
  return !(actionText.includes("request") || actionText.includes("missing"));
}

function deriveDocumentReviewState(analysis, currentDocument) {
  const unresolvedAlerts = (analysis?.insights ?? []).some((alert) => isUnresolvedAlertStatus(alert.reviewStatus));
  const unresolvedFields = (analysis?.extractedFields ?? []).some((field) => isUnresolvedFieldStatus(field.reviewStatus));

  if ((currentDocument?.processingStatus ?? "") === "Failed") {
    return {
      processingStatus: "Failed",
      verification: "Needs Review"
    };
  }

  if (unresolvedAlerts || unresolvedFields) {
    return {
      processingStatus: "Needs Review",
      verification: "Needs Review"
    };
  }

  return {
    processingStatus: "Verified",
    verification: "Verified"
  };
}

const defaultSurveyState = {
  "client-001": {
    currentSectionIndex: 3,
    answers: {
      addressChanged: "no",
      maritalStatusChanged: "no",
      hasDependents: "yes",
      dependentCount: "1",
      paidDependentCare: "yes",
      dependentAddedRemoved: "no",
      hasCareProviderTaxId: "yes",
      workedForEmployers: "yes",
      employerCount: "2",
      contractorIncome: "no",
      unemploymentIncome: "no",
      retirementIncome: "no",
      bankInterest: "yes",
      interestAccountCount: "2",
      dividends: "no",
      soldInvestments: "no",
      foreignAccounts: "no"
    },
    submittedAt: null,
    manualItems: [],
    clarificationFlags: [],
    generatedItemsSnapshot: [],
    activity: []
  }
};

function loadSurveyState() {
  if (typeof window === "undefined") {
    return defaultSurveyState;
  }

  try {
    const stored = window.localStorage.getItem(SURVEY_STORAGE_KEY);
    if (!stored) {
      return defaultSurveyState;
    }

    return {
      ...defaultSurveyState,
      ...JSON.parse(stored)
    };
  } catch {
    return defaultSurveyState;
  }
}

export function AppProvider({ children }) {
  const { currentUser, hasPermission, signOut } = useAuth();
  const activeRole = currentUser?.role ?? "preparer";
  const [currentClientId, setCurrentClientId] = useState("client-001");
  const [currentReturnId, setCurrentReturnId] = useState("ret-2026-001");
  const [documentAnalyses, setDocumentAnalyses] = useState(() => buildInitialDocumentAnalyses(mockData.documents));
  const [analysisStatusByDocumentId, setAnalysisStatusByDocumentId] = useState({});
  const [documentStateById, setDocumentStateById] = useState({});
  const [batchAnalysisState, setBatchAnalysisState] = useState({ isRunning: false, total: 0, completed: 0 });
  const [generatedInsights, setGeneratedInsights] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [generatedDocumentRequests, setGeneratedDocumentRequests] = useState([]);
  const [generatedAuditEvents, setGeneratedAuditEvents] = useState([]);
  const [generatedRequestDrafts, setGeneratedRequestDrafts] = useState([]);
  const [generatedClientActivityByClientId, setGeneratedClientActivityByClientId] = useState({});
  const [returnStateById, setReturnStateById] = useState({});
  const [surveyStateByClientId, setSurveyStateByClientId] = useState(loadSurveyState);
  const [documentFocusContext, setDocumentFocusContextState] = useState(loadDocumentFocusState);

  const safeMockData = mockData && Array.isArray(mockData.clients) && Array.isArray(mockData.returns)
    ? mockData
    : fallbackMockData;
  const clients = safeMockData.clients;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(surveyStateByClientId));
  }, [surveyStateByClientId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!documentFocusContext) {
      window.localStorage.removeItem(DOCUMENT_FOCUS_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(DOCUMENT_FOCUS_STORAGE_KEY, JSON.stringify(documentFocusContext));
  }, [documentFocusContext]);

  const availableClients = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.role === "client") {
      return clients.filter((client) => client.id === currentUser.clientId);
    }

    if (Array.isArray(currentUser.allowedClientIds)) {
      return clients.filter((client) => currentUser.allowedClientIds.includes(client.id));
    }

    return [];
  }, [clients, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fallbackClientId = currentUser.defaultClientId ?? availableClients[0]?.id ?? fallbackClient.id;
    const isClientAllowed = availableClients.some((client) => client.id === currentClientId);

    if (!currentClientId || !isClientAllowed) {
      setCurrentClientId(fallbackClientId);
    }

    const allowedReturns = safeMockData.returns.filter((item) => item.clientId === (isClientAllowed ? currentClientId : fallbackClientId));
    const fallbackReturnId = currentUser.defaultReturnId ?? allowedReturns[0]?.id ?? fallbackReturn.id;
    const isReturnAllowed = allowedReturns.some((item) => item.id === currentReturnId);

    if (!currentReturnId || !isReturnAllowed) {
      setCurrentReturnId(fallbackReturnId);
    }
  }, [availableClients, currentClientId, currentReturnId, currentUser, safeMockData.returns]);

  const mergedReturns = useMemo(
    () =>
      safeMockData.returns.map((item) => ({
        ...item,
        ...(returnStateById[item.id]?.returnOverride ?? {})
      })),
    [returnStateById, safeMockData.returns]
  );

  const mergedReturnFieldGroups = useMemo(() => {
    const nextGroups = {};

    Object.entries(safeMockData.returnFieldGroups).forEach(([returnId, groups]) => {
      nextGroups[returnId] = groups.map((group) => ({
        ...group,
        fields: group.fields.map((field) => ({
          ...field,
          ...(returnStateById[returnId]?.fieldOverrides?.[field.id] ?? {})
        }))
      }));
    });

    return nextGroups;
  }, [returnStateById, safeMockData.returnFieldGroups]);

  const mergedInsights = useMemo(() => {
    const seenIds = new Set();
    const combined = [...generatedInsights, ...safeMockData.aiInsights].filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });

    return combined;
  }, [generatedInsights, safeMockData.aiInsights]);

  const mergedTasks = useMemo(() => {
    const seenIds = new Set();
    return [...generatedTasks, ...safeMockData.tasks].filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
  }, [generatedTasks, safeMockData.tasks]);

  const mergedDocumentRequests = useMemo(() => {
    const seenIds = new Set();
    return [...generatedDocumentRequests, ...safeMockData.documentRequests].filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
  }, [generatedDocumentRequests, safeMockData.documentRequests]);

  const mergedAuditEvents = useMemo(() => [...generatedAuditEvents, ...safeMockData.auditEvents], [generatedAuditEvents, safeMockData.auditEvents]);
  const mergedDocuments = useMemo(
    () =>
      safeMockData.documents.map((document) => ({
        ...document,
        ...(documentStateById[document.id] ?? {})
      })),
    [documentStateById, safeMockData.documents]
  );

  const mergedClientActivity = useMemo(() => {
    const nextActivity = { ...safeMockData.clientActivity };

    Object.entries(generatedClientActivityByClientId).forEach(([clientId, items]) => {
      if (!items?.length) {
        return;
      }
      nextActivity[clientId] = [...items, ...(nextActivity[clientId] ?? [])];
    });

    Object.entries(surveyStateByClientId).forEach(([clientId, state]) => {
      if (!state?.activity?.length) {
        return;
      }

      nextActivity[clientId] = [...state.activity, ...(nextActivity[clientId] ?? [])];
    });

    return nextActivity;
  }, [generatedClientActivityByClientId, safeMockData.clientActivity, surveyStateByClientId]);

  const mergedWorkflowItems = useMemo(
    () =>
      buildWorkflowItemsFromData({
        clients,
        returns: mergedReturns,
        documents: mergedDocuments,
        documentRequests: mergedDocumentRequests,
        tasks: mergedTasks,
        messages: safeMockData.messages,
        clientActivity: mergedClientActivity,
        questionnaires: safeMockData.questionnaires
      }),
    [clients, mergedClientActivity, mergedDocumentRequests, mergedDocuments, mergedReturns, mergedTasks, safeMockData.messages, safeMockData.questionnaires]
  );

  const intakeSummariesByClientId = useMemo(() => {
    const nextSummaries = {};

    clients.forEach((client) => {
      const surveyState = surveyStateByClientId[client.id] ?? { answers: {}, manualItems: [], clarificationFlags: [], generatedItemsSnapshot: [] };
      const existingItems = mergedWorkflowItems.filter((item) => item.clientId === client.id);
      const existingRequirementKeys = buildExistingRequirementKeys(existingItems);
      const generated = generateChecklistFromSurvey({
        answers: surveyState.answers ?? {},
        client,
        existingRequirementKeys,
        manualItems: surveyState.manualItems ?? [],
        clarificationFlags: surveyState.clarificationFlags ?? [],
        previousGeneratedItems: surveyState.generatedItemsSnapshot ?? []
      });

      nextSummaries[client.id] = {
        completedSections: countCompletedSurveySections(surveyState.answers ?? {}),
        totalSections: clientSurveySections.length,
        submittedAt: surveyState.submittedAt,
        currentSectionIndex: surveyState.currentSectionIndex ?? 0,
        answers: surveyState.answers ?? {},
        manualItems: surveyState.manualItems ?? [],
        clarificationFlags: surveyState.clarificationFlags ?? [],
        ...generated
      };
    });

    return nextSummaries;
  }, [clients, mergedWorkflowItems, surveyStateByClientId]);

  const intakeWorkflowItems = useMemo(
    () =>
      clients.flatMap((client) => {
        const summary = intakeSummariesByClientId[client.id];
        if (!summary?.submittedAt) {
          return [];
        }

        return summary.items.map((item) => ({
          id: item.id,
          clientId: client.id,
          type: item.source === "manual" ? "manual-request" : "survey-intake",
          title: item.title,
          description: item.description,
          owner: item.owner,
          dueDate: item.dueDate,
          status: item.status,
          relatedDocumentId: null,
          relatedReturnSection: item.relatedReturnSection,
          visibility: item.visibility,
          relatedEntityId: item.relatedSurveyQuestion,
          actionLabel: item.actionLabel,
          requirementKey: item.requirementKey,
          messages: [],
          activity: [],
          required: item.required,
          category: item.category,
          actionType: item.actionType,
          source: item.source
        }));
      }),
    [clients, intakeSummariesByClientId]
  );

  const combinedWorkflowItems = useMemo(() => {
    const seen = new Set();
    return [...intakeWorkflowItems, ...mergedWorkflowItems].filter((item) => {
      const key = `${item.clientId}:${item.requirementKey ?? item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [intakeWorkflowItems, mergedWorkflowItems]);

  const enrichedMockData = useMemo(
    () => ({
      ...safeMockData,
      documents: mergedDocuments,
      returns: mergedReturns,
      returnFieldGroups: mergedReturnFieldGroups,
      aiInsights: mergedInsights,
      tasks: mergedTasks,
      documentRequests: mergedDocumentRequests,
      auditEvents: mergedAuditEvents,
      workflowItems: combinedWorkflowItems,
      documentAnalyses,
      clientActivity: mergedClientActivity
    }),
    [
      documentAnalyses,
      mergedAuditEvents,
      combinedWorkflowItems,
      mergedClientActivity,
      mergedDocumentRequests,
      mergedDocuments,
      mergedInsights,
      mergedReturnFieldGroups,
      mergedReturns,
      mergedTasks,
      safeMockData
    ]
  );

  const activeClient = availableClients.find((client) => client.id === currentClientId) ?? availableClients[0] ?? fallbackClient;
  const availableReturns = mergedReturns.filter((item) => item.clientId === activeClient.id);
  const activeReturn = availableReturns.find((item) => item.id === currentReturnId) ?? availableReturns[0] ?? fallbackReturn;

  const handleClientSelection = (clientId) => {
    const nextClient = availableClients.find((client) => client.id === clientId);
    if (!nextClient) {
      return;
    }
    setCurrentClientId(clientId);
    if (nextClient?.returnId) {
      setCurrentReturnId(nextClient.returnId);
    }
  };

  const handleReturnSelection = (returnId) => {
    const nextReturn = availableReturns.find((item) => item.id === returnId);
    if (!nextReturn) {
      return;
    }
    setCurrentReturnId(returnId);
    if (nextReturn?.clientId) {
      setCurrentClientId(nextReturn.clientId);
    }
  };

  const resolveActor = (actor) => {
    if (typeof actor === "string") {
      return {
        actorId: currentUser?.id ?? null,
        actorName: actor
      };
    }

    if (actor?.name) {
      return {
        actorId: actor.id ?? currentUser?.id ?? null,
        actorName: actor.name
      };
    }

    return {
      actorId: currentUser?.id ?? null,
      actorName: currentUser?.name ?? "System"
    };
  };

  const pushAuditEvent = (action, target, actor, metadata = {}) => {
    const resolvedActor = resolveActor(actor);
    setGeneratedAuditEvents((current) => [
      {
        id: `generated-audit-${Date.now()}-${current.length}`,
        actor: resolvedActor.actorName,
        actorId: resolvedActor.actorId,
        actorName: resolvedActor.actorName,
        action,
        target,
        time: createTimestamp(),
        ...metadata
      },
      ...current
    ]);
  };

  const appendClientActivity = (clientId, entry) => {
    setGeneratedClientActivityByClientId((current) => ({
      ...current,
      [clientId]: [entry, ...(current[clientId] ?? [])]
    }));
  };

  const setDocumentFocusContext = (nextContext) => {
    setDocumentFocusContextState(nextContext);
  };

  const clearDocumentFocusContext = () => {
    setDocumentFocusContextState(null);
  };

  const upsertInsights = (insights) => {
    setGeneratedInsights((current) => {
      const nextMap = new Map(current.map((item) => [item.id, item]));
      insights.forEach((item) => nextMap.set(item.id, item));
      return Array.from(nextMap.values());
    });
  };

  const updateDocumentAnalysis = (documentId, updater) => {
    setDocumentAnalyses((current) => {
      const existing = current[documentId];
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [documentId]: updater(existing)
      };
    });
  };

  const syncDocumentReviewState = (documentId, nextAnalysis) => {
    const currentDocument = mergedDocuments.find((item) => item.id === documentId);
    if (!currentDocument || !nextAnalysis) {
      return;
    }

    const nextState = deriveDocumentReviewState(nextAnalysis, currentDocument);
    setDocumentStateById((current) => ({
      ...current,
      [documentId]: {
        ...(current[documentId] ?? {}),
        processingStatus: nextState.processingStatus,
        verification: nextState.verification,
        sourceFields: nextAnalysis.extractedFields.length
      }
    }));
    setAnalysisStatusByDocumentId((current) => ({
      ...current,
      [documentId]: nextState.processingStatus
    }));
  };

  const findDocumentAlert = (alertId) => {
    for (const [documentId, analysis] of Object.entries(documentAnalyses)) {
      const alert = analysis.insights?.find((item) => item.id === alertId);
      if (alert) {
        return {
          documentId,
          analysis,
          alert,
          document: mergedDocuments.find((item) => item.id === documentId) ?? null
        };
      }
    }
    return null;
  };

  const findExistingGeneratedTask = ({ sourceAlertId, sourceDocumentId, title }) =>
    [...generatedTasks, ...safeMockData.tasks].find((task) => {
      const sameAlert = sourceAlertId && task.sourceAlertId === sourceAlertId && isUnresolvedTaskStatus(task.status);
      const sameDocumentAndTitle =
        sourceDocumentId &&
        (task.sourceDocumentId === sourceDocumentId || task.linkedTo === sourceDocumentId) &&
        normalizeTitle(task.title) === normalizeTitle(title) &&
        isUnresolvedTaskStatus(task.status);
      return sameAlert || sameDocumentAndTitle;
    }) ?? null;

  const findExistingGeneratedRequest = ({ sourceAlertId, sourceDocumentId, title }) =>
    [...generatedDocumentRequests, ...safeMockData.documentRequests].find((request) => {
      const sameAlert = sourceAlertId && request.sourceAlertId === sourceAlertId && isUnresolvedRequestStatus(request.status);
      const sameDocumentAndTitle =
        sourceDocumentId &&
        request.linkedDocumentId === sourceDocumentId &&
        normalizeTitle(request.title) === normalizeTitle(title) &&
        isUnresolvedRequestStatus(request.status);
      return sameAlert || sameDocumentAndTitle;
    }) ?? null;

  const runDocumentAnalysis = async (documentId) => {
    const targetDocument = mergedDocuments.find((item) => item.id === documentId);
    if (!targetDocument) {
      return null;
    }

    setAnalysisStatusByDocumentId((current) => ({ ...current, [documentId]: "Processing" }));
    setDocumentStateById((current) => ({
      ...current,
      [documentId]: {
        ...(current[documentId] ?? {}),
        processingStatus: "Processing"
      }
    }));

    const result = await reanalyzeDocument(documentId);
    const derivedStatus = result.insights.length ? "Needs Review" : "Analyzed";

    setDocumentAnalyses((current) => ({ ...current, [documentId]: result }));
    setDocumentStateById((current) => ({
      ...current,
      [documentId]: {
        ...(current[documentId] ?? {}),
        processingStatus: derivedStatus,
        verification: derivedStatus === "Needs Review" ? "Needs Review" : targetDocument.verification,
        sourceFields: result.extractedFields.length
      }
    }));
    setAnalysisStatusByDocumentId((current) => ({ ...current, [documentId]: derivedStatus }));
    pushAuditEvent(`Completed document analysis for ${targetDocument.label}.`, documentId, "System", {
      documentId,
      relatedReturnSection: targetDocument.relatedSection
    });

    return result;
  };

  const runBatchDocumentAnalysis = async (documentIds) => {
    const targets = mergedDocuments.filter((document) => documentIds.includes(document.id) && document.processingStatus !== "Verified");
    if (!targets.length) {
      setBatchAnalysisState({ isRunning: false, total: 0, completed: 0 });
      return [];
    }

    setBatchAnalysisState({ isRunning: true, total: targets.length, completed: 0 });
    const results = [];

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      setAnalysisStatusByDocumentId((current) => ({ ...current, [target.id]: "Processing" }));
      setDocumentStateById((current) => ({
        ...current,
        [target.id]: {
          ...(current[target.id] ?? {}),
          processingStatus: "Processing"
        }
      }));

      // Sequential processing keeps visible progress aligned with each updated document.
      // eslint-disable-next-line no-await-in-loop
      const [result] = await analyzeDocuments([target.id]);
      const derivedStatus = result.insights.length ? "Needs Review" : "Analyzed";

      setDocumentAnalyses((current) => ({ ...current, [target.id]: result }));
      setDocumentStateById((current) => ({
        ...current,
        [target.id]: {
          ...(current[target.id] ?? {}),
          processingStatus: derivedStatus,
          verification: derivedStatus === "Needs Review" ? "Needs Review" : target.verification,
          sourceFields: result.extractedFields.length
        }
      }));
      setAnalysisStatusByDocumentId((current) => ({ ...current, [target.id]: derivedStatus }));
      setBatchAnalysisState({ isRunning: true, total: targets.length, completed: index + 1 });
      results.push(result);
    }

    setBatchAnalysisState({ isRunning: false, total: targets.length, completed: targets.length });
    return results;
  };

  const verifyDocumentField = async (documentId, fieldName, actor) => {
    const targetDocument = mergedDocuments.find((item) => item.id === documentId);
    const currentAnalysis = documentAnalyses[documentId];
    if (!targetDocument || !currentAnalysis) {
      return null;
    }

    const timestamp = createTimestamp();
    let updatedAnalysis = currentAnalysis;

    updateDocumentAnalysis(documentId, (existing) => {
      const nextFields = existing.extractedFields.map((field) => (
        field.name === fieldName
          ? {
              ...field,
              reviewStatus: "Verified",
              verifiedBy: resolveActor(actor).actorName,
              verifiedAt: timestamp
            }
          : field
      ));

      const targetField = existing.extractedFields.find((field) => field.name === fieldName);
      const nextAlerts = existing.insights.map((alert) => {
        if (targetField && alert.relatedField === targetField.label && shouldResolveAlertOnFieldAction(alert)) {
          return {
            ...alert,
            reviewStatus: "Resolved",
            resolvedBy: resolveActor(actor).actorName,
            resolvedAt: timestamp
          };
        }
        return alert;
      });

      updatedAnalysis = {
        ...existing,
        extractedFields: nextFields,
        insights: nextAlerts
      };

      return updatedAnalysis;
    });

    syncDocumentReviewState(documentId, updatedAnalysis);

    const verifiedField = currentAnalysis.extractedFields.find((field) => field.name === fieldName);
    pushAuditEvent(
      `${resolveActor(actor).actorName} verified ${verifiedField?.label ?? fieldName} on ${targetDocument.label}.`,
      documentId,
      actor,
      {
        documentId,
        fieldName,
        relatedReturnSection: targetDocument.relatedSection
      }
    );

    return updatedAnalysis;
  };

  const correctDocumentField = async (documentId, fieldName, correctedValue, reason, actor) => {
    if (!correctedValue || !reason) {
      return { error: "Corrected value and reason are required." };
    }

    const targetDocument = mergedDocuments.find((item) => item.id === documentId);
    const currentAnalysis = documentAnalyses[documentId];
    if (!targetDocument || !currentAnalysis) {
      return null;
    }

    const targetField = currentAnalysis.extractedFields.find((field) => field.name === fieldName);
    if (!targetField) {
      return null;
    }

    const timestamp = createTimestamp();
    let updatedAnalysis = currentAnalysis;
    updateDocumentAnalysis(documentId, (existing) => {
      const nextFields = existing.extractedFields.map((field) => (
        field.name === fieldName
          ? {
              ...field,
              originalValue: field.originalValue ?? field.value,
              value: correctedValue,
              correctedValue,
              correctionReason: reason,
              correctedBy: resolveActor(actor).actorName,
              correctedAt: timestamp,
              reviewStatus: "Corrected"
            }
          : field
      ));

      const nextAlerts = existing.insights.map((alert) => {
        if (alert.relatedField === targetField.label && shouldResolveAlertOnFieldAction(alert)) {
          return {
            ...alert,
            reviewStatus: "Resolved",
            resolvedBy: resolveActor(actor).actorName,
            resolvedAt: timestamp
          };
        }
        return alert;
      });

      updatedAnalysis = {
        ...existing,
        extractedFields: nextFields,
        insights: nextAlerts
      };
      return updatedAnalysis;
    });

    syncDocumentReviewState(documentId, updatedAnalysis);

    if (currentUser?.role === "preparer") {
      const correctionTask = await createTaskFromAlert(
        currentAnalysis.insights.find((alert) => alert.relatedField === targetField.label)?.id ?? `correction-${documentId}-${fieldName}`,
        "correction-review",
        resolveActor(actor).actorName
      );

      if (correctionTask && !findExistingGeneratedTask({ sourceAlertId: correctionTask.sourceAlertId, sourceDocumentId: correctionTask.sourceDocumentId, title: correctionTask.title })) {
        setGeneratedTasks((current) => [correctionTask, ...current]);
      }
    }

    pushAuditEvent(
      `${resolveActor(actor).actorName} corrected ${targetField.label} from ${targetField.value} to ${correctedValue}. Reason: ${reason}`,
      documentId,
      actor,
      {
        documentId,
        fieldName,
        relatedReturnSection: targetDocument.relatedSection,
        reason
      }
    );

    return updatedAnalysis;
  };

  const createInformationRequestDraft = async (alertId, actor) => {
    const existingDraft = generatedRequestDrafts.find((draft) => draft.sourceAlertId === alertId && draft.status === "Draft");
    if (existingDraft) {
      return existingDraft;
    }

    const draft = await buildInformationRequestDraft(alertId, resolveActor(actor).actorName);
    if (!draft) {
      return null;
    }

    setGeneratedRequestDrafts((current) => [draft, ...current]);
    pushAuditEvent(`Created draft client request: ${draft.title}.`, draft.sourceDocumentId, actor, {
      documentId: draft.sourceDocumentId,
      alertId,
      relatedReturnSection: draft.relatedReturnSection
    });
    return draft;
  };

  const confirmInformationRequest = async (draftId, editedMessage, dueDate, actor) => {
    if (!editedMessage || !dueDate) {
      return { error: "Message and due date are required." };
    }

    const draft = generatedRequestDrafts.find((item) => item.id === draftId);
    if (!draft) {
      return null;
    }

    const existingRequest = findExistingGeneratedRequest({
      sourceAlertId: draft.sourceAlertId,
      sourceDocumentId: draft.sourceDocumentId,
      title: draft.title
    });
    const existingTask = findExistingGeneratedTask({
      sourceAlertId: draft.sourceAlertId,
      sourceDocumentId: draft.sourceDocumentId,
      title: draft.title
    });

    const requestRecord = existingRequest ?? {
      id: `generated-request-${draft.sourceAlertId}`,
      clientId: draft.clientId,
      title: draft.title,
      dueDate,
      owner: draft.owner,
      status: "Not Started",
      linkedDocumentId: draft.sourceDocumentId,
      sourceAlertId: draft.sourceAlertId,
      relatedReturnSection: draft.relatedReturnSection,
      clientMessage: editedMessage,
      createdBy: resolveActor(actor).actorName,
      createdAt: createTimestamp()
    };

    const taskRecord = existingTask ?? {
      id: `generated-task-request-${draft.sourceAlertId}`,
      title: draft.title,
      description: editedMessage,
      clientId: draft.clientId,
      owner: draft.owner,
      dueDate,
      status: "Not Started",
      linkedTo: draft.sourceDocumentId,
      visibility: "Client",
      type: "Document Request",
      sourceAlertId: draft.sourceAlertId,
      sourceDocumentId: draft.sourceDocumentId,
      relatedReturnSection: draft.relatedReturnSection,
      clientMessage: editedMessage,
      createdBy: resolveActor(actor).actorName,
      createdAt: createTimestamp()
    };

    setGeneratedDocumentRequests((current) => {
      if (existingRequest) {
        return current.map((item) => (item.id === existingRequest.id ? { ...item, dueDate, clientMessage: editedMessage } : item));
      }
      return [requestRecord, ...current];
    });
    setGeneratedTasks((current) => {
      if (existingTask) {
        return current.map((item) => (item.id === existingTask.id ? { ...item, dueDate, description: editedMessage, clientMessage: editedMessage } : item));
      }
      return [taskRecord, ...current];
    });
    setGeneratedRequestDrafts((current) => current.filter((item) => item.id !== draftId));

    updateDocumentAnalysis(draft.sourceDocumentId, (existing) => ({
      ...existing,
      insights: existing.insights.map((alert) => (
        alert.id === draft.sourceAlertId
          ? {
              ...alert,
              reviewStatus: "Waiting on Client",
              lastClientRequestAt: createTimestamp()
            }
          : alert
      ))
    }));

    setReturnStateById((current) => ({
      ...current,
      [draft.returnId]: {
        ...current[draft.returnId],
        returnOverride: {
          ...(current[draft.returnId]?.returnOverride ?? {}),
          status: "Waiting on Client",
          owner: draft.owner,
          nextAction: editedMessage
        }
      }
    }));

    appendClientActivity(draft.clientId, {
      id: `client-activity-request-${draft.sourceAlertId}`,
      title: "Document request created",
      detail: draft.title,
      time: createActivityTimeLabel()
    });

    pushAuditEvent(`Confirmed client request: ${draft.title}.`, draft.sourceDocumentId, actor, {
      documentId: draft.sourceDocumentId,
      alertId: draft.sourceAlertId,
      relatedReturnSection: draft.relatedReturnSection,
      reason: editedMessage
    });

    return {
      request: requestRecord,
      task: taskRecord
    };
  };

  const escalateDocumentAlert = async (alertId, note, actor) => {
    if (!note) {
      return { error: "Escalation note is required." };
    }

    const match = findDocumentAlert(alertId);
    if (!match?.document) {
      return null;
    }

    const timestamp = createTimestamp();
    let updatedAnalysis = match.analysis;
    updateDocumentAnalysis(match.documentId, (existing) => {
      const nextAlerts = existing.insights.map((alert) => (
        alert.id === alertId
          ? {
              ...alert,
              reviewStatus: "Escalated",
              escalationNote: note,
              escalatedBy: resolveActor(actor).actorName,
              escalatedAt: timestamp
            }
          : alert
      ));
      updatedAnalysis = {
        ...existing,
        insights: nextAlerts
      };
      return updatedAnalysis;
    });

    syncDocumentReviewState(match.documentId, updatedAnalysis);

    const escalationTask = await createTaskFromAlert(alertId, "reviewer-escalation", resolveActor(actor).actorName);
    if (escalationTask && !findExistingGeneratedTask({ sourceAlertId: escalationTask.sourceAlertId, sourceDocumentId: escalationTask.sourceDocumentId, title: escalationTask.title })) {
      setGeneratedTasks((current) => [escalationTask, ...current]);
    }

    pushAuditEvent(`Escalated document alert: ${match.alert.title}. Note: ${note}`, match.documentId, actor, {
      documentId: match.documentId,
      alertId,
      relatedReturnSection: match.document.relatedSection,
      note
    });

    return escalationTask;
  };

  const getNextDocumentException = (currentDocumentId, currentAlertId = null) => {
    const scopedDocuments = mergedDocuments.filter((document) => document.clientId === activeClient.id && document.returnId === activeReturn.id);
    const candidates = [];

    scopedDocuments.forEach((document) => {
      const analysis = documentAnalyses[document.id];
      const documentStatus = analysisStatusByDocumentId[document.id] ?? document.processingStatus;

      if (documentStatus === "Failed") {
        candidates.push({
          key: `document:${document.id}`,
          priority: 0,
          documentId: document.id,
          alertId: null,
          fieldName: null
        });
      }

      (analysis?.insights ?? [])
        .filter((alert) => isUnresolvedAlertStatus(alert.reviewStatus))
        .forEach((alert) => {
          candidates.push({
            key: `alert:${document.id}:${alert.id}`,
            priority: severityPriority(alert.severity),
            documentId: document.id,
            alertId: alert.id,
            fieldName: null
          });
        });

      (analysis?.extractedFields ?? [])
        .filter((field) => isUnresolvedFieldStatus(field.reviewStatus) && field.confidence < 0.9)
        .forEach((field) => {
          candidates.push({
            key: `field:${document.id}:${field.name}`,
            priority: 4,
            documentId: document.id,
            alertId: null,
            fieldName: field.name
          });
        });
    });

    const ordered = candidates.sort((left, right) => left.priority - right.priority || left.key.localeCompare(right.key));
    if (!ordered.length) {
      return null;
    }

    const currentKey = currentAlertId
      ? `alert:${currentDocumentId}:${currentAlertId}`
      : currentDocumentId
        ? `document:${currentDocumentId}`
        : null;
    const currentIndex = currentKey ? ordered.findIndex((item) => item.key === currentKey) : -1;
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % ordered.length : 0;
    const nextItem = ordered[nextIndex];

    return {
      documentId: nextItem.documentId,
      alertId: nextItem.alertId,
      fieldName: nextItem.fieldName,
      position: nextIndex + 1,
      totalUnresolved: ordered.length
    };
  };

  const submitClientDocumentRequest = (workflowItemId, actor = currentUser) => {
    const workflowItem = combinedWorkflowItems.find((item) => item.id === workflowItemId);
    if (!workflowItem?.relatedDocumentId) {
      return null;
    }

    const relatedTask = [...generatedTasks, ...safeMockData.tasks].find(
      (task) => task.linkedTo === workflowItem.relatedDocumentId && normalizeTitle(task.title) === normalizeTitle(workflowItem.title)
    );
    const relatedRequest = [...generatedDocumentRequests, ...safeMockData.documentRequests].find(
      (request) => request.linkedDocumentId === workflowItem.relatedDocumentId && normalizeTitle(request.title) === normalizeTitle(workflowItem.title)
    );
    const document = mergedDocuments.find((item) => item.id === workflowItem.relatedDocumentId);
    const relatedReturnId = document?.returnId ?? activeReturn.id;

    if (relatedTask) {
      setGeneratedTasks((current) => {
        const existingGenerated = current.find((item) => item.id === relatedTask.id);
        const nextTask = { ...relatedTask, status: "Submitted" };
        if (existingGenerated) {
          return current.map((item) => (item.id === relatedTask.id ? nextTask : item));
        }
        return [nextTask, ...current];
      });
    }

    if (relatedRequest) {
      setGeneratedDocumentRequests((current) => {
        const existingGenerated = current.find((item) => item.id === relatedRequest.id);
        const nextRequest = { ...relatedRequest, status: "Submitted" };
        if (existingGenerated) {
          return current.map((item) => (item.id === relatedRequest.id ? nextRequest : item));
        }
        return [nextRequest, ...current];
      });
    }

    if (document) {
      setDocumentStateById((current) => ({
        ...current,
        [document.id]: {
          ...(current[document.id] ?? {}),
          processingStatus: "Uploaded",
          verification: "Uploaded"
        }
      }));
      setAnalysisStatusByDocumentId((current) => ({
        ...current,
        [document.id]: "Uploaded"
      }));
      updateDocumentAnalysis(document.id, (existing) => ({
        ...existing,
        insights: (existing.insights ?? []).map((alert) => (
          alert.reviewStatus === "Waiting on Client"
            ? { ...alert, reviewStatus: "In Review" }
            : alert
        ))
      }));
    }

    setReturnStateById((current) => ({
      ...current,
      [relatedReturnId]: {
        ...current[relatedReturnId],
        returnOverride: {
          ...(current[relatedReturnId]?.returnOverride ?? {}),
          status: "In Preparation",
          owner: activeClient.preparer ?? "Noah Patel",
          nextAction: `Review newly uploaded evidence for ${document?.label ?? workflowItem.title}.`
        }
      }
    }));

    appendClientActivity(activeClient.id, {
      id: `client-activity-submit-${workflowItem.relatedDocumentId}-${Date.now()}`,
      title: "Requested document submitted",
      detail: workflowItem.title,
      time: createActivityTimeLabel()
    });

    pushAuditEvent(`Client submitted requested evidence for ${workflowItem.title}.`, workflowItem.relatedDocumentId, actor, {
      documentId: workflowItem.relatedDocumentId,
      relatedReturnSection: workflowItem.relatedReturnSection
    });

    return workflowItem.relatedDocumentId;
  };

  const completeReviewerTask = (taskId, actor = currentUser) => {
    const existingTask = [...generatedTasks, ...safeMockData.tasks].find((task) => task.id === taskId);
    if (!existingTask) {
      return null;
    }

    setGeneratedTasks((current) => {
      const existingGenerated = current.find((item) => item.id === taskId);
      const nextTask = { ...existingTask, status: "Completed" };
      if (existingGenerated) {
        return current.map((item) => (item.id === taskId ? nextTask : item));
      }
      return [nextTask, ...current];
    });

    if (existingTask.sourceAlertId) {
      const match = findDocumentAlert(existingTask.sourceAlertId);
      if (match) {
        updateDocumentAnalysis(match.documentId, (existing) => ({
          ...existing,
          insights: existing.insights.map((alert) => (
            alert.id === existingTask.sourceAlertId
              ? { ...alert, reviewStatus: "Resolved", resolvedBy: resolveActor(actor).actorName, resolvedAt: createTimestamp() }
              : alert
          ))
        }));
      }
    }

    pushAuditEvent(`Completed reviewer task: ${existingTask.title}.`, existingTask.linkedTo ?? existingTask.sourceDocumentId ?? taskId, actor, {
      documentId: existingTask.sourceDocumentId ?? existingTask.linkedTo ?? null,
      relatedReturnSection: existingTask.relatedReturnSection ?? null
    });

    return existingTask;
  };

  const documentExceptionQueue = useMemo(() => {
    const items = [];

    mergedDocuments
      .filter((document) => document.clientId === activeClient.id || currentUser?.role !== "client")
      .forEach((document) => {
        const analysis = documentAnalyses[document.id];
        const client = clients.find((entry) => entry.id === document.clientId);
        const targetReturn = mergedReturns.find((entry) => entry.id === document.returnId);

        if (document.processingStatus === "Failed") {
          items.push({
            id: `doc-failed-${document.id}`,
            kind: "document-exception",
            clientId: document.clientId,
            returnId: document.returnId,
            clientName: client?.name ?? "Unknown client",
            documentId: document.id,
            documentLabel: document.label,
            issue: `${document.documentType} processing failed`,
            owner: client?.preparer ?? "Noah Patel",
            status: "Needs Review",
            dueDate: targetReturn?.dueDate ?? null,
            relatedReturnSection: document.relatedSection,
            urgency: "High",
            alertId: null,
            fieldName: null
          });
        }

        (analysis?.insights ?? [])
          .filter((alert) => isUnresolvedAlertStatus(alert.reviewStatus))
          .forEach((alert) => {
            items.push({
              id: `doc-alert-${alert.id}`,
              kind: "document-exception",
              clientId: document.clientId,
              returnId: document.returnId,
              clientName: client?.name ?? "Unknown client",
              documentId: document.id,
              documentLabel: document.label,
              issue: alert.title,
              owner: alert.owner ?? client?.preparer ?? "Noah Patel",
              status: alert.reviewStatus,
              dueDate: targetReturn?.dueDate ?? null,
              relatedReturnSection: document.relatedSection,
              urgency: alert.severity ?? "Medium",
              alertId: alert.id,
              fieldName: null
            });
          });
      });

    [...generatedTasks, ...safeMockData.tasks]
      .filter((task) => task.sourceDocumentId || task.linkedTo?.startsWith("doc-"))
      .filter((task) => isUnresolvedTaskStatus(task.status))
      .forEach((task) => {
        const documentId = task.sourceDocumentId ?? task.linkedTo;
        const document = mergedDocuments.find((item) => item.id === documentId);
        const client = clients.find((entry) => entry.id === task.clientId);
        const targetReturn = mergedReturns.find((entry) => entry.id === document?.returnId);

        items.push({
          id: `doc-task-${task.id}`,
          kind: "document-exception",
          taskId: task.id,
          clientId: task.clientId,
          returnId: document?.returnId ?? targetReturn?.id ?? null,
          clientName: client?.name ?? "Unknown client",
          documentId,
          documentLabel: document?.label ?? task.title,
          issue: task.title,
          owner: task.owner,
          status: task.status,
          dueDate: task.dueDate,
          relatedReturnSection: task.relatedReturnSection ?? document?.relatedSection ?? "Return overview",
          urgency: task.type?.includes("Escalation") ? "High" : "Medium",
          alertId: task.sourceAlertId ?? null,
          fieldName: null
        });
      });

    return items.filter((item, index, collection) => collection.findIndex((entry) => entry.id === item.id) === index);
  }, [activeClient.id, clients, currentUser?.role, documentAnalyses, generatedTasks, mergedDocuments, mergedReturns, safeMockData.tasks]);

  const acceptInsightRecommendation = async (insightId) => {
    const targetInsight = mergedInsights.find((item) => item.id === insightId);
    if (!targetInsight || targetInsight.status === "accepted") {
      return null;
    }

    const taskPayload = await createTaskFromInsight(insightId);

    if (taskPayload?.task) {
      setGeneratedTasks((current) => {
        const existing = current.find((item) => item.id === taskPayload.task.id || item.title === taskPayload.task.title);
        return existing ? current : [taskPayload.task, ...current];
      });
    }

    if (taskPayload?.documentRequest) {
      setGeneratedDocumentRequests((current) => {
        const existing = current.find(
          (item) => item.id === taskPayload.documentRequest.id || item.linkedDocumentId === taskPayload.documentRequest.linkedDocumentId
        );
        return existing ? current : [taskPayload.documentRequest, ...current];
      });
    }

    upsertInsights([
      {
        ...targetInsight,
        status: "accepted",
        reviewStatus: "Accepted",
        actionable: false
      }
    ]);

    const targetReturnId = targetInsight.returnId;
    if (targetInsight.actionType === "hold-for-document" && targetReturnId) {
      setReturnStateById((current) => ({
        ...current,
        [targetReturnId]: {
          ...current[targetReturnId],
          returnOverride: {
            ...(current[targetReturnId]?.returnOverride ?? {}),
            nextAction: `Document required: upload final 1099-INT before review can continue.`
          },
          fieldOverrides: {
            ...(current[targetReturnId]?.fieldOverrides ?? {}),
            [targetInsight.fieldId]: {
              ...(current[targetReturnId]?.fieldOverrides?.[targetInsight.fieldId] ?? {}),
              reviewState: "On hold",
              verified: false,
              manualStatus: "Recommendation accepted"
            }
          }
        }
      }));
    }

    pushAuditEvent(`Accepted AI-assisted recommendation: ${targetInsight.recommendedAction}.`, targetInsight.returnId ?? targetInsight.sourceDocumentId, "Preparer");
    return taskPayload;
  };

  const saveFieldCorrection = async ({ returnId, fieldId, previousValue, nextValue, reason }) => {
    setReturnStateById((current) => ({
      ...current,
      [returnId]: {
        ...current[returnId],
        fieldOverrides: {
          ...(current[returnId]?.fieldOverrides ?? {}),
          [fieldId]: {
            ...(current[returnId]?.fieldOverrides?.[fieldId] ?? {}),
            value: nextValue,
            reviewState: "Needs Review",
            verified: false,
            aiGenerated: false,
            editable: true,
            manualStatus: "Manually corrected",
            correctionReason: reason
          }
        }
      }
    }));

    pushAuditEvent(`Return value changed from ${previousValue} to ${nextValue}. Reason: ${reason}`, returnId, "Preparer");
    return true;
  };

  const escalateInsight = async ({ insightId, returnId, fieldId, note }) => {
    const targetInsight = mergedInsights.find((item) => item.id === insightId);
    if (targetInsight) {
      upsertInsights([
        {
          ...targetInsight,
          status: "escalated",
          reviewStatus: "Escalated",
          actionable: false
        }
      ]);
    }
    setReturnStateById((current) => ({
      ...current,
      [returnId]: {
        ...current[returnId],
        fieldOverrides: {
          ...(current[returnId]?.fieldOverrides ?? {}),
          [fieldId]: {
            ...(current[returnId]?.fieldOverrides?.[fieldId] ?? {}),
            reviewState: "Escalated"
          }
        }
      }
    }));
    pushAuditEvent(`Escalated AI insight for additional review. Note: ${note}`, returnId, "Preparer");
    return true;
  };

  const updateSurveyState = (clientId, updater) => {
    setSurveyStateByClientId((current) => {
      const nextClientState = updater(current[clientId] ?? {
        currentSectionIndex: 0,
        answers: {},
        submittedAt: null,
        manualItems: [],
        clarificationFlags: [],
        generatedItemsSnapshot: [],
        activity: []
      });

      return {
        ...current,
        [clientId]: nextClientState
      };
    });
  };

  const saveSurveyAnswers = (clientId, answerUpdates) => {
    updateSurveyState(clientId, (current) => ({
      ...current,
      answers: {
        ...(current.answers ?? {}),
        ...answerUpdates
      }
    }));
  };

  const saveSurveyProgress = (clientId, sectionIndex) => {
    updateSurveyState(clientId, (current) => ({
      ...current,
      currentSectionIndex: sectionIndex
    }));
  };

  const submitSurvey = (clientId) => {
    const client = clients.find((item) => item.id === clientId) ?? fallbackClient;
    const existingItems = combinedWorkflowItems.filter((item) => item.clientId === clientId);
    const surveyState = surveyStateByClientId[clientId] ?? {};
    const generated = generateChecklistFromSurvey({
      answers: surveyState.answers ?? {},
      client,
      existingRequirementKeys: buildExistingRequirementKeys(existingItems),
      manualItems: surveyState.manualItems ?? [],
      clarificationFlags: surveyState.clarificationFlags ?? [],
      previousGeneratedItems: surveyState.generatedItemsSnapshot ?? []
    });

    updateSurveyState(clientId, (current) => ({
      ...current,
      submittedAt: "2026-07-24 16:05",
      generatedItemsSnapshot: generated.items,
      activity: [
        {
          id: `survey-activity-submit-${Date.now()}`,
          title: "Client intake survey submitted",
          detail: `${generated.items.length} personalized checklist items generated from survey answers.`,
          time: "Today · 4:05 PM"
        },
        ...(current.activity ?? [])
      ]
    }));

    pushAuditEvent("Submitted client intake survey and generated personalized checklist.", clientId, "Client");
    return generated;
  };

  const addManualChecklistItem = (clientId, title) => {
    const client = clients.find((item) => item.id === clientId) ?? fallbackClient;
    updateSurveyState(clientId, (current) => ({
      ...current,
      manualItems: [
        {
          id: `manual-${clientId}-${Date.now()}`,
          title,
          description: "Manual checklist item added by the preparer.",
          category: "Firm follow-up",
          relatedReturnSection: "Return overview",
          relatedSurveyQuestion: "manualFollowUp",
          actionType: "answer",
          actionLabel: "Review answers",
          required: true,
          owner: client.name,
          dueDate: client.deadline,
          source: "manual"
        },
        ...(current.manualItems ?? [])
      ]
    }));
    pushAuditEvent(`Added manual intake checklist item: ${title}`, clientId, "Preparer");
  };

  const markSurveyAnswerForClarification = (clientId, questionId) => {
    updateSurveyState(clientId, (current) => {
      const existing = (current.clarificationFlags ?? []).find((item) => item.questionId === questionId);
      if (existing) {
        return current;
      }

      return {
        ...current,
        clarificationFlags: [
          {
            id: `clarify-${clientId}-${questionId}`,
            questionId,
            questionLabel: getSurveyQuestionLabel(questionId),
            note: "Please confirm or expand this survey answer before the firm continues review."
          },
          ...(current.clarificationFlags ?? [])
        ]
      };
    });
    pushAuditEvent(`Marked survey answer for clarification: ${getSurveyQuestionLabel(questionId)}`, clientId, "Preparer");
  };

  const value = {
    activeRole,
    currentUser,
    signOut,
    hasPermission,
    availableClients,
    availableReturns,
    activeClient,
    setActiveClientId: handleClientSelection,
    activeReturn,
    setActiveReturnId: handleReturnSelection,
    mockData: enrichedMockData,
    documentAnalyses,
    analysisStatusByDocumentId,
    batchAnalysisState,
    runDocumentAnalysis,
    runBatchDocumentAnalysis,
    acceptInsightRecommendation,
    saveFieldCorrection,
    escalateInsight,
    generatedRequestDrafts,
    documentFocusContext,
    setDocumentFocusContext,
    clearDocumentFocusContext,
    submitClientDocumentRequest,
    completeReviewerTask,
    documentExceptionQueue,
    verifyDocumentField,
    correctDocumentField,
    createInformationRequestDraft,
    confirmInformationRequest,
    escalateDocumentAlert,
    getNextDocumentException,
    surveyStateByClientId,
    intakeSummariesByClientId,
    saveSurveyAnswers,
    saveSurveyProgress,
    submitSurvey,
    addManualChecklistItem,
    markSurveyAnswerForClarification,
    roleConfig: getRoleConfig(activeRole)
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
