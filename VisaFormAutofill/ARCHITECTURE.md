# Visa Form Autofill System — Architecture & Full Breakdown

A minimal, JSON-based visa application system: **Portal** collects data, **AI** validates documents and form logic, **Chrome Extension** performs autofill. Structure is disciplined so the system can scale or migrate to a database later without rewrites.

---

## 1. Core Principle

| Component | Responsibility |
|-----------|----------------|
| **Client Portal** | Collects and structures all applicant data via dynamic forms |
| **AI / Document Processing** | Validates uploaded documents and form logic against rules |
| **Chrome Extension** | Executes autofill on the official visa site using structured JSON |
| **JSON Data Layer** | Single source of truth; no database in v1 |

**Design rule:** Even with JSON storage, schemas are fixed and predictable. No ad-hoc nesting or optional structures that differ per application.

---

## 2. Overall Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Client Portal  │────▶│  Backend API     │◀────│  Admin Panel        │
│  (Dynamic Forms)│     │  (FastAPI/Node)  │     │  (Review/Approve)   │
└────────┬────────┘     └────────┬─────────┘     └─────────────────────┘
         │                       │
         │                       │  JSON Data Layer
         │                       │  /data/users, /applications, /documents, /logs
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │  Document + AI   │
         │              │  (OCR, validate) │
         │              └──────────────────┘
         │
         │  Auth + fetch application JSON
         ▼
┌─────────────────┐
│ Chrome Extension │ ─── Autofill on visa website
│ (Sidepanel +     │
│  Content Script) │
└─────────────────┘
```

All components talk to the **Backend API**. The extension does not write to JSON directly; it only reads application data after authentication.

---

## 3. Data Storage (JSON)

### Directory layout

```
/data
  /users
    user_001.json
    user_002.json
  /applications
    app_001.json
    app_002.json
  /documents
    doc_001.json
    doc_002.json
  /uploads          # Raw files (path stored in document JSON)
    org_xyz/
      doc_001_passport.pdf
  /logs
    audit_001.json
  _index.json       # Optional: in-memory index of IDs for fast lookup
