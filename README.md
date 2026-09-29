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

## Live deployment

- Frontend: <https://skillbridge-frontend-96be5.ondigitalocean.app>
- Backend health check: <https://skillbridge-afcfj.ondigitalocean.app/health/>

---

## Design Reference

Figma: https://www.figma.com/design/aAWByYSUyywqLJNii9iXYy/SkillBridge-%E2%80%94-UI-System---Architecture?node-id=2-4&t=PbybkfC2AdwULa4m-1

## Project Pitch Video

Check out [this video](https://drive.google.com/file/d/14DY5GkzS1uVOqXXdGF-Kurxu0Kp8dPOh/view?usp=sharing), where I describe my
project and some challenges I faced while building it.

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

### Booking price contract

Authenticated customers request `POST /api/v1/bookings/quote/` with `service`,
`scheduled_date`, `start_time`, and `end_time`. The response contains decimal
strings for `service_fee`, `platform_fee`, `vat_amount`, and `total_price`, plus
`currency` (`USD`). The booking `POST /api/v1/bookings/` accepts the same slot and
the quoted `total_price` as `quoted_total`; a changed price returns HTTP 400 and
requires a fresh quote. The server recalculates and stores every component.

Flat services use their listed price. Hourly services round the requested
duration up to a whole hour. The platform fee is 10% of the service fee, and
VAT defaults to 18% of the service fee plus platform fee. Each component rounds
to cents, half up, before the total is summed. Deployments can configure
`BOOKING_PLATFORM_FEE_RATE` and `BOOKING_VAT_RATE` as decimal fractions. Check
tax applicability for the service and customer location before accepting real
payments; the MVP applies one configured rate to all services. Existing booking
totals are preserved by migration and receive zero historical fee and tax
components where no breakdown was recorded.

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
