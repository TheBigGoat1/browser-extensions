# Data directory (backend)

When running the backend from `backend/`, the API reads application JSON from `data/applications/`.

- `app_001.json` is included for testing. Use API base URL `http://127.0.0.1:8000` and application ID `app_001` in the extension.
- In production, set `VISA_DATA_ROOT` to your full `/data` path (users, applications, documents, logs, uploads).
