# Parakhiya & Co. Staff Automation

Secure shared email inbox web application for staff-client mapped email workflows.

## Structure

- `backend/` — FastAPI API for RBAC-filtered inbox access, assignment, and outbound reply webhook forwarding.
- `frontend/` — Next.js App Router + Tailwind shared inbox dashboard.

## Required environment

### Backend

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
N8N_OUTBOUND_WEBHOOK_URL=https://example.app.n8n.cloud/webhook/outbound-reply
N8N_OUTBOUND_WEBHOOK_TOKEN=change-me
CORS_ORIGINS=http://localhost:3000
```

Session identity is supplied by the application edge/auth layer with `X-Staff-Email` (preferred) or `X-Staff-Id` headers. The API resolves the active staff record from PostgreSQL before enforcing RBAC.

### Frontend

```bash
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
# Development/demo identity header. In production, set these headers in middleware from your auth provider.
NEXT_PUBLIC_STAFF_EMAIL=admin@parakhiya.co
```

## Local development

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```
