# Green Ledger

A secure, AI-assisted tax workflow prototype connecting clients, preparers, reviewers, and administrators.

Green Ledger is a single connected tax workflow rather than a collection of separate tools. The product is designed to help clients understand what to do next, help CPA teams prioritize and prepare returns, help reviewers verify work and approve returns, and help administrators manage access and oversight.

## 1. Product Overview

Tax preparation often breaks down into scattered documents, repeated client follow-ups, unclear ownership, disconnected communication, and limited visibility into how return values were produced.

Green Ledger brings client intake, checklist generation, document collection, preparation, review, communication, AI-assisted checks, and administration into one coherent workflow. The prototype focuses on how work moves across roles while keeping evidence, next actions, and permissions understandable.

## 2. Original Scope

The original challenge was to address all 10 product areas through one coherent tax platform prototype:

1. Traceability
2. Collaboration
3. Where to start
4. Navigation
5. Roles
6. Status
7. Dashboard
8. Affordances
9. Complexity
10. Trustworthy AI

Green Ledger does not treat these as 10 disconnected screens. Each challenge is expressed inside the same tax-return workflow, from intake through review and administration.

## 3. Product Workflow

1. A client signs in through the shared demo login.
2. The client completes a guided intake survey in Client Workspace.
3. Survey answers generate a personalized checklist of required follow-up items.
4. The client reviews requests, opens the document workflow, and responds to intake tasks.
5. Documents move through a mocked AI-assisted analysis flow.
6. The system extracts fields, compares them to return data, and generates review insights.
7. Suggested tasks or document requests are created for the appropriate person.
8. A preparer reviews source documents, checklist items, and return values.
9. A reviewer verifies the work, escalates issues, or approves review actions.
10. An administrator manages users, permissions, security settings, and audit visibility.

## 4. Main Product Areas

### Client Workspace

Client Workspace combines:

- return status
- next recommended action
- guided intake survey
- personalized checklist
- document requests
- task ownership
- client-visible messages
- recent activity

This area intentionally merges the earlier client-home and collaboration concepts so that work and communication stay tied to the same return instead of being repeated across separate screens.

### CPA Dashboard

The dashboard is action-oriented rather than report-oriented. It includes:

- prioritized return queue
- urgent items
- waiting-on-client work
- returns ready for review
- deadlines
- workload and capacity signals
- search and filters

The main surface is designed to answer what needs attention next, not just to summarize totals.

### Return Workspace

Return Workspace is the core review surface. It includes:

- return sections and tax fields
- linked source documents
- source location and transformation details
- AI-assisted review suggestions
- manual correction flow
- recommendation acceptance and escalation actions
- reviewer notes
- audit history

Traceability is embedded through source evidence inside the field-review flow rather than exposed as a separate product label.

### Documents

The Documents area includes:

- secure document registry
- document category and related return section
- verification status
- secure access indicators
- document preview placeholder
- mocked AI analysis trigger
- extracted fields
- confidence levels
- review alerts

### Admin and Role Settings

The administrator area includes:

- user list
- assigned roles
- permission matrix
- security settings
- access activity
- audit logs

This area is restricted to the administrator account.

## 5. Role-Based Experience

All users enter through one generic sign-in page. The application determines the role from the signed-in account rather than asking the user to choose a role in the product UI.

### Client

Can:

- view their own workspace
- complete the intake survey
- review checklist items
- open their own document workflow
- view client-visible messages
- see their own return status

Cannot:

- see other clients
- see internal notes
- edit return values
- use firm review actions
- access firm or administration pages

### Preparer

Can:

- view the dashboard for assigned work
- open assigned returns
- review documents
- correct return values
- respond to AI-assisted insights
- add internal notes
- create client-facing follow-up items through the intake workflow

Cannot:

- approve final returns
- manage users or roles
- access Admin and Role Settings

### Reviewer

Can:

- view dashboard work
- review return-workspace evidence
- approve review actions
- escalate issues
- inspect audit history
- access reviewer-facing notes and review controls

Cannot:

- manage users
- assign roles
- change firm-wide security settings

### Administrator

Can:

- manage users and assigned roles
- review permissions
- view security settings
- inspect firm-wide access activity
- inspect audit logs

Administrator access does not automatically grant unrestricted tax-editing privileges. In the current implementation, the administrator experience is centered on administration rather than return preparation.

## 6. Demo Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| Client | Avery Stone | avery@demo.com | demo123 |
| Preparer | Noah Patel | noah@demo.com | demo123 |
| Reviewer | Maya Chen, CPA | maya@demo.com | demo123 |
| Admin | Jordan Lee | jordan@demo.com | demo123 |

These credentials are for prototype demonstration only and must not be used in a production environment.

## 7. AI-Assisted Review

The AI workflow is mocked.

The simulated pipeline is:

Document upload or selection  
→ document classification  
→ field extraction  
→ comparison with return data  
→ rule checks  
→ review insight  
→ task suggestion  
→ human decision

