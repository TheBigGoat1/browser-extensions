# Visa Form Autofill

Minimal, JSON-based visa application system: **Portal** collects and structures data, **AI** validates documents and form logic, **Chrome Extension** performs autofill on the official visa site.

## Repo layout

| Path | Purpose |
|------|--------|
| **ARCHITECTURE.md** | Full system breakdown, data flow, security, deployment |
| **docs/DATA_SCHEMAS.md** | Field-level reference for users, applications, documents, logs |
| **docs/DEVELOPMENT_PHASES.md** | Phase-by-phase tasks and acceptance criteria |
| **schemas/** | Example JSON (users, applications, documents, logs) and form schema (e.g. B1B2) |
| **field-mapping.example.json** | Example field mapping for the extension (copy and edit per visa site) |
| **backend/** | Backend API scaffold (FastAPI), storage helpers, placeholder routes |
| **manifest.json**, **background.js**, **content.js**, **sidepanel.\*** | Chrome extension |
| **images.png** | Extension icon (VISA logo); used for toolbar and store at all sizes (Chrome scales) |

The side panel UI is **responsive** (fluid typography, touch-friendly 44px targets, safe for all panel widths) and follows **best practices**: CSS variables, reduced-motion and contrast preferences, ARIA live regions, and loading states.

## Quick start — Extension only

1. Open Chrome → Extensions → Developer mode → **Load unpacked**.
2. Select the `VisaFormAutofill` folder.
3. Click the extension icon to open the side panel.
4. Set **API base URL** (e.g. `http://localhost:8000` if running the backend) and save.
5. Enter an **Application ID** (e.g. `app_001`), click **Fetch application**.
6. Open the visa form page, then click **Fill current page**.

**Note:** Filling only works when the page has fields that match your application JSON. Configure **field mapping** (see `field-mapping.example.json`) so the content script knows which selectors to use for each key. For a real visa site, add a mapping that matches that site’s DOM (e.g. in a config or from the backend).

## Quick start — Backend (scaffold)

```bash
cd VisaFormAutofill/backend
pip install -r requirements.txt
# Create data/applications and add app_001.json (copy from schemas/applications/app_example.json)
mkdir -p data/applications
# Copy app_example.json to data/applications/app_001.json
uvicorn app.main:app --reload
```

Then use API base URL `http://127.0.0.1:8000` in the extension.

## Core idea

- **Structured JSON** is the single source of truth (no database in v1).
- **Form schemas** drive the portal and define field IDs that the extension maps to the visa site.
- **Conditional logic** (`show_if`, `required_if`) is defined once in the schema and used by the portal; the extension only fills what’s in the application JSON.
- **Document validation** (OCR + AI) writes results into document/application JSON so the admin and portal can show compliance without a separate DB.

## Security

- Authentication required for portal, admin, and API.
- Role-based access (client, reviewer, admin); all data scoped by `organization_id`.
- Secure uploads and audit logs. See **ARCHITECTURE.md** for details.

## Future

- Migrate JSON storage to PostgreSQL without changing API contract or extension logic.
- Form schemas remain reusable (can move to DB as JSONB later).

For full architecture, data shapes, and development phases, see **ARCHITECTURE.md**, **docs/DATA_SCHEMAS.md**, and **docs/DEVELOPMENT_PHASES.md**.
