# Backend API (scaffold)

Placeholder for the visa portal backend. Recommended stack:

- **Framework:** Python FastAPI (or Node/Express)
- **Storage:** JSON files under `/data` (users, applications, documents, logs)
- **Auth:** JWT or session; user/role from user JSON
- **Worker:** Separate process or queue for OCR and AI validation

## Suggested layout

```
backend/
  app/
    main.py          # FastAPI app, CORS, routes
    auth.py          # JWT/session middleware, role check
    storage.py       # Atomic read/write for JSON under data/
    routes/
      applications.py  # GET/POST/PATCH /api/applications, GET /api/applications/:id
      documents.py     # POST upload, GET document list
      users.py         # Login, me
    schemas/         # Pydantic models matching DATA_SCHEMAS.md
  data/              # Symlink or copy of /data (users, applications, documents, logs, uploads)
  requirements.txt   # fastapi, uvicorn, python-multipart, pyjwt, ...
```

## Key endpoints (to implement)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Return token; validate against user JSON |
| GET | /api/me | Current user from token |
| GET | /api/applications | List (paginated, by org) |
| GET | /api/applications/:id | Single application JSON (for extension) |
| POST | /api/applications | Create application |
| PATCH | /api/applications/:id | Update (e.g. form_answers, status) |
| POST | /api/applications/:id/documents | Upload file; create document JSON |
| GET | /api/forms/:visa_category | Form schema for portal |

All application and document reads/writes must be scoped by `organization_id` from the authenticated user.

## Run the server (PowerShell)

`uvicorn` is not on PATH by default. Use the module form so the current Python environment is used:

```powershell
cd "c:\path\to\VisaFormAutofill\backend"

# Optional: create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run (use python -m so uvicorn is found)
python -m uvicorn app.main:app --reload
```

Or run the script (activates `.venv` if present, then starts the server):

```powershell
cd backend
.\run.ps1
```

Then open `http://127.0.0.1:8000` and use that as the API base URL in the extension.
