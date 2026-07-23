const routeMatrix = {
  client: {
    "client-home": "full",
    "cpa-dashboard": "hidden",
    "return-workspace": "limited",
    documents: "limited",
    collaboration: "limited",
    "admin-settings": "hidden"
  },
  preparer: {
    "client-home": "limited",
    "cpa-dashboard": "full",
    "return-workspace": "full",
    documents: "full",
    collaboration: "full",
    "admin-settings": "limited"
  },
  reviewer: {
    "client-home": "limited",
    "cpa-dashboard": "full",
    "return-workspace": "full",
    documents: "full",
    collaboration: "full",
    "admin-settings": "limited"
  },
  admin: {
    "client-home": "limited",
    "cpa-dashboard": "full",
    "return-workspace": "full",
    documents: "full",
    collaboration: "full",
    "admin-settings": "full"
  }
};

const roleConfig = {
  client: {
    label: "Client",
    accent: "var(--accent-teal)",
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
      "/": "Clients are redirected to the calm onboarding surface from the main navigation.",
      "/client-home": "Clear next steps, status visibility, and secure communication for first-time tax clients.",
      "/cpa-dashboard": "This route stays visible in the prototype but is hidden from client navigation.",
      "/return-workspace": "Clients can review only the portions of the return relevant to their outstanding actions.",
      "/documents": "Secure document upload, verification visibility, and missing-item tracking.",
      "/collaboration": "Client messages and open requests stay separate from internal firm notes.",
      "/admin-settings": "Administrative controls are restricted by role."
    }
  },
  preparer: {
    label: "Preparer",
    accent: "var(--accent-blue)",
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
      "/client-home": "Preview of the client-facing onboarding surface from the firm perspective.",
      "/cpa-dashboard": "Priority queue, return statuses, and workload signals organized around next actions.",
      "/return-workspace": "Primary review surface linking tax values, documents, AI guidance, and approval controls.",
      "/documents": "Document intake, verification state, secure access indicators, and return-section mapping.",
      "/collaboration": "Contextual messages, internal notes, requests, and assigned work connected to returns.",
      "/admin-settings": "Read-only preview of security and role controls unless elevated to admin."
    }
  },
  reviewer: {
    label: "Reviewer",
    accent: "var(--accent-gold)",
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
      "/": "Review-focused queue emphasizing evidence quality, AI uncertainty, and change requests.",
      "/client-home": "Reviewers can inspect the client experience without editing client-owned content.",
      "/cpa-dashboard": "Prioritized review workload with owner and deadline context.",
      "/return-workspace": "Evidence-driven review surface with approval, escalation, and audit visibility.",
      "/documents": "Document verification and source traceability support final review.",
      "/collaboration": "Reviewers can request changes and keep internal notes separate from client messages.",
      "/admin-settings": "Security settings remain limited without admin privileges."
    }
  },
  admin: {
    label: "Admin",
    accent: "var(--accent-slate)",
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
      "/": "Operational view with full access to staffing, security settings, and audit oversight.",
      "/client-home": "Admins can preview the client experience while preserving least-privilege access patterns.",
      "/cpa-dashboard": "Team capacity and high-risk returns stay visible alongside operational priorities.",
      "/return-workspace": "Admins can audit approval history and field locking without acting as preparers.",
      "/documents": "Document access is logged and verified labels indicate controlled handling.",
      "/collaboration": "Message separation and ownership remain visible across the firm.",
      "/admin-settings": "Role, permission, and access activity controls for the prototype."
    }
  }
};

export function getRouteAccess(role, routeKey) {
  return routeMatrix[role]?.[routeKey] ?? "hidden";
}

export function getRoleConfig(role) {
  return roleConfig[role] ?? roleConfig.preparer;
}

export function canEditField(role) {
  return role === "preparer" || role === "reviewer";
}

export function canApproveReturn(role) {
  return role === "reviewer" || role === "admin";
}

export function canManageSecurity(role) {
  return role === "admin";
}

export function canViewInternalNotes(role) {
  return role !== "client";
}
