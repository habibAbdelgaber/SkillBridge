# SkillBridge

SkillBridge is a service-marketplace MVP. Customers discover providers, book
appointments, and track requests. Providers manage their profile, availability,
and incoming bookings from a dedicated dashboard.

> **Frontend-first submission.** This submission is reviewed primarily against the
> React frontend. The Django backend exists to power the API and is referenced only
> where its endpoints are needed to run the frontend.
>
> → **Start with [`frontend/README.md`](./frontend/README.md)** for the full
> frontend overview, local setup, deployment, and roadmap.

---

## Repository layout

```
SkillBridge/
├── frontend/    # React 18 + TypeScript + Vite + Tailwind  ← main review surface
├── backend/     # Django 5 + DRF + PostgreSQL              ← API for the frontend
└── DEPLOY.md    # DigitalOcean App Platform deployment notes
```

---

## Quick start

### Frontend (primary)

```bash
cd frontend
npm install
cp .env.example .env.local        # then point VITE_API_URL at your backend
npm run dev
```

App: <http://localhost:5173>. Full docs in
[`frontend/README.md`](./frontend/README.md).

### Backend (API the frontend talks to)

```bash
cd backend
python -m venv env
source env/bin/activate           # Windows: env\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit values
python manage.py migrate
python manage.py runserver
```

Health probe: `GET http://localhost:8000/health/`.

---

## Tech stack

- **Frontend** - React 18, TypeScript 5, Vite 6, Tailwind CSS 3, React Router v6,
  Zustand, Axios, Vitest.
- **Backend** - Python 3.11, Django 5, Django REST Framework, SimpleJWT,
  dj-rest-auth, PostgreSQL (SQLite for local dev), Whitenoise, Gunicorn.

---

## Documentation

- [`frontend/README.md`](./frontend/README.md) - full frontend documentation
  (features, structure, env vars, local setup, build, deployment, roadmap,
  technical notes).
- [`DEPLOY.md`](./DEPLOY.md) - DigitalOcean App Platform deployment guide for
  backend + frontend.

---

## License

Internal project for review. Not licensed for redistribution.
