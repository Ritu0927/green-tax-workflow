export const roles = [
  { id: "client", label: "Client" },
  { id: "preparer", label: "Preparer" },
  { id: "reviewer", label: "Reviewer" },
  { id: "admin", label: "Admin" }
];

export const workflowStatuses = [
  "Not Started",
  "Waiting on Client",
  "In Preparation",
  "Ready for Review",
  "Changes Requested",
  "Approved",
  "Filed"
];

const teamMembers = [
  { id: "tm-001", name: "Maya Chen, CPA", role: "Reviewer", capacity: 11, activeReturns: 5 },
  { id: "tm-002", name: "Noah Patel", role: "Preparer", capacity: 14, activeReturns: 7 },
  { id: "tm-003", name: "Elena Brooks", role: "Preparer", capacity: 14, activeReturns: 6 },
  { id: "tm-004", name: "Jordan Lee", role: "Admin", capacity: 6, activeReturns: 2 }
];

const clients = [
  { id: "client-001", name: "Avery Stone", entity: "Individual", status: "Waiting on Client", deadline: "2026-08-15", preparer: "Noah Patel", reviewer: "Maya Chen, CPA", unreadMessages: 2, missingDocs: 2, returnId: "ret-2026-001", progress: 68, location: "Boston, MA", secureSession: "MFA enabled" },
  { id: "client-002", name: "Harbor Light Dental PLLC", entity: "Business", status: "In Preparation", deadline: "2026-08-21", preparer: "Elena Brooks", reviewer: "Maya Chen, CPA", unreadMessages: 0, missingDocs: 1, returnId: "ret-2026-002", progress: 81, location: "Providence, RI", secureSession: "MFA enabled" },
  { id: "client-003", name: "Lena Hoffman", entity: "Individual", status: "Ready for Review", deadline: "2026-08-09", preparer: "Noah Patel", reviewer: "Maya Chen, CPA", unreadMessages: 1, missingDocs: 0, returnId: "ret-2026-003", progress: 96, location: "Denver, CO", secureSession: "Trusted device" },
  { id: "client-004", name: "Northline Studio Inc.", entity: "Business", status: "Changes Requested", deadline: "2026-08-05", preparer: "Elena Brooks", reviewer: "Maya Chen, CPA", unreadMessages: 3, missingDocs: 0, returnId: "ret-2026-004", progress: 90, location: "Seattle, WA", secureSession: "MFA enabled" },
  { id: "client-005", name: "Owen Ramirez", entity: "Individual", status: "Not Started", deadline: "2026-09-12", preparer: "Noah Patel", reviewer: "Maya Chen, CPA", unreadMessages: 0, missingDocs: 4, returnId: "ret-2026-005", progress: 18, location: "Austin, TX", secureSession: "Email verification pending" },
  { id: "client-006", name: "Pine & Hill Ventures LLC", entity: "Business", status: "Approved", deadline: "2026-07-30", preparer: "Elena Brooks", reviewer: "Maya Chen, CPA", unreadMessages: 0, missingDocs: 0, returnId: "ret-2026-006", progress: 100, location: "Nashville, TN", secureSession: "MFA enabled" },
  { id: "client-007", name: "Camila Foster", entity: "Individual", status: "Filed", deadline: "2026-07-24", preparer: "Noah Patel", reviewer: "Maya Chen, CPA", unreadMessages: 0, missingDocs: 0, returnId: "ret-2026-007", progress: 100, location: "Chicago, IL", secureSession: "Trusted device" },
  { id: "client-008", name: "Blue Cedar Hospitality Group", entity: "Business", status: "Waiting on Client", deadline: "2026-08-19", preparer: "Elena Brooks", reviewer: "Maya Chen, CPA", unreadMessages: 2, missingDocs: 3, returnId: "ret-2026-008", progress: 54, location: "Phoenix, AZ", secureSession: "MFA enabled" },
  { id: "client-009", name: "Natalie Greene", entity: "Individual", status: "In Preparation", deadline: "2026-08-28", preparer: "Noah Patel", reviewer: "Maya Chen, CPA", unreadMessages: 0, missingDocs: 1, returnId: "ret-2026-009", progress: 74, location: "Raleigh, NC", secureSession: "Trusted device" },
  { id: "client-010", name: "Summit Bridge Advisors", entity: "Business", status: "Ready for Review", deadline: "2026-08-11", preparer: "Elena Brooks", reviewer: "Maya Chen, CPA", unreadMessages: 1, missingDocs: 0, returnId: "ret-2026-010", progress: 94, location: "New York, NY", secureSession: "MFA enabled" },
  { id: "client-011", name: "Jasper Cole", entity: "Individual", status: "Waiting on Client", deadline: "2026-08-03", preparer: "Noah Patel", reviewer: "Maya Chen, CPA", unreadMessages: 4, missingDocs: 2, returnId: "ret-2026-011", progress: 49, location: "Atlanta, GA", secureSession: "MFA enabled" },
  { id: "client-012", name: "Monarch Analytics LLC", entity: "Business", status: "In Preparation", deadline: "2026-08-24", preparer: "Elena Brooks", reviewer: "Maya Chen, CPA", unreadMessages: 0, missingDocs: 1, returnId: "ret-2026-012", progress: 72, location: "San Diego, CA", secureSession: "Trusted device" }
];

