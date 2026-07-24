export const demoUsers = [
  {
    id: "user-demo-client",
    name: "Avery Stone",
    email: "avery@demo.com",
    password: "demo123",
    role: "client",
    roleLabel: "Client",
    accessType: "Own return only",
    clientId: "client-001",
    defaultRoute: "/client-workspace",
    defaultClientId: "client-001",
    defaultReturnId: "ret-2026-001",
    secureSession: "Trusted device",
    recentLogin: "Today · 10:02 AM"
  },
  {
    id: "user-demo-preparer",
    name: "Noah Patel",
    email: "noah@demo.com",
    password: "demo123",
    role: "preparer",
    roleLabel: "Preparer",
    accessType: "Assigned returns",
    allowedClientIds: ["client-001", "client-003", "client-005", "client-007", "client-009", "client-011"],
    defaultRoute: "/dashboard",
    defaultClientId: "client-001",
    defaultReturnId: "ret-2026-001",
    secureSession: "MFA enabled",
    recentLogin: "Today · 9:14 AM"
  },
  {
    id: "user-demo-reviewer",
    name: "Maya Chen, CPA",
    email: "maya@demo.com",
    password: "demo123",
    role: "reviewer",
    roleLabel: "Reviewer",
    accessType: "Review queue",
    allowedClientIds: ["client-001", "client-002", "client-003", "client-004", "client-005", "client-006", "client-007", "client-008", "client-009", "client-010", "client-011", "client-012"],
    defaultRoute: "/dashboard",
    defaultClientId: "client-003",
    defaultReturnId: "ret-2026-003",
    secureSession: "MFA enabled",
    recentLogin: "Today · 8:41 AM"
  },
  {
    id: "user-demo-admin",
    name: "Jordan Lee",
    email: "jordan@demo.com",
    password: "demo123",
    role: "admin",
    roleLabel: "Administrator",
    accessType: "Firm settings and audit logs",
    defaultRoute: "/admin-settings",
    secureSession: "MFA enabled",
    recentLogin: "Today · 8:03 AM"
  }
];

export const demoUserById = Object.fromEntries(demoUsers.map((user) => [user.id, user]));
