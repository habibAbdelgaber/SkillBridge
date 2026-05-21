# Deploying SkillBridge to DigitalOcean App Platform

Two separate components, both connected to the same GitHub monorepo:

1. **Backend** - Web Service, source dir `backend/`
2. **Frontend** - Static Site, source dir `frontend/`

This guide assumes managed Postgres on App Platform.

---

## Backend (Web Service)

### App Platform settings

| Field | Value |
|---|---|
| Source directory | `backend` |
| Build command | `pip install -r requirements.txt && python manage.py collectstatic --noinput` |
| Run command | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 60 --access-logfile - --error-logfile -` |
| HTTP port | `8080` (default) |
| Health check path | `/health/` |
| Instance size | basic-xs to start |

A `Procfile` is committed in `backend/` covering both the release migration and the gunicorn web command, so App Platform will auto-detect them if you leave the build/run fields blank - but the explicit values above override cleanly.

`runtime.txt` pins Python to `3.11.10`.

### Required environment variables

Mark all `*` entries as **encrypted**:

| Variable | Value | Notes |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.prod` | |
| `SECRET_KEY` * | 64+ char random | `python -c "import secrets;print(secrets.token_urlsafe(64))"` |
| `ALLOWED_HOSTS` | `api.skillbridge.example.com` | App Platform also injects `APP_DOMAIN` automatically |
| `CSRF_TRUSTED_ORIGINS` | `https://api.skillbridge.example.com,https://skillbridge.example.com` | |
| `CORS_ALLOWED_ORIGINS` | `https://skillbridge.example.com` | The frontend's deployed origin |
| `CORS_ALLOW_CREDENTIALS` | `True` | |
| `DATABASE_URL` * | bind from the managed Postgres component (`${db.DATABASE_URL}`) | sslmode=require |
| `DB_SSL_REQUIRE` | `True` | |
| `FRONTEND_URL` | `https://skillbridge.example.com` | Used in verification + reset emails |
| `EMAIL_HOST` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` * | SMTP relay creds | |
| `EMAIL_PORT` | `587` | |
| `EMAIL_USE_TLS` | `True` | |
| `DEFAULT_FROM_EMAIL` | `no-reply@skillbridge.example.com` | |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `15` | optional, defaults to 15 |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | optional, defaults to 7 |
| `LOG_LEVEL` | `INFO` | |
| `DJANGO_LOG_LEVEL` | `WARNING` | |
| `ACCOUNT_EMAIL_VERIFICATION` | `mandatory` | |
| `SECURE_SSL_REDIRECT` | `True` | |

### Database component

Add a managed Postgres database to the same App Platform app. Bind its `DATABASE_URL` into the backend component's `DATABASE_URL` env var (`${dbname.DATABASE_URL}`). Migrations run automatically on each deploy via the `release` line in `Procfile`.

### Health check

The DRF health-check view is mounted at `GET /health/`. Configure App Platform's HTTP health check to that path.

---

## Frontend (Static Site)

### App Platform settings

| Field | Value |
|---|---|
| Source directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |
| Catch-all path | `/index.html` (SPA fallback) |
| Index document | `index.html` |

Vite outputs to `dist/`. The Catch-all setting is what makes deep links like `/dashboard/provider` resolve to the React app instead of 404 from the static host.

### Required environment variables

Vite inlines `VITE_*` vars at build time, so any change requires a redeploy.

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.skillbridge.example.com` (no trailing slash) |
| `VITE_GOOGLE_MAPS_API_KEY` | optional; leave blank if unused |

---

## Deploy order (first time)

1. Create the Postgres component first.
2. Deploy the **backend** with all env vars set. Confirm `/health/` returns 200.
3. Once the backend domain is live, set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on the backend to the upcoming frontend origin (use the App Platform-provided `*.ondigitalocean.app` host first; add custom domains later).
4. Deploy the **frontend** with `VITE_API_URL` pointing at the backend's public URL.
5. Verify a full login → booking flow against the live frontend.

---

## Manual configuration that this repo can't automate

- Provisioning the Postgres database component and binding `DATABASE_URL`.
- SMTP credentials for transactional email (verification + password reset).
- Browser-restricted Google Maps API key (if you enable map features).
- Custom domains + DNS CNAMEs to App Platform.
- A second App Platform alert on the `/health/` probe.