const returns = [
  { id: "ret-2026-001", clientId: "client-001", taxYear: "2025", form: "Form 1040", status: "Waiting on Client", owner: "Avery Stone", nextAction: "Upload final 1099-INT and confirm dependent care expenses.", urgency: "High", aiFlags: 2, reviewItems: 1, sections: ["Income", "Deductions", "Credits", "Payments"], dueDate: "2026-08-15", blockedBy: "Missing 1099-INT", stageNote: "Client action required before preparation can resume." },
  { id: "ret-2026-002", clientId: "client-002", taxYear: "2025", form: "Form 1120-S", status: "In Preparation", owner: "Elena Brooks", nextAction: "Reconcile officer compensation against payroll summary.", urgency: "Medium", aiFlags: 3, reviewItems: 2, sections: ["Revenue", "Payroll", "Deductions", "Shareholders"], dueDate: "2026-08-21", blockedBy: null, stageNote: "Preparer is resolving source variance before reviewer handoff." },
  { id: "ret-2026-003", clientId: "client-003", taxYear: "2025", form: "Form 1040", status: "Ready for Review", owner: "Maya Chen, CPA", nextAction: "Review charitable contribution substantiation.", urgency: "High", aiFlags: 1, reviewItems: 3, sections: ["Income", "Adjustments", "Schedule A"], dueDate: "2026-08-09", blockedBy: null, stageNote: "Return is complete enough for reviewer signoff." },
  { id: "ret-2026-004", clientId: "client-004", taxYear: "2025", form: "Form 1120", status: "Changes Requested", owner: "Elena Brooks", nextAction: "Resolve reviewer comment on meals deduction support.", urgency: "High", aiFlags: 2, reviewItems: 4, sections: ["Income", "COGS", "Deductions", "Balance Sheet"], dueDate: "2026-08-05", blockedBy: "Reviewer requested stronger support", stageNote: "Preparer must respond before approval can continue." },
  { id: "ret-2026-005", clientId: "client-005", taxYear: "2025", form: "Form 1040", status: "Not Started", owner: "Owen Ramirez", nextAction: "Complete onboarding checklist and upload ID documents.", urgency: "Low", aiFlags: 0, reviewItems: 0, sections: ["Onboarding", "Income", "Identity"], dueDate: "2026-09-12", blockedBy: "Client onboarding incomplete", stageNote: "Return cannot enter preparation until identity and intake are complete." },
  { id: "ret-2026-006", clientId: "client-006", taxYear: "2025", form: "Form 1065", status: "Approved", owner: "Maya Chen, CPA", nextAction: "Await e-file authorization package.", urgency: "Low", aiFlags: 1, reviewItems: 0, sections: ["Partnership", "Capital Accounts", "K-1"], dueDate: "2026-07-30", blockedBy: null, stageNote: "Approved and waiting on final client authorization." },
  { id: "ret-2026-007", clientId: "client-007", taxYear: "2025", form: "Form 1040", status: "Filed", owner: "System", nextAction: "Monitor acknowledgment and archive documents.", urgency: "Low", aiFlags: 0, reviewItems: 0, sections: ["Filed", "Archive"], dueDate: "2026-07-24", blockedBy: null, stageNote: "Filed returns remain viewable with secure audit history." },
  { id: "ret-2026-008", clientId: "client-008", taxYear: "2025", form: "Form 1065", status: "Waiting on Client", owner: "Blue Cedar Hospitality Group", nextAction: "Provide June bank statement and signed engagement letter.", urgency: "High", aiFlags: 1, reviewItems: 1, sections: ["Revenue", "Banking", "Partners"], dueDate: "2026-08-19", blockedBy: "Missing bank statement", stageNote: "Firm can prepare only after client uploads bank support." },
  { id: "ret-2026-009", clientId: "client-009", taxYear: "2025", form: "Form 1040", status: "In Preparation", owner: "Noah Patel", nextAction: "Validate HSA contribution limit against W-2 box 12.", urgency: "Medium", aiFlags: 2, reviewItems: 1, sections: ["Income", "Benefits", "Adjustments"], dueDate: "2026-08-28", blockedBy: null, stageNote: "Preparation is active with one AI exception to resolve." },
  { id: "ret-2026-010", clientId: "client-010", taxYear: "2025", form: "Form 1120-S", status: "Ready for Review", owner: "Maya Chen, CPA", nextAction: "Confirm shareholder basis support.", urgency: "High", aiFlags: 2, reviewItems: 3, sections: ["Revenue", "Shareholders", "Balance Sheet"], dueDate: "2026-08-11", blockedBy: null, stageNote: "Return is queued for final reviewer approval." },
  { id: "ret-2026-011", clientId: "client-011", taxYear: "2025", form: "Form 1040", status: "Waiting on Client", owner: "Jasper Cole", nextAction: "Respond to filing status clarification and upload W-2.", urgency: "High", aiFlags: 1, reviewItems: 0, sections: ["Identity", "Income", "Household"], dueDate: "2026-08-03", blockedBy: "Missing W-2 and household clarification", stageNote: "Multiple intake blockers remain open." },
  { id: "ret-2026-012", clientId: "client-012", taxYear: "2025", form: "Form 1120-S", status: "In Preparation", owner: "Elena Brooks", nextAction: "Review R&D credit carryforward support.", urgency: "Medium", aiFlags: 4, reviewItems: 2, sections: ["Credits", "Payroll", "State"], dueDate: "2026-08-24", blockedBy: null, stageNote: "Complex credit work requires more evidence review." }
];

