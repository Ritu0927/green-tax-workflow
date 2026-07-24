export const permissionsByRole = {
  client: [
    "viewOwnWorkspace",
    "viewOwnDocuments",
    "completeClientSurvey",
    "uploadDocuments",
    "viewOwnReturnStatus",
    "viewClientMessages"
  ],
  preparer: [
    "viewFirmDashboard",
    "viewAssignedReturns",
    "viewDocuments",
    "editReturnValues",
    "respondToAiInsights",
    "addInternalNotes",
    "viewAuditHistory",
    "viewClientWorkspacePreview"
  ],
  reviewer: [
    "viewFirmDashboard",
    "viewAssignedReturns",
    "viewDocuments",
    "reviewDocuments",
    "respondToAiInsights",
    "addInternalNotes",
    "approveReturns",
    "lockVerifiedFields",
    "viewAuditHistory",
    "viewClientWorkspacePreview"
  ],
  admin: [
    "manageUsers",
    "manageRoles",
    "viewSecuritySettings",
    "viewFirmAccessActivity",
    "reassignReturns",
    "viewAuditHistory"
  ]
};

export const navigationItems = [
  {
    to: "/client-workspace",
    label: "Client Workspace",
    key: "client-workspace",
    requiredAnyPermissions: ["viewOwnWorkspace"]
  },
  {
    to: "/dashboard",
    label: "CPA Dashboard",
    key: "dashboard",
    requiredAnyPermissions: ["viewFirmDashboard"]
  },
  {
    to: "/return-workspace",
    label: "Return Workspace",
    key: "return-workspace",
    requiredAnyPermissions: ["viewAssignedReturns", "reviewDocuments"]
  },
  {
    to: "/documents",
    label: "Documents",
    key: "documents",
    requiredAnyPermissions: ["viewOwnDocuments", "viewDocuments"]
  },
  {
    to: "/admin-settings",
    label: "Admin and Role Settings",
    key: "admin-settings",
    requiredAnyPermissions: ["manageUsers", "manageRoles", "viewSecuritySettings", "viewFirmAccessActivity"]
  }
];

export const routePermissions = {
  "/client-workspace": ["viewOwnWorkspace", "viewClientWorkspacePreview"],
  "/dashboard": ["viewFirmDashboard"],
  "/return-workspace": ["viewAssignedReturns", "reviewDocuments"],
  "/documents": ["viewOwnDocuments", "viewDocuments"],
  "/admin-settings": ["manageUsers", "manageRoles", "viewSecuritySettings", "viewFirmAccessActivity"]
};

const roleConfig = {
  client: {
    label: "Client",
    pageTitles: {
      "/client-workspace": "Client Workspace",
      "/documents": "Documents"
    },
    pageDescriptions: {
      "/client-workspace": "Unified return progress, intake tasks, client-visible communication, and recent activity for your return.",
      "/documents": "Secure document upload, verification visibility, and missing-item tracking for your return."
    }
  },
  preparer: {
    label: "Preparer",
    pageTitles: {
      "/dashboard": "CPA Dashboard",
      "/client-workspace": "Client Workspace",
      "/return-workspace": "Return Workspace",
      "/documents": "Documents"
    },
    pageDescriptions: {
      "/dashboard": "Action-oriented operational view for assigned returns, missing items, and approaching deadlines.",
      "/client-workspace": "Preview of the client-facing workspace where intake, action items, and communication stay connected.",
      "/return-workspace": "Primary preparation surface linking tax values, source documents, AI-assisted review, and correction controls.",
      "/documents": "Document intake, verification state, secure access indicators, and return-section mapping."
    }
  },
  reviewer: {
    label: "Reviewer",
    pageTitles: {
      "/dashboard": "CPA Dashboard",
      "/client-workspace": "Client Workspace",
      "/return-workspace": "Return Workspace",
      "/documents": "Documents"
    },
    pageDescriptions: {
      "/dashboard": "Review-focused queue emphasizing evidence quality, escalations, and returns ready for signoff.",
      "/client-workspace": "Reviewers can inspect the client-facing workflow without changing client-visible tasks directly.",
      "/return-workspace": "Evidence-driven review surface with approval, escalation, and audit visibility.",
      "/documents": "Document verification and source traceability support final review."
    }
  },
  admin: {
    label: "Administrator",
    pageTitles: {
      "/admin-settings": "Admin and Role Settings"
    },
    pageDescriptions: {
      "/admin-settings": "User, role, security, and access-activity controls for the prototype."
    }
  }
};

export function hasPermissionForRole(role, permission) {
  return permissionsByRole[role]?.includes(permission) ?? false;
}

export function hasAnyPermissionForRole(role, permissions) {
  return permissions.some((permission) => hasPermissionForRole(role, permission));
}

export function getDefaultRouteForRole(role) {
  switch (role) {
    case "client":
      return "/client-workspace";
    case "admin":
      return "/admin-settings";
    case "preparer":
    case "reviewer":
    default:
      return "/dashboard";
  }
}

export function canAccessRoute(role, path) {
  const requiredPermissions = routePermissions[path];
  if (!requiredPermissions) {
    return false;
  }

  return hasAnyPermissionForRole(role, requiredPermissions);
}

export function getNavigationForRole(role) {
  return navigationItems.filter((item) => hasAnyPermissionForRole(role, item.requiredAnyPermissions));
}

export function getRoleConfig(role) {
  return roleConfig[role] ?? roleConfig.preparer;
}