The current mock service supports workflow checks such as:

- missing supporting document
- value mismatch
- low extraction confidence
- tax-year mismatch
- possible duplicate document

The system does not independently file, approve, or silently modify a return.

Human actions in the current prototype:

- Accept recommendation
- Correct value
- Escalate

Accepted actions update shared local state and audit history where implemented.

## 8. Client Intake Survey

The survey personalizes document collection and follow-up work. It covers:

- personal and household
- employment and income
- investments and banking
- housing, education, and deductions
- business and other situations

Examples of generated checklist logic:

- multiple employers -> multiple W-2 requests
- bank interest -> 1099-INT follow-up
- dependent care -> provider details and amount confirmation
- mortgage interest -> Form 1098 request
- charitable donations -> contribution support request
- contractor income -> 1099-NEC and business-expense follow-up

Generated requirements are merged into the existing Action Checklist instead of creating a separate checklist system.

Survey progress is saved and restored through `localStorage`, so the prototype supports save-and-resume behavior after refresh.

## 9. Security and Trust

The interface demonstrates security concepts through:

- predefined account permissions
- protected routes
- role-based navigation
- least-privilege access
- masked sensitive information
- MFA and secure-session indicators
- audit history
- verified and locked states
- separation of client-visible and internal information
- human review of AI suggestions

This prototype demonstrates security through frontend behavior and interface design. It does not implement production authentication, encryption, secure storage, or compliance controls.

## 10. How the Product Addresses the 10 Challenges

| Challenge | How Green Ledger addresses it |
|---|---|
| Traceability | Return values link to source documents, locations, and transformations through Source Evidence. |
| Collaboration | Messages, tasks, requests, and notes stay connected to the same return workflow. |
| Where to start | The client sees a guided intake survey, a clear next action, and a personalized checklist. |
| Navigation | Dashboard rows, return fields, documents, tasks, and notifications move users to related work. |
| Roles | Fixed demo accounts enforce distinct client, preparer, reviewer, and admin experiences. |
| Status | Returns and workflow items use consistent statuses, owners, and next actions. |
| Dashboard | CPA staff receive a prioritized operational queue rather than passive reporting. |
| Affordances | Editable, locked, verified, clickable, and AI-assisted states are visually distinct. |
| Complexity | Search, filters, summaries, lists, and progressive disclosure support larger mock datasets. |
| Trustworthy AI | Every insight includes evidence, rationale, confidence, status, and a human decision path. |

## 11. Technology

- React
- Vite
- JavaScript
- React Router
- CSS
- local mock data
- `localStorage`
- local component state
- shared context state

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

- `app/`: shell, router, shared application state, and error boundary
- `components/`: reusable UI such as top bar, sidebar, badges, and route protection
- `context/`: authentication context for demo sign-in and session persistence
- `data/`: mock returns, documents, demo users, and intake survey schema
- `pages/`: main product surfaces such as Client Workspace, Dashboard, Return Workspace, Documents, Login, and Admin
- `services/`: mocked AI-assisted document-review pipeline
- `styles/`: design tokens and shared layout styles
- `utils/`: permission mapping, checklist generation, and formatting helpers

## 13. Running the Project

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Vite serves the local development app and prints the active local URL when `npm run dev` starts.

## 14. Prototype Walkthrough

1. Sign in as Avery Stone.
2. Continue or review the intake survey.
3. Show the generated checklist and document follow-up items.
4. Sign out and sign in as Noah Patel.
5. Open the CPA Dashboard and choose a return needing attention.
6. Open Documents and run mocked analysis on the First Harbor Bank 1099-INT.
7. Open Return Workspace and correct, accept, or escalate the review item.
8. Sign out and sign in as Maya Chen to show reviewer-facing access and approval controls.
9. Sign out and sign in as Jordan Lee to show restricted administration controls.

## 15. Key Design Decisions

- one connected system instead of 10 disconnected screens
- Client Home and Collaboration merged into Client Workspace
- role selector removed from the product-style interface
- account permissions determined at sign-in
- traceability embedded directly in the review experience
- AI recommendations remain human-controlled
- dashboard optimized for next actions instead of charts
- mocked services used to keep scope focused on workflow and product design

## 16. Prototype Limitations

- frontend-only prototype
- mock authentication
- mock AI and OCR-like analysis behavior
- mock document preview
- no backend or database
- no real tax calculations
- no production encryption
- no real-time collaboration
- no filing integration
- no legal or tax advice

These omissions are intentional so the prototype can stay focused on workflow, evidence, access control, and user experience.

## 17. Future Enhancements

- production authentication and identity management
- secure document storage
- real OCR and document classification
- tax software integration
- configurable firm review rules
- notification and workflow automation
- compliance-grade audit logging
- accessibility testing
- usability testing with clients and tax professionals

## 18. Submission Note

Green Ledger was designed as a focused product prototype demonstrating how client intake, document evidence, task ownership, collaboration, review, AI assistance, and access control can work together in one understandable tax workflow.
