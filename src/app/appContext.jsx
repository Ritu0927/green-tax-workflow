import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildWorkflowItemsFromData, mockData } from "../data/mockData";
import { clientSurveySections, countCompletedSurveySections, getSurveyQuestionLabel } from "../data/clientSurveySchema";
import { analyzeDocument, compareDocumentToReturn, createTaskFromInsight, getInsightsForReturn } from "../services/mockAiService";
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
  const [documentAnalyses, setDocumentAnalyses] = useState({});
  const [analysisStatusByDocumentId, setAnalysisStatusByDocumentId] = useState({});
  const [generatedInsights, setGeneratedInsights] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [generatedDocumentRequests, setGeneratedDocumentRequests] = useState([]);
  const [generatedAuditEvents, setGeneratedAuditEvents] = useState([]);
  const [returnStateById, setReturnStateById] = useState({});
  const [surveyStateByClientId, setSurveyStateByClientId] = useState(loadSurveyState);

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

  const mergedClientActivity = useMemo(() => {
    const nextActivity = { ...safeMockData.clientActivity };

    Object.entries(surveyStateByClientId).forEach(([clientId, state]) => {
      if (!state?.activity?.length) {
        return;
      }

      nextActivity[clientId] = [...state.activity, ...(nextActivity[clientId] ?? [])];
    });

    return nextActivity;
  }, [safeMockData.clientActivity, surveyStateByClientId]);

  const mergedWorkflowItems = useMemo(
    () =>
      buildWorkflowItemsFromData({
        clients,
        returns: mergedReturns,
        documents: safeMockData.documents,
        documentRequests: mergedDocumentRequests,
        tasks: mergedTasks,
        messages: safeMockData.messages,
        clientActivity: mergedClientActivity,
        questionnaires: safeMockData.questionnaires
      }),
    [clients, mergedClientActivity, mergedDocumentRequests, mergedReturns, mergedTasks, safeMockData.documents, safeMockData.messages, safeMockData.questionnaires]
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

  const pushAuditEvent = (action, target, actor) => {
    setGeneratedAuditEvents((current) => [
      {
        id: `generated-audit-${Date.now()}-${current.length}`,
        actor: actor ?? currentUser?.name ?? "System",
        action,
        target,
        time: "2026-07-24 3:18 PM"
      },
      ...current
    ]);
  };

  const upsertInsights = (insights) => {
    setGeneratedInsights((current) => {
      const nextMap = new Map(current.map((item) => [item.id, item]));
      insights.forEach((item) => nextMap.set(item.id, item));
      return Array.from(nextMap.values());
    });
  };

  const runDocumentAnalysis = async (documentId) => {
    const targetDocument = safeMockData.documents.find((item) => item.id === documentId);
    if (!targetDocument) {
      return null;
    }

    setAnalysisStatusByDocumentId((current) => ({ ...current, [documentId]: "analyzing" }));

    const analysis = await analyzeDocument(documentId);
    const comparison = await compareDocumentToReturn(documentId, targetDocument.returnId);
    const insights = await getInsightsForReturn(targetDocument.returnId);
    const relatedInsights = insights.filter((item) => item.sourceDocumentId === documentId || item.returnId === targetDocument.returnId);

    const result = {
      ...analysis,
      comparison,
      insights: relatedInsights,
      analyzedAt: "2026-07-24 15:12",
      labels: ["AI-assisted review", "Mock analysis", "Human review required"]
    };

    setDocumentAnalyses((current) => ({ ...current, [documentId]: result }));
    upsertInsights(relatedInsights);
    setAnalysisStatusByDocumentId((current) => ({ ...current, [documentId]: "analysis_complete" }));
    pushAuditEvent(`Ran mock analysis for ${targetDocument.label}.`, documentId, "System");

    return result;
  };

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
    runDocumentAnalysis,
    acceptInsightRecommendation,
    saveFieldCorrection,
    escalateInsight,
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
