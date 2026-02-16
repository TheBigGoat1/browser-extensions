# Development Phases — Visa Form Autofill System

Execute in order; each phase should be tested before moving to the next.

---

## Phase 1: Architecture and schema design

**Goal:** Lock down JSON shapes and form schema format so all components share one contract.

**Tasks:**

- [ ] Finalize `DATA_SCHEMAS.md` and example JSONs (users, applications, documents, logs).
- [ ] Finalize form schema format (steps, fields, `show_if`, `required_if`, `validation_rules`).
- [ ] Define condition evaluator spec (e.g. `{ "field", "op", "value" }` and optional `and`/`or`).
- [ ] Document field-mapping format for the extension (per-URL or per-page selectors).

**Acceptance:** Schema docs and examples are in repo; backend and extension can reference them.

---

## Phase 2: Portal and JSON storage

**Goal:** Client portal renders dynamic forms and persists answers to application JSON via API.

**Tasks:**

- [ ] Backend API: create/read/update application JSON (atomic writes, index or list by org).
- [ ] Form schema loader (e.g. serve `/schemas/forms/{visa_category}.json`).
- [ ] Portal form engine: render steps/fields from schema, evaluate `show_if`/`required_if`.
- [ ] Save progress per step (PATCH application, merge form_answers).
- [ ] Basic auth (login, session or JWT; user stored in JSON).

**Acceptance:** User can select visa type, complete a multi-step form, and see data in `/data/applications/app_*.json`.

---

## Phase 3: Document upload and validation

**Goal:** Upload documents, store in `/uploads`, create document JSON, run OCR and AI validation in background.

**Tasks:**

- [ ] Upload API: accept file, save under `/data/uploads/{org_id}/`, create `/data/documents/doc_*.json`.
- [ ] Link document to application (add `doc_id` to application `document_ids`).
- [ ] Worker: OCR pipeline, write `ocr_text` into document JSON.
- [ ] Worker: AI compliance checks, write `compliance` (status, issues) into document JSON.
- [ ] Portal: show document status and compliance issues; allow re-upload or replace.

**Acceptance:** Upload → document record created → worker runs → compliance result visible in portal.

---

## Phase 4: Admin panel

**Goal:** Admins/reviewers can list applications, view details, see documents and compliance, approve or request corrections.

**Tasks:**

- [ ] Role-based middleware: allow only `admin`/`reviewer` for admin routes.
- [ ] List applications (paginated, filtered by org, status).
- [ ] Application detail view (applicant, form_answers, document list, compliance summary).
- [ ] Document viewer (link to file or proxy download).
- [ ] Actions: set status to `approved` or `corrections_requested`; optional comment.

**Acceptance:** Admin user can log in, open an application, see documents and AI results, and change status.

---

## Phase 5: Chrome extension

**Goal:** Extension authenticates, fetches application JSON, and autofills visa form pages step-by-step.

**Tasks:**

- [ ] Sidepanel: config (API base URL, token), fetch application by ID, “Fill current page” button.
- [ ] Content script: receive field mapping + data, fill inputs/selects, trigger events.
- [ ] Field mapping: per-site or per-page selectors (from config or backend).
- [ ] Page detection: identify current step from URL or DOM; load correct mapping.
- [ ] Flow: fill → user submits on site → next page → fill again; final submit manual.

**Acceptance:** On visa form site, user loads application in sidepanel and fills current page; going back keeps fields filled or re-fill works.

---

## Phase 6: Integration testing

**Goal:** End-to-end flow from portal to autofill without regressions.

**Tasks:**

- [ ] Test: create application in portal → open same app in extension → fill first page.
- [ ] Test: multi-page form (fill, submit, next page, fill again).
- [ ] Test: conditional fields (e.g. dependents) appear and get filled when data present.
- [ ] Test: document upload and compliance visible in admin.

**Acceptance:** Full path (portal → extension → visa site) works for at least one visa category and one form flow.

---

## Phase 7: Deployment and documentation

**Goal:** System deployable on a single VPS with clear handover docs.

**Tasks:**

- [ ] Deployment: backend + worker + reverse proxy; env vars and `/data` directories.
- [ ] Installation guide: backend setup, worker, file permissions.
- [ ] System architecture overview (this repo’s `ARCHITECTURE.md`).
- [ ] Extension setup: load unpacked, set API URL, login/token.
- [ ] Admin usage guide: how to review applications and documents.

**Acceptance:** New developer can install, run, and use portal, admin, and extension from the docs.
