# Green Ledger

A secure, AI-assisted tax workflow prototype for connected client intake, document review, preparation, and approval.

Green Ledger is one connected workflow rather than a collection of separate tools. The product links client intake, document evidence, exception review, return verification, reviewer follow-up, and administrative oversight inside a single role-based experience.

## 1. Product Overview

Tax engagements often break down into scattered documents, repeated client follow-ups, unclear ownership, manual review, disconnected communication, and limited visibility into how a value reached the return.

Green Ledger connects intake, document collection, AI-assisted exception review, task ownership, client communication, return evidence, reviewer decisions, permissions, and audit history. The current prototype demonstrates an individual Form 1040 workflow, but the underlying object model could support broader tax, audit, accounting, and advisory engagements.

## 2. Product Workflow

1. A user signs in through one shared login page.
2. The account’s assigned role determines access.
3. The client completes a guided intake survey.
4. Survey answers generate a personalized checklist.
5. The client uploads requested documents or submits requested evidence.
6. Documents are analyzed through a simulated local AI-assisted pipeline.
7. The system classifies documents, extracts fields, compares values, and identifies exceptions.
8. The preparer reviews unresolved exceptions instead of rechecking every document equally.
9. The preparer verifies, corrects, requests information, or escalates.
10. Confirmed requests appear in Client Workspace.
11. Verified evidence appears in Return Workspace.
12. Reviewer-visible items are routed for secondary review.
13. Admin users manage access, roles, security, and audit visibility.

## 3. Main Product Areas

### Client Workspace

Client Workspace merges the earlier client-home and collaboration concepts into one connected experience. It currently includes:

- current return status
- next recommended action
- guided intake survey
- personalized checklist
- confirmed document requests
- task ownership and due dates
- client-visible messages
- recent activity
- submitted evidence handoff into the document workflow

Survey answers and confirmed document requests flow into the same Action Checklist instead of creating separate task systems.

### CPA Dashboard

The CPA Dashboard is action-oriented rather than chart-heavy. It includes:

- prioritized work queue
- urgent deadlines
- waiting-on-client items
- document exceptions
- newly submitted evidence
- review-ready returns
- escalated items
- workload and ownership context
- search and filtering

The main question it answers is: what needs attention now?

### Documents

The Documents page is an exception-first review workspace. It includes:

- 10+ fictional tax documents for Avery Stone
- single-document selection
- multi-document selection
- select-all-visible
- batch analysis
- processing progress
- exception summary cards
- document preview
- extracted-fields review table
- return-value comparison
- source page and box location
- extraction confidence
- review status
- concise review alerts
- linked work
- Review next exception

Available actions:

- Verify field
- Correct extraction
- Request information
- Escalate

Behavior:

- Verify field records who verified the field and when.
- Correct extraction preserves the original extracted value and requires a reason.
- Request information creates a draft first and becomes client-visible only after confirmation.
- Escalate creates reviewer-visible work.
- Review next exception moves the preparer to the next unresolved item.

The analysis is simulated locally. No real AI provider, OCR service, or backend API is used.

### Return Workspace

Return Workspace includes:

- return sections and fields
- linked source documents
- source location
- extracted source value
- verification status
- verifier
- unresolved alert count
- AI-assisted recommendations
- manual correction
- escalation
- reviewer notes
- audit history

Traceability is embedded through source evidence rather than shown as a separate “Traceability” panel.

### Admin and Role Settings

Admin and Role Settings includes:

- user list
- assigned roles
- permission matrix
- security controls
- access activity
- audit visibility

This page is restricted to the administrator account.

## 4. Role-Based Access

Users do not choose their role in the UI. All users enter through one login page, and the signed-in account determines permissions.

### Client — Avery Stone

Can:

- access Client Workspace
- complete the intake survey
- view the personalized checklist
- open own documents
- submit requested evidence
- view own status
- view client-visible communication

Cannot:

- access CPA Dashboard
- access Return Workspace
- view internal notes
- view other clients
- access Admin and Role Settings

### Preparer — Noah Patel

Can:

- access CPA Dashboard
- review assigned returns
- access Documents
- verify fields
- correct extractions
- create client requests
- respond to AI-assisted insights
- add internal notes
- escalate issues

