# SkillBridge

SkillBridge is an MVP marketplace that connects service providers with customers. Providers publish their offerings and get paid directly through the platform, while customers discover providers, explore services, book appointments, and pay online — all in a single seamless experience.

## Repository layout

```
SkillBridge/
├── backend/    # Django + DRF API (Python)
└── frontend/   # React + TypeScript + Vite web app
```

Both subprojects are self-contained, environment-driven, and PostgreSQL-ready on the backend side.

## Stages

- **Stage 0** — Repository scaffolding.
- **Stage 1 (current)** — Backend and frontend foundations: project structure, configuration, health endpoint, branded homepage. No business logic yet.
- **Stage 2+** — Authentication, users, services catalog, bookings, payments.

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then edit values
python manage.py migrate
python manage.py runserver
```

Health probe: \`GET http://localhost:8000/health/\`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env             # then edit VITE_API_URL if needed
npm run dev
```

App: \`http://localhost:5173\`.

## Tech stack

- **Backend:** Python, Django, Django REST Framework, PostgreSQL, django-cors-headers.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Axios.