const documents = [
  { id: "doc-001", clientId: "client-001", returnId: "ret-2026-001", type: "1099-INT", label: "First Harbor Bank 1099-INT", category: "Income", uploadDate: "2026-07-19", verification: "Verified", relatedSection: "Income", sourceFields: 4, secureAccess: "MFA Verified", maskedAccount: "••••2184", previewStatus: "Available", pageCount: 2 },
  { id: "doc-002", clientId: "client-001", returnId: "ret-2026-001", type: "Driver License", label: "State ID - Avery Stone", category: "Identity", uploadDate: "2026-07-18", verification: "Verified", relatedSection: "Identity", sourceFields: 2, secureAccess: "Restricted", maskedAccount: null, previewStatus: "Available", pageCount: 1 },
  { id: "doc-003", clientId: "client-002", returnId: "ret-2026-002", type: "W-2", label: "Officer Payroll Summary", category: "Payroll", uploadDate: "2026-07-12", verification: "Needs Review", relatedSection: "Payroll", sourceFields: 9, secureAccess: "Internal Only", maskedAccount: null, previewStatus: "Available", pageCount: 3 },
  { id: "doc-004", clientId: "client-002", returnId: "ret-2026-002", type: "Bank Statement", label: "Operating Account - June", category: "Banking", uploadDate: "2026-07-15", verification: "Verified", relatedSection: "Cash", sourceFields: 6, secureAccess: "MFA Verified", maskedAccount: "••••9281", previewStatus: "Available", pageCount: 5 },
  { id: "doc-005", clientId: "client-003", returnId: "ret-2026-003", type: "Donation Receipt", label: "Foundation Donation Receipt", category: "Deductions", uploadDate: "2026-07-09", verification: "Verified", relatedSection: "Schedule A", sourceFields: 1, secureAccess: "Standard", maskedAccount: null, previewStatus: "Available", pageCount: 1 },
  { id: "doc-006", clientId: "client-004", returnId: "ret-2026-004", type: "Expense Ledger", label: "Meals and Travel Extract", category: "Deductions", uploadDate: "2026-07-11", verification: "Needs Review", relatedSection: "Deductions", sourceFields: 14, secureAccess: "Internal Only", maskedAccount: null, previewStatus: "Available", pageCount: 8 },
  { id: "doc-007", clientId: "client-008", returnId: "ret-2026-008", type: "Bank Statement", label: "Hospitality Main Account - Missing", category: "Banking", uploadDate: null, verification: "Requested", relatedSection: "Banking", sourceFields: 0, secureAccess: "Pending Upload", maskedAccount: "••••4410", previewStatus: "Pending", pageCount: 0 },
  { id: "doc-008", clientId: "client-009", returnId: "ret-2026-009", type: "W-2", label: "Pineworks Labs W-2", category: "Income", uploadDate: "2026-07-13", verification: "Verified", relatedSection: "Income", sourceFields: 7, secureAccess: "MFA Verified", maskedAccount: null, previewStatus: "Available", pageCount: 2 },
  { id: "doc-009", clientId: "client-010", returnId: "ret-2026-010", type: "K-1", label: "Shareholder Basis Support", category: "Shareholders", uploadDate: "2026-07-16", verification: "Needs Review", relatedSection: "Shareholders", sourceFields: 5, secureAccess: "Restricted", maskedAccount: null, previewStatus: "Available", pageCount: 4 },
  { id: "doc-010", clientId: "client-011", returnId: "ret-2026-011", type: "W-2", label: "Pending W-2 Request", category: "Income", uploadDate: null, verification: "Requested", relatedSection: "Income", sourceFields: 0, secureAccess: "Pending Upload", maskedAccount: null, previewStatus: "Pending", pageCount: 0 },
  { id: "doc-011", clientId: "client-001", returnId: "ret-2026-001", type: "Questionnaire PDF", label: "Dependent Care Follow-up", category: "Credits", uploadDate: "2026-07-20", verification: "Needs Review", relatedSection: "Credits", sourceFields: 3, secureAccess: "Standard", maskedAccount: null, previewStatus: "Available", pageCount: 2 },
  { id: "doc-012", clientId: "client-012", returnId: "ret-2026-012", type: "Credit Memo", label: "R&D Carryforward Support", category: "Credits", uploadDate: "2026-07-18", verification: "Needs Review", relatedSection: "Credits", sourceFields: 5, secureAccess: "Internal Only", maskedAccount: null, previewStatus: "Available", pageCount: 6 }
];