Cannot:

- approve the final return
- manage users or roles
- access Admin and Role Settings

### Reviewer — Maya Chen, CPA

Can:

- access review-ready work
- inspect preparer corrections
- review escalated document issues
- complete reviewer-assigned document work
- view relevant audit history
- use reviewer approval controls in Return Workspace where supported
- lock verified fields where supported

Cannot:

- manage users or firm-wide security
- access admin controls

### Administrator — Jordan Lee

Can:

- access Admin and Role Settings
- manage users and assigned roles
- review permissions
- inspect security activity and audit logs

Administrator access does not automatically grant unrestricted tax-editing privileges.

## 5. Demo Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| Client | Avery Stone | avery@demo.com | demo123 |
| Preparer | Noah Patel | noah@demo.com | demo123 |
| Reviewer | Maya Chen, CPA | maya@demo.com | demo123 |
| Admin | Jordan Lee | jordan@demo.com | demo123 |

These credentials exist only for prototype demonstration and must not be used in production.

## 6. AI-Assisted Document Review

The simulated pipeline is:

Document upload  
→ classification  
→ field extraction  
→ comparison with survey and return data  
→ deterministic checks  
→ exception creation  
→ task or request suggestion  
→ human decision

Implemented checks in the current local model include:

- missing expected document
- value mismatch
- low extraction confidence
- tax-year mismatch
- possible duplicate
- failed processing
- incomplete supporting information

The system produces review alerts, not final tax conclusions.

Green Ledger does not:

- use a real AI API
- use a real OCR provider
- use a tax-law engine
- automatically approve or file a return
- send a client request without human confirmation

## 7. Shared Exception Workflow

Document exceptions drive the rest of the application through one shared state path.

Examples:

- If a preparer confirms a request:
  - the alert becomes `Waiting on Client`
  - the request appears in Client Workspace
  - the dashboard reflects the status
  - activity and audit history update

- If a field is verified:
  - Documents shows `Verified`
  - Return Workspace shows verified evidence
  - related work updates
  - audit history records the actor and timestamp

- If an alert is escalated:
  - Documents shows `Escalated`
  - reviewer-visible work is created
  - dashboard ownership changes
  - audit history records the escalation

The product uses one shared state path rather than separate task systems for each page.

## 8. Client Intake Survey

The intake survey currently supports:

- guided multi-step intake
- plain-language questions
- conditional questions
- personalized checklist generation
- save-and-resume behavior through `localStorage`
- review and edit after answering
- generated requirements merged into existing workflow items
- duplicate checklist prevention

Examples:

- two employers → two W-2 requests
- bank interest → 1099-INT request
- mortgage interest → Form 1098 request
- dependent care → provider information request
- contractor income → 1099-NEC and expense records

## 9. Security and Trust

The product demonstrates security concepts through:

- one generic sign-in
- predefined permissions
- protected routes
- role-based navigation
- least-privilege access
- masked sensitive values
- MFA and secure-session indicators
- audit history
- verified and locked states
- internal information hidden from clients
- human review of AI-assisted recommendations

This prototype demonstrates security through frontend behavior and interface design. It does not implement production authentication, encryption, secure document storage, or regulatory compliance controls.

## 10. How Green Ledger Addresses the 10 Challenges

| Challenge | Current implementation |
|---|---|
| Traceability | Return fields link to source documents, locations, extracted values, verification state, and audit history. |
| Collaboration | Tasks, document requests, messages, and activity remain connected to the same workflow item. |
| Where to start | Client Workspace presents the next action, survey progress, and personalized checklist. |
| Navigation | Dashboard, Documents, Client Workspace, and Return Workspace preserve client, return, document, alert, and field context. |
| Roles | Fixed demo accounts demonstrate separate client, preparer, reviewer, and administrator permissions. |
| Status | Returns, documents, alerts, requests, and tasks use consistent statuses and ownership. |
| Dashboard | Firm users receive a prioritized operational queue instead of passive reporting. |
| Affordances | Clickable, editable, verified, locked, selected, and disabled states are visually clear. |
| Complexity | Search, filters, batch actions, summary counts, and progressive disclosure support larger document sets. |
| Trustworthy AI | AI-assisted findings include evidence, confidence, rationale, human actions, and auditability. |

