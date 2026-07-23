import React, { createContext, useContext, useState } from "react";
import { mockData, roles } from "../data/mockData";

const AppContext = createContext(null);

const fallbackRoles = [
  { id: "client", label: "Client" },
  { id: "preparer", label: "Preparer" },
  { id: "reviewer", label: "Reviewer" },
  { id: "admin", label: "Admin" }
];

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

const fallbackRoleConfig = {
  label: "Preparer",
  pageTitles: {
    "/": "CPA Dashboard",
    "/client-home": "Client Home",
    "/cpa-dashboard": "CPA Dashboard",
    "/return-workspace": "Return Workspace",
    "/documents": "Documents",
    "/collaboration": "Collaboration and Tasks",
    "/admin-settings": "Admin and Role Settings"
  },
  pageDescriptions: {
    "/": "Action-oriented operational view for active returns, missing items, and upcoming deadlines.",
    "/client-home": "Clear next steps, status visibility, and secure communication for first-time tax clients.",
    "/cpa-dashboard": "Priority queue, return statuses, and workload signals organized around next actions.",
    "/return-workspace": "Primary review surface linking tax values, documents, AI guidance, and approval controls.",
    "/documents": "Document intake, verification state, secure access indicators, and return-section mapping.",
    "/collaboration": "Contextual messages, internal notes, requests, and assigned work connected to returns.",
    "/admin-settings": "Role, permission, and access activity controls for the prototype."
  }
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

export function AppProvider({ children }) {
  const [activeRole, setActiveRole] = useState("preparer");
  const [currentClientId, setCurrentClientId] = useState("client-001");
  const [currentReturnId, setCurrentReturnId] = useState("ret-2026-001");

  const safeMockData = mockData && Array.isArray(mockData.clients) && Array.isArray(mockData.returns)
    ? mockData
    : fallbackMockData;
  const clients = safeMockData.clients;
  const returns = safeMockData.returns;
  const safeRoles = Array.isArray(roles) ? roles : fallbackRoles;

  const activeClient = clients.find((client) => client.id === currentClientId) ?? clients[0] ?? fallbackClient;
  const activeReturn = returns.find((item) => item.id === currentReturnId) ?? returns[0] ?? fallbackReturn;

  const handleClientSelection = (clientId) => {
    const nextClient = clients.find((client) => client.id === clientId);
    setCurrentClientId(clientId);
    if (nextClient?.returnId) {
      setCurrentReturnId(nextClient.returnId);
    }
  };

  const handleReturnSelection = (returnId) => {
    const nextReturn = returns.find((item) => item.id === returnId);
    setCurrentReturnId(returnId);
    if (nextReturn?.clientId) {
      setCurrentClientId(nextReturn.clientId);
    }
  };

  const value = {
    roles: safeRoles,
    activeRole,
    setActiveRole,
    activeClient,
    setActiveClientId: handleClientSelection,
    activeReturn,
    setActiveReturnId: handleReturnSelection,
    mockData: safeMockData,
    roleConfig: fallbackRoleConfig,
    getRouteAccess: () => "full"
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