const documentRequests = [
  { id: "req-001", clientId: "client-001", title: "Upload final 1099-INT", dueDate: "2026-07-25", owner: "Avery Stone", status: "Open", linkedDocumentId: "doc-001" },
  { id: "req-002", clientId: "client-008", title: "Provide June bank statement", dueDate: "2026-07-26", owner: "Blue Cedar Hospitality Group", status: "Open", linkedDocumentId: "doc-007" },
  { id: "req-003", clientId: "client-011", title: "Upload employer W-2", dueDate: "2026-07-27", owner: "Jasper Cole", status: "Open", linkedDocumentId: "doc-010" }
];

const tasks = [
  { id: "task-001", title: "Upload 1099-INT", clientId: "client-001", owner: "Avery Stone", dueDate: "2026-07-25", status: "Open", linkedTo: "doc-001", visibility: "Client", type: "Document Request" },
  { id: "task-002", title: "Review officer compensation variance", clientId: "client-002", owner: "Elena Brooks", dueDate: "2026-07-27", status: "In Progress", linkedTo: "ret-2026-002", visibility: "Internal", type: "Review Task" },
  { id: "task-003", title: "Approve Schedule A support", clientId: "client-003", owner: "Maya Chen, CPA", dueDate: "2026-07-24", status: "Review", linkedTo: "ret-2026-003", visibility: "Internal", type: "Approval" },
  { id: "task-004", title: "Respond to reviewer comment on meals expense", clientId: "client-004", owner: "Elena Brooks", dueDate: "2026-07-25", status: "Blocked", linkedTo: "ret-2026-004", visibility: "Internal", type: "Change Request" },
  { id: "task-005", title: "Complete identity verification", clientId: "client-005", owner: "Owen Ramirez", dueDate: "2026-07-31", status: "Open", linkedTo: "doc-002", visibility: "Client", type: "Onboarding" },
  { id: "task-006", title: "Obtain June bank statement", clientId: "client-008", owner: "Blue Cedar Hospitality Group", dueDate: "2026-07-26", status: "Open", linkedTo: "doc-007", visibility: "Client", type: "Document Request" },
  { id: "task-007", title: "Review HSA contribution limit", clientId: "client-009", owner: "Noah Patel", dueDate: "2026-07-28", status: "In Progress", linkedTo: "ret-2026-009", visibility: "Internal", type: "AI Review" },
  { id: "task-008", title: "Confirm shareholder basis", clientId: "client-010", owner: "Maya Chen, CPA", dueDate: "2026-07-29", status: "Review", linkedTo: "ret-2026-010", visibility: "Internal", type: "Approval" }
];