```

### Application file contents (`app_*.json`)

- Applicant details (name, DOB, passport, etc.)
- Visa category / form type
- Form answers (key-value, aligned with form schema)
- Document references (IDs pointing to `/documents/doc_*.json`)
- Status: `draft` | `submitted` | `in_review` | `approved` | `corrections_requested`
- Compliance results (from AI validation)
- Timestamps, `organization_id`, `created_by`

### Performance

- **Index in memory at startup:** e.g. map `application_id` → file path (or use `_index.json`).
- **Pagination in API:** List applications by page/size; only read the JSON files for the current page.
- **Atomic writes:** Write to a temp file, then rename to the final path to avoid corruption on crash.
- **Background jobs:** OCR and AI validation run in a worker; results are written back into the application/document JSON.

---

## 4. Client Portal (Dynamic Forms)

### Flow

1. User signs in (session/JWT).
2. User selects **visa category** (e.g. B1/B2, H1B). System loads the **form schema** for that category.
3. Multi-step form is rendered from the schema; each step is one “page” of questions.
4. **Conditional logic:** Fields use `show_if`, `required_if`, `validation_rules` so questions appear or become required based on prior answers.
5. On each step submit: answers are merged into the application JSON and saved (PATCH/PUT).
6. User uploads documents; they are stored and linked to the application; AI validation runs asynchronously.

### Form schema (not hardcoded pages)

- Stored as JSON (e.g. `/schemas/forms/b1b2.json`).
- Describes: steps, fields, types, options, conditionals, validation.
- Portal is a **single form engine** that interprets any schema. Adding a new visa type = new schema file.

---

## 5. Conditional Logic

Each field in the schema can have:

| Rule | Purpose |
|------|--------|
| `show_if` | Show field only when condition on other fields is true (e.g. "Has dependents" = true) |
| `required_if` | Required only when condition holds |
| `validation_rules` | Min/max length, regex, custom rules |

Conditions are expressed in a small, consistent format (e.g. `{ "field": "has_dependents", "op": "eq", "value": true }`). Same logic is used in the portal and can be reused by the extension to know which sections to “open” before filling.

---

## 6. Document Upload and AI Validation

1. **Upload:** File saved under `/data/uploads/{org_id}/` with a stable name; a record is created in `/data/documents/doc_XXX.json` (path, type, linked `application_id`).
2. **OCR:** Worker extracts text; store in `doc_XXX.json` or a separate field.
3. **AI validation:** Worker runs compliance rules (e.g. “passport must be valid 6 months”, “photo meets size rules”). Results (pass/fail, issues list) written into the document JSON and optionally summarized in the application JSON.
4. **Portal:** Shows document status and any issues; user can replace document or fix and re-upload.

Compliance results live in the JSON; no separate DB table in v1.

---

## 7. Admin Panel

- **Role-based access:** Roles stored in user JSON (e.g. `admin`, `reviewer`, `client`). Backend middleware checks role before serving admin endpoints.
- **Features:** List applications, open application detail, view uploaded documents, see AI compliance results, approve or request corrections.
- **Isolation:** All queries filtered by `organization_id` (or tenant id) so one org never sees another’s data.

---

## 8. Chrome Extension — Autofill Logic

### Step-by-step

1. **Authenticate** with backend (e.g. token in extension storage or login in sidepanel).
2. **Fetch** the structured application JSON for the current application (user selects which application if multiple).
3. **Detect** current visa form page (URL pattern or DOM markers).
4. **Map** schema fields to page fields (by `name`, `id`, or data attributes).
5. **Fill** fields; trigger appropriate events (`input`, `change`) so conditional sections appear.
6. **Submit** page using the site’s own button (no headless submit).
7. **Wait** for next page load; repeat from step 3.
8. **Stop** on final page for manual review and submission.

### Behaviour

- Each page is submitted through the site’s normal flow.
- If the user goes back, fields remain filled (or re-fill on load).
- Extension does not guess: it only maps known keys from application JSON to known form selectors (defined per visa form / URL).

---

## 9. Multi-Page Conditional Forms

- **Fill** current page.
- **Submit** (click next/submit).
- **Wait** for navigation and new page load.
- **Detect** which page we’re on (URL or page indicator).
- **Load** the next set of field mappings for that page; **fill** again.
- Repeat until the last page; then **pause for manual submit**.

Because the application JSON is already structured and validated, the extension only does mapping and filling—no business logic.

---

## 10. Performance (JSON-Based)

- One file per entity (user, application, document); avoid single huge files.
- Only open files that are needed for the current request.
- Pagination and filtering in the API (by status, date, org).
- OCR and AI in background workers; do not block API.
- Rotate or archive old audit logs to keep `/logs` small.

---

## 11. Security

- **Authentication:** Required for portal, admin, and extension API calls.
- **Secure uploads:** Validate type/size; store outside web root; serve via backend if needed.
- **Role-based access:** Enforced in backend middleware using user role from JSON.
- **Data separation:** Every request scoped by `organization_id` (or tenant).
- **Audit logs:** Log sensitive actions (login, view application, approve, export) in `/data/logs`.

---

## 12. Deployment

- **Backend:** One server (e.g. Python FastAPI or Node) serving API and static portal/admin assets (or separate frontend build).
- **Storage:** Directory for `/data` and `/uploads` with correct permissions.
- **Worker:** Separate process or queue worker for OCR and AI validation.
- **Reverse proxy:** Nginx/Caddy for HTTPS and optional rate limiting.
- **VPS:** Single machine is enough for moderate load.

---

## 13. Development Phases

1. **Architecture and schema design** — Finalize JSON schemas and form schema format.
2. **Portal + JSON storage** — Implement form engine, save to application JSON, basic API.
3. **Document upload and validation** — Upload API, worker for OCR + AI, write results to JSON.
4. **Admin panel** — List/detail, documents, compliance, approve/corrections.
5. **Chrome extension** — Auth, fetch application, page detection, field mapping, autofill loop.
6. **Integration testing** — End-to-end: submit in portal → fill on visa site.
7. **Deployment and documentation** — Install guide, architecture overview, extension setup, admin guide.

---

## 14. Deliverables / Documentation

- Source code (portal, backend, admin, extension).
- **Installation guide** — Backend, env vars, data directories, worker.
- **System architecture overview** — This document.
- **Extension setup** — Load unpacked, configure API URL, login.
- **Admin usage guide** — How to review applications and documents.

---

## 15. Future Upgrade Path

- **JSON → PostgreSQL:** Script to migrate `/data` contents into tables; keep same API contract so portal and extension unchanged.
- **Form schemas:** Remain as config (could live in DB later as JSONB).
- **Extension:** Same flow (auth → fetch JSON → map → fill); only the API response shape stays consistent.

---

## File Reference in This Repo

| Path | Purpose |
|------|--------|
| `ARCHITECTURE.md` | This document |
| `schemas/` | JSON schema definitions and example form schema |
| `docs/DATA_SCHEMAS.md` | Field-level description of each entity |
| `docs/DEVELOPMENT_PHASES.md` | Phase-by-phase tasks and acceptance criteria |
| `backend/` | Optional FastAPI/Node scaffold and read/write for JSON layer |
| Extension files | `manifest.json`, `background.js`, `content.js`, `sidepanel.*` |

A minimal system stays maintainable by keeping logic orderly and schemas predictable from the start.