## 11. Technical Architecture

This repository currently uses:

- React
- Vite
- JavaScript
- React Router
- CSS
- Context API
- localStorage
- local mock data
- deterministic local analysis service
- local asynchronous simulation

## 12. Project Structure

```text
src/
├── app/
├── components/
├── context/
├── data/
├── pages/
├── services/
├── styles/
└── utils/
```

- `app/`: shell, router, and shared application state
- `components/`: reusable UI such as top bar, sidebar, badges, and protected routes
- `context/`: authentication context for demo sign-in and session persistence
- `data/`: demo users, returns, documents, analysis definitions, and survey schema
- `pages/`: Client Workspace, Dashboard, Return Workspace, Documents, Login, and Admin
- `services/`: local simulated analysis and workflow helpers
- `styles/`: shared design tokens and layout rules
- `utils/`: permissions, checklist generation, and formatting helpers

Important implementation files include:

- `src/data/documents.js`
- `src/data/documentAnalysis.js`
- `src/services/mockAiService.js`
- `src/app/appContext.jsx`
- `src/utils/permissions.js`

## 13. Running the Project

```bash
npm install
npm run dev
npm run build
```

There is currently no lint script and no test script in `package.json`.

## 14. Recommended Product Walkthrough

1. Sign in as Avery Stone.
2. Show the client’s next action and survey-generated checklist.
3. Show a document request or submitted item.
4. Sign in as Noah Patel.
5. Open a document exception from the CPA Dashboard.
6. Show attention filters or batch processing on Documents.
7. Open a selected document.
8. Show the preview, extracted fields, return comparison, and alert.
9. Verify, correct, request information, or escalate.
10. Use Review next exception.
11. Show the updated evidence in Return Workspace.
12. Sign in as Maya Chen and show reviewer work.
13. Sign in as Jordan Lee and show admin-only access.

This sequence fits a 3–5 minute demonstration.

## 15. GreenGrowth CPA Relevance

Green Ledger is a strong conceptual fit for a growing, distributed, multi-service CPA firm because it demonstrates needs that are common in that environment:

- industry-specific intake
- personalized document checklists
- exception-first document review
- distributed-team continuity
- clear task ownership
- connected client communication
- human-controlled AI assistance
- strong auditability
- consistent workflows across tax, audit, accounting, and advisory services

The current Form 1040 scenario is a prototype configuration. The same object model could be adapted to:

- business tax
- audit and assurance
- monthly accounting close
- CFO services
- advisory engagements
- industry-specific workflows

This is framed as a proposed fit, not a claim about any private internal GreenGrowth CPA systems.

## 16. Key Product Decisions

- one connected platform instead of 10 disconnected concepts
- Client Home and Collaboration merged into Client Workspace
- generic sign-in with account-assigned permissions
- role selector removed from the main product interface
- exception-first document review
- batch analysis with individual exception handling
- shared task and audit state
- request drafts require confirmation
- traceability embedded into the review experience
- AI remains assistive and human-controlled
- connected navigation preserves workflow context

## 17. Prototype Limitations

- frontend-only
- demo authentication
- `localStorage` session persistence
- simulated AI and OCR behavior
- deterministic document checks
- fictional documents and client data
- no backend or database
- no real secure document storage
- no tax calculations
- no filing integration
- no external communication delivery
- no real-time collaboration
- no production compliance controls
- no legal or tax advice

These omissions are intentional so the submission stays focused on product workflow and user experience.

## 18. Future Enhancements

- production identity and access management
- secure document storage
- real OCR and document classification
- configurable firm-specific rules
- tax and audit software integrations
- engagement templates by service and industry
- compliance-grade logging
- real notification delivery
- accessibility testing
- usability testing with clients and tax professionals

## 19. Final Submission Statement

Green Ledger demonstrates how client intake, document evidence, AI-assisted exception review, task ownership, professional verification, reviewer oversight, permissions, and audit history can work together in one understandable CPA workflow.