const messages = [
  { id: "msg-001", clientId: "client-001", channel: "Client", author: "Noah Patel", subject: "Final income documents", linkedTo: "ret-2026-001", unread: true, date: "2026-07-22", excerpt: "We only need the final 1099-INT to complete your income section." },
  { id: "msg-002", clientId: "client-001", channel: "Internal", author: "Maya Chen, CPA", subject: "AI confidence acceptable after doc upload", linkedTo: "ret-2026-001", unread: false, date: "2026-07-22", excerpt: "Once the bank document lands, this should move back into prep quickly." },
  { id: "msg-003", clientId: "client-004", channel: "Internal", author: "Maya Chen, CPA", subject: "Meals deduction support still weak", linkedTo: "doc-006", unread: true, date: "2026-07-21", excerpt: "Need cleaner support before approving the corporate deduction." },
  { id: "msg-004", clientId: "client-008", channel: "Client", author: "Elena Brooks", subject: "Missing bank statement request", linkedTo: "doc-007", unread: true, date: "2026-07-20", excerpt: "Please upload the June statement for the primary operating account." },
  { id: "msg-005", clientId: "client-003", channel: "Client", author: "Noah Patel", subject: "Return moved to review", linkedTo: "ret-2026-003", unread: false, date: "2026-07-21", excerpt: "Your return is complete on the preparation side and is now waiting for reviewer approval." },
  { id: "msg-006", clientId: "client-009", channel: "Internal", author: "Noah Patel", subject: "HSA carryover needs reviewer input", linkedTo: "ret-2026-009", unread: false, date: "2026-07-22", excerpt: "AI flagged a possible over-limit contribution, but W-2 support looks close." },
  { id: "msg-007", clientId: "client-011", channel: "Client", author: "Noah Patel", subject: "Clarify filing status", linkedTo: "ret-2026-011", unread: true, date: "2026-07-23", excerpt: "Please confirm whether your dependent lived with you more than six months of the year." }
];

