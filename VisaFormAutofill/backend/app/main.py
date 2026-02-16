"""
Visa Form Autofill — Backend API (scaffold).
Run: uvicorn app.main:app --reload
"""

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.storage import read_json, list_ids

app = FastAPI(title="Visa Form Autofill API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/applications/{application_id}")
def get_application(application_id: str):
    """Fetch one application by ID. In production, require auth and scope by organization_id."""
    data = read_json("applications", f"{application_id}.json")
    if not data:
        raise HTTPException(status_code=404, detail="Application not found")
    return data


def _form_schema_path(visa_category: str) -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    return base / "schemas" / "forms" / f"{visa_category}_example.json"


@app.get("/api/forms/{visa_category}")
def get_form_schema(visa_category: str):
    """Return form schema for the portal. In production, serve from schemas/forms/."""
    p = _form_schema_path(visa_category)
    if not p.is_file():
        raise HTTPException(status_code=404, detail="Form schema not found")
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)
