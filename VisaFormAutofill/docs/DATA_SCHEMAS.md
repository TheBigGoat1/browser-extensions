# Data Schemas — Field-Level Reference

Canonical shapes for all JSON entities. The backend and extension must follow these so behaviour is predictable.

---

## User (`/data/users/user_{id}.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | e.g. `user_001` |
| `email` | string | yes | Login identifier |
| `password_hash` | string | yes | Only stored hashed |
| `role` | string | yes | `client` \| `reviewer` \| `admin` |
| `organization_id` | string | yes | Tenant isolation |
| `name` | string | no | Display name |
| `created_at` | string (ISO 8601) | yes | |
| `updated_at` | string (ISO 8601) | yes | |

---

## Application (`/data/applications/app_{id}.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | e.g. `app_001` |
| `organization_id` | string | yes | Tenant isolation |
| `created_by` | string | yes | User ID |
| `visa_category` | string | yes | e.g. `B1B2`, `H1B` — drives form schema |
| `status` | string | yes | `draft` \| `submitted` \| `in_review` \| `approved` \| `corrections_requested` |
| `applicant` | object | yes | See Applicant below |
| `form_answers` | object | yes | Key-value; keys match form schema field IDs |
| `document_ids` | string[] | yes | References to `/data/documents/doc_*.json` |
| `compliance_summary` | object | no | High-level AI result (e.g. `{ "pass": true, "issues_count": 0 }`) |
| `created_at` | string (ISO 8601) | yes | |
| `updated_at` | string (ISO 8601) | yes | |

### Applicant (nested)

| Field | Type | Description |
|-------|------|-------------|
| `full_name` | string | |
| `date_of_birth` | string | ISO date |
| `nationality` | string | |
| `passport_number` | string | |
| `passport_expiry` | string | ISO date |
| `email` | string | |
| `phone` | string | |

(Extend as needed per visa type; keep a single nested object so the extension can rely on it.)

---

## Document (`/data/documents/doc_{id}.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | e.g. `doc_001` |
| `application_id` | string | yes | |
| `organization_id` | string | yes | |
| `type` | string | yes | e.g. `passport`, `photo`, `financial` |
| `file_path` | string | yes | Relative to `/data/uploads/` (e.g. `org_xyz/doc_001_passport.pdf`) |
| `file_name_original` | string | no | Original filename |
| `ocr_text` | string | no | Filled by worker after OCR |
| `compliance` | object | no | See Compliance below |
| `created_at` | string (ISO 8601) | yes | |
| `updated_at` | string (ISO 8601) | yes | |

### Compliance (nested)

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `pending` \| `pass` \| `fail` |
| `checked_at` | string | ISO 8601 |
| `issues` | array | `[{ "rule": "passport_validity", "message": "..." }]` |

---

## Audit Log (`/data/logs/audit_{id}.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | |
| `timestamp` | string (ISO 8601) | yes | |
| `actor_id` | string | yes | User ID |
| `action` | string | yes | e.g. `login`, `application.view`, `application.approve` |
| `resource_type` | string | no | `application`, `document`, `user` |
| `resource_id` | string | no | |
| `organization_id` | string | yes | |
| `details` | object | no | Extra context (e.g. IP, user agent) |

---

## Form Schema (per visa category)

Stored e.g. in `/schemas/forms/{visa_category}.json`. Drives both portal and (indirectly) extension field mapping.

- **steps:** Array of steps; each step has `id`, `title`, `fields` (array of field definitions).
- **fields:** `id`, `type` (text, date, select, checkbox, file), `label`, `required`, `show_if`, `required_if`, `validation_rules`, `options` (for select).

Condition format (for `show_if` / `required_if`):

```json
{ "field": "field_id", "op": "eq|neq|in|exists", "value": <any> }
```

Nested conditions can use `and` / `or` arrays if needed. Keep one standard so portal and backend share the same evaluator.