const aiInsights = [
  { id: "ai-001", returnId: "ret-2026-001", recommendation: "Hold interest income line until missing 1099-INT is uploaded.", evidence: "Prior-year bank account ending 2184 and current account activity indicate interest was earned.", sourceDocument: "First Harbor Bank 1099-INT", confidence: 0.82, rationale: "Source account exists in current-year statements but the document is not yet present.", reviewStatus: "Awaiting Review" },
  { id: "ai-002", returnId: "ret-2026-002", recommendation: "Investigate officer compensation variance against payroll ledger.", evidence: "W-2 wage total differs from trial balance payroll by $8,420.", sourceDocument: "Officer Payroll Summary", confidence: 0.91, rationale: "Difference exceeds configured review threshold for officer compensation.", reviewStatus: "Open" },
  { id: "ai-003", returnId: "ret-2026-003", recommendation: "Verify charitable contribution receipt before final approval.", evidence: "Receipt image is present, but contribution acknowledgment language is partial.", sourceDocument: "Foundation Donation Receipt", confidence: 0.68, rationale: "Document appears complete visually but extracted acknowledgment sentence is truncated.", reviewStatus: "Needs Reviewer Decision" },
  { id: "ai-004", returnId: "ret-2026-009", recommendation: "Review HSA contribution amount against W-2 box 12 code W.", evidence: "Contribution total appears $600 above expected limit after employer contribution match.", sourceDocument: "Pineworks Labs W-2", confidence: 0.77, rationale: "AI matched prior-year carryover and current payroll records but needs human confirmation.", reviewStatus: "Awaiting Review" },
  { id: "ai-005", returnId: "ret-2026-010", recommendation: "Escalate shareholder basis support for reviewer confirmation.", evidence: "K-1 basis attachment and year-end equity rollforward disagree by $12,300.", sourceDocument: "Shareholder Basis Support", confidence: 0.89, rationale: "The discrepancy is material enough to block final approval.", reviewStatus: "Escalate" }
];

const reviewNotes = [
  { id: "note-001", returnId: "ret-2026-001", fieldId: "field-001", author: "Maya Chen, CPA", visibility: "Internal", date: "2026-07-22", body: "Do not clear interest income without source document. Client should remain owner." },
  { id: "note-002", returnId: "ret-2026-003", fieldId: "field-011", author: "Maya Chen, CPA", visibility: "Internal", date: "2026-07-21", body: "Receipt is acceptable if acknowledgment language can be read clearly on page one." },
  { id: "note-003", returnId: "ret-2026-004", fieldId: "field-017", author: "Elena Brooks", visibility: "Internal", date: "2026-07-22", body: "Awaiting cleaner meals ledger support from client accounting contact." }
];

const returnFieldGroups = {
  "ret-2026-001": [
    {
      section: "Income",
      fields: [
        { id: "field-001", label: "Taxable interest", value: "$1,284", sourceValue: "$1,284.12", sourceDocumentId: "doc-001", sourcePage: "Page 1", sourceField: "Box 1 Interest income", transformation: "Rounded to nearest dollar", confidence: 0.82, aiGenerated: true, verified: false, editable: false, locked: false, reviewState: "Awaiting Review" },
        { id: "field-002", label: "Wages", value: "$124,600", sourceValue: "$124,600", sourceDocumentId: "doc-008", sourcePage: "Page 1", sourceField: "Box 1 Wages", transformation: "Direct import", confidence: 0.98, aiGenerated: true, verified: true, editable: false, locked: true, reviewState: "Verified" }
      ]
    },
    {
      section: "Credits",
      fields: [
        { id: "field-003", label: "Dependent care expenses", value: "$3,200", sourceValue: "$3,200", sourceDocumentId: "doc-011", sourcePage: "Page 2", sourceField: "Provider payments", transformation: "Summed from questionnaire entries", confidence: 0.74, aiGenerated: true, verified: false, editable: true, locked: false, reviewState: "Awaiting Review" }
      ]
    }
  ],
  "ret-2026-002": [
    {
      section: "Payroll",
      fields: [
        { id: "field-004", label: "Officer compensation", value: "$318,420", sourceValue: "$310,000", sourceDocumentId: "doc-003", sourcePage: "Page 2", sourceField: "Officer payroll summary", transformation: "Mapped to officer comp line", confidence: 0.91, aiGenerated: true, verified: false, editable: true, locked: false, reviewState: "Awaiting Review" },
        { id: "field-005", label: "Payroll taxes", value: "$24,118", sourceValue: "$24,118", sourceDocumentId: "doc-004", sourcePage: "Page 4", sourceField: "Payroll tax withdrawals", transformation: "Direct import", confidence: 0.87, aiGenerated: true, verified: true, editable: false, locked: true, reviewState: "Verified" }
      ]
    }
  ],
  "ret-2026-003": [
    {
      section: "Schedule A",
      fields: [
        { id: "field-011", label: "Charitable contributions", value: "$7,500", sourceValue: "$7,500", sourceDocumentId: "doc-005", sourcePage: "Page 1", sourceField: "Contribution amount", transformation: "Direct import", confidence: 0.68, aiGenerated: true, verified: false, editable: true, locked: false, reviewState: "Needs Reviewer Decision" }
      ]
    }
  ],
  "ret-2026-004": [
    {
      section: "Deductions",
      fields: [
        { id: "field-017", label: "Meals deduction", value: "$18,240", sourceValue: "$22,800", sourceDocumentId: "doc-006", sourcePage: "Pages 3-5", sourceField: "Meals and entertainment extract", transformation: "Reduced to 80 percent deductible amount", confidence: 0.71, aiGenerated: true, verified: false, editable: true, locked: false, reviewState: "Changes Requested" }
      ]
    }
  ],
  "ret-2026-009": [
    {
      section: "Benefits",
      fields: [
        { id: "field-021", label: "HSA contribution deduction", value: "$4,750", sourceValue: "$5,350", sourceDocumentId: "doc-008", sourcePage: "Page 2", sourceField: "Box 12 code W", transformation: "Reduced by employer match estimate", confidence: 0.77, aiGenerated: true, verified: false, editable: true, locked: false, reviewState: "Awaiting Review" }
      ]
    }
  ],
  "ret-2026-010": [
    {
      section: "Shareholders",
      fields: [
        { id: "field-024", label: "Shareholder basis adjustment", value: "$66,400", sourceValue: "$78,700", sourceDocumentId: "doc-009", sourcePage: "Pages 2-3", sourceField: "Basis attachment", transformation: "Adjusted to match prior-year closing balance", confidence: 0.89, aiGenerated: true, verified: false, editable: true, locked: false, reviewState: "Escalate" }
      ]
    }
  ]
};

const auditEvents = [
  { id: "audit-001", actor: "Noah Patel", action: "Locked SSN field after identity verification", target: "client-001", time: "2026-07-22 14:18" },
  { id: "audit-002", actor: "Maya Chen, CPA", action: "Requested changes on meals deduction support", target: "ret-2026-004", time: "2026-07-21 16:42" },
  { id: "audit-003", actor: "Jordan Lee", action: "Reviewed admin access activity", target: "firm-security", time: "2026-07-20 09:06" },
  { id: "audit-004", actor: "System", action: "Masked bank account ending 2184 in client view", target: "doc-001", time: "2026-07-22 14:21" },
  { id: "audit-005", actor: "Maya Chen, CPA", action: "Approved identity document lock", target: "doc-002", time: "2026-07-22 10:13" }
];

const accessActivity = [
  { id: "access-001", user: "Avery Stone", role: "Client", event: "Secure session active", detail: "MFA confirmed 18 minutes ago", risk: "Low" },
  { id: "access-002", user: "Noah Patel", role: "Preparer", event: "Opened return workspace", detail: "Accessed Avery Stone 2025 return", risk: "Low" },
  { id: "access-003", user: "Maya Chen, CPA", role: "Reviewer", event: "Approved document lock", detail: "Identity document moved to verified state", risk: "Low" },
  { id: "access-004", user: "Jordan Lee", role: "Admin", event: "Permission policy edited", detail: "Seasonal staff export access removed", risk: "Medium" },
  { id: "access-005", user: "Blue Cedar Hospitality Group", role: "Client", event: "New device challenge", detail: "Additional verification required before document upload", risk: "Medium" }
];

const userAccounts = [
  { id: "user-001", name: "Avery Stone", role: "Client", access: "Own return only", mfa: "Enabled", status: "Active" },
  { id: "user-002", name: "Noah Patel", role: "Preparer", access: "Assigned returns", mfa: "Enabled", status: "Active" },
  { id: "user-003", name: "Elena Brooks", role: "Preparer", access: "Assigned returns", mfa: "Enabled", status: "Active" },
  { id: "user-004", name: "Maya Chen, CPA", role: "Reviewer", access: "Review queue", mfa: "Enabled", status: "Active" },
  { id: "user-005", name: "Jordan Lee", role: "Admin", access: "Firm settings and audit logs", mfa: "Enabled", status: "Active" }
];

const permissionGroups = [
  { capability: "View internal notes", client: "No", preparer: "Yes", reviewer: "Yes", admin: "Yes" },
  { capability: "Edit tax field values", client: "No", preparer: "Assigned only", reviewer: "Limited", admin: "Audit only" },
  { capability: "Approve return", client: "No", preparer: "No", reviewer: "Yes", admin: "Override only" },
  { capability: "Manage user roles", client: "No", preparer: "No", reviewer: "No", admin: "Yes" }
];

const securitySettings = [
  { id: "sec-001", label: "Require MFA for all firm users", state: "Enabled", owner: "Admin" },
  { id: "sec-002", label: "Mask SSNs in client-visible surfaces", state: "Enabled", owner: "System" },
  { id: "sec-003", label: "Restrict export access for seasonal staff", state: "Enabled", owner: "Admin" },
  { id: "sec-004", label: "Lock verified identity fields", state: "Enabled", owner: "Reviewer" }
];

const clientActivity = {
  "client-001": [
    { id: "act-001", title: "Identity document verified", detail: "Reviewer locked SSN after ID match.", time: "Today · 10:13 AM" },
    { id: "act-002", title: "Document request sent", detail: "CPA requested final 1099-INT.", time: "Yesterday · 4:40 PM" },
    { id: "act-003", title: "Dependent care questionnaire updated", detail: "Client saved follow-up answers.", time: "Yesterday · 9:18 AM" }
  ],
  "client-003": [
    { id: "act-004", title: "Return moved to review", detail: "Preparation completed and handed to reviewer.", time: "Yesterday · 1:11 PM" },
    { id: "act-005", title: "Donation receipt verified", detail: "Source document linked to Schedule A.", time: "Tuesday · 3:05 PM" }
  ],
  "client-005": [
    { id: "act-006", title: "Welcome checklist opened", detail: "Client began onboarding but has not uploaded ID.", time: "Today · 8:52 AM" }
  ]
};

const questionnaires = {
  "client-001": [
    { id: "q-001", label: "Personal details", status: "Complete" },
    { id: "q-002", label: "Dependent care", status: "Needs attention" },
    { id: "q-003", label: "Banking and refund", status: "In progress" }
  ],
  "client-005": [
    { id: "q-004", label: "Personal details", status: "In progress" },
    { id: "q-005", label: "Identity confirmation", status: "Not started" },
    { id: "q-006", label: "Income sources", status: "Not started" }
  ]
};

export const mockData = {
  teamMembers,
  clients,
  returns,
  documents,
  documentRequests,
  tasks,
  messages,
  aiInsights,
  reviewNotes,
  returnFieldGroups,
  auditEvents,
  accessActivity,
  userAccounts,
  permissionGroups,
  securitySettings,
  clientActivity,
  questionnaires
};
