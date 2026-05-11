# SkillBridge Frontend

The customer- and provider-facing web app for **SkillBridge**, a service-marketplace
MVP. Customers browse pros, book jobs, and track requests; providers manage their
profile, availability, and incoming bookings from a dedicated dashboard.

This is the user-facing surface for the submission - the backend exists as a sibling
project (`backend/`) and is referenced only where its endpoints are needed to run the
frontend locally.

---

## Tech stack

- **React 18** + **TypeScript 5**
- **Vite 6** for dev server, type-stripping, and production bundling
- **Tailwind CSS 3** with a project-local design token palette
- **React Router v6** for routing
- **Zustand** for client state (auth session, etc.)
- **Axios** for HTTP, wrapped in a shared `apiClient` with interceptors
- **Vitest** for unit testing
- **ESLint** + **Prettier** for code quality

---

## Implemented features

**Marketing & discovery**

- Public landing page (hero, categories, how-it-works)
- Marketplace listing with pagination (6 per page), category chips with "All" default,
  free-text search, multi-facet filter panel (rating / price bucket / availability /
  verification flags), sort dropdown (best-rated, most-reviewed, price asc/desc)
- Provider profile page (sky-gradient hero, services offered, reviews card,
  7-day availability picker, safety / trust card)

**Authentication**

- Customer registration, provider registration (multi-field business form)
- Email-verification flow (verify link + "verification sent" page)
- Login with redirect-back support and a success checkmark transition
- Password reset (request + confirm)
- Role-aware post-login routing (customer → `/home`, provider → `/dashboard/provider`)
- JWT-with-refresh, rotated tokens stored in `localStorage`, refresh-on-401
  interceptor

**Booking flow**

- `/book/:serviceId` page matching the Figma comp: stepper (Scope → Schedule →
  Payment → Confirm), month-calendar with disabled/empty days, time-slot chip row,
  job address + notes input, right-rail summary with provider mini + price breakdown
- Inline validation for backend field errors
- `/bookings/:id` "request sent" confirmation page (concentric ring + clock, status
  pill, request details, "what happens next" steps, Track / Message / Cancel)
- `/booking/success` and `/booking/failure` post-payment result pages

**Dashboards**

- Authenticated `/home` for customers (lightweight scaffold)
- Provider dashboard at `/dashboard/provider` with sidebar nav, greeting, availability
  pill, "Request payout" button, 4 stat tiles (active jobs / pending payout / earned
  this month / response rate), today's & week's schedule, 30-day earnings bar chart,
  recent reviews, new job requests with accept / decline

**Shared UI**

- Reusable primitives in `src/components/ui` (Section, LoadingState, ErrorState,
  EmptyState, Pagination, Logo, Breadcrumb, StatusBadge, etc.)
- Auth-aware navbar in both the marketing shell and the in-app header
- Logo and provider identity card clickable for navigation

---

## Project structure

```
frontend/
├── src/
│   ├── app/                  # router, app shell, global config
│   ├── components/
│   │   ├── auth/             # auth-specific layout pieces
│   │   ├── booking/          # booking flow widgets (date grid, summary card, …)
│   │   ├── dashboard/        # provider dashboard cards + sidebar
│   │   ├── forms/            # shared form primitives
│   │   ├── landing/          # marketing nav, hero, sections, footer
│   │   ├── layout/           # in-app Header + MainLayout
│   │   ├── marketplace/      # listing, provider profile, search bar
│   │   └── ui/               # Section, Pagination, LoadingState, …
│   ├── features/             # feature-scoped helpers (auth field options, …)
│   ├── hooks/                # useServices, useProvider, useHealthCheck, …
│   ├── pages/                # one folder per route group
│   ├── services/             # apiClient + per-domain API layers
│   ├── store/                # Zustand stores (authStore)
│   ├── types/                # shared TypeScript types
│   └── utils/                # cn, authStorage, parseApiError, …
├── public/                   # static assets served as-is
├── index.html                # Vite entry
├── tailwind.config.*         # design tokens (brand colors, surface, etc.)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment variables

Vite only exposes variables prefixed with `VITE_` to the client bundle. Do not put
server-side secrets here - they're inlined at build time and shipped in the JS.

Copy `.env.example` to `.env.local` (preferred for local dev - `.env.local` is
gitignored by Vite):

```bash
cp .env.example .env.local
```

| Variable | Purpose | Notes |
|---|---|---|
| `VITE_API_URL` | Base URL of the Django backend. **No trailing slash.** | Default `http://localhost:8000` for dev. |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Platform browser key. | Optional. Used by the (planned) map widgets; leave blank if unused. |

Changes to `VITE_*` variables require a rebuild because Vite inlines them at build
time.

---

## Local setup

Prerequisites:

- Node.js 20 LTS (or newer)
- npm 10 (bundled with Node 20)
- The SkillBridge backend running locally on `http://localhost:8000` (see
  `../backend/README.md` or the root README for setup)

```bash
cd frontend
npm install
cp .env.example .env.local      # then point VITE_API_URL at your backend
npm run dev
```

The dev server runs at `http://localhost:5173` with strict port mode (no auto-port
selection). Hot module reload picks up `.tsx` and Tailwind changes automatically.

---

## Available npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build: `tsc -b` then `vite build` → `dist/` |
| `npm run preview` | Serve the built `dist/` locally for smoke-testing |
| `npm run typecheck` | TypeScript project references check, no emit |
| `npm run lint` | ESLint over `.ts` / `.tsx` |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier write across the repo |
| `npm run format:check` | Prettier check-only |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest single-shot |
| `npm run test:coverage` | Vitest with c8 coverage |

---

## Build

```bash
npm run build
```

Outputs to `dist/`:

```
dist/
├── index.html
├── assets/             # hashed JS and CSS chunks
└── …                   # static files copied from public/
```

TypeScript is type-checked first via `tsc -b`. A type error fails the build, so the
shipped bundle always passes type-checking.

You can locally serve the production build with `npm run preview` (defaults to port
4173).

---

## Deployment

The frontend is a static SPA - host it anywhere that serves static files with a
single-page-app fallback. Configuration below is for DigitalOcean App Platform but
the same shape works for Vercel, Netlify, Cloudflare Pages, etc.

### DigitalOcean App Platform (Static Site)

| Field | Value |
|---|---|
| Source directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |
| Index document | `index.html` |
| **Catch-all path** | `/index.html` |

The catch-all is what makes deep links like `/dashboard/provider` resolve to the SPA
instead of a 404 from the static host. Without it, refreshing on any non-`/` route
returns "Not Found".

### Environment variables

Set these on the static-site component. They're inlined at build time, so a value
change requires a redeploy.

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.skillbridge.example.com` (no trailing slash) |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser-restricted Google Maps Platform key (optional) |

### Production API URL

`VITE_API_URL` must point at the backend's public origin. The backend's
`CORS_ALLOWED_ORIGINS` env var must include the frontend's deployed origin in return,
or every API call will fail with a CORS error.

### Google Maps API key

Generate a Maps Platform key in Google Cloud Console restricted to the frontend's
deployed origin (HTTP referer restriction). Until map widgets ship, leaving this
blank is fine - the SPA renders without map features.

### Common deployment issues

- **Deep-link 404s** - Catch-all path isn't set to `/index.html`.
- **CORS errors in DevTools** - Backend `CORS_ALLOWED_ORIGINS` doesn't include the
  frontend origin; add it and redeploy the backend.
- **API requests hit `http://localhost:8000`** - `VITE_API_URL` wasn't set at build
  time on the host. Vite inlines env vars during `npm run build`, so the build must
  re-run after changing the variable.
- **`Authentication credentials were not provided`** - The user's tokens were
  cleared. The app's refresh-on-401 path requires `Authorization: Bearer` to round-
  trip; check that no proxy is stripping the header.

---

## Testing & linting

```bash
npm run typecheck     # tsc -b --noEmit
npm run lint          # ESLint over .ts / .tsx
npm test              # Vitest watch mode
npm run test:run      # one-shot
```

Vitest is configured but the suite is intentionally small - focus during the MVP has
been on shipping flows. Expanding coverage is on the roadmap.

---

## Known limitations

- **Payments are not wired.** The booking page links to `/booking/success` /
  `/booking/failure` as terminal states, but Stripe integration hasn't shipped. The
  success / failure pages render correctly when reached via `navigate(..., { state })`.
- **Customer dashboard scaffold only.** `/home` renders an intro + health check; the
  full customer dashboard (active bookings, history, rating given, etc.) lands in a
  follow-up.
- **Provider acceptance is stubbed.** The provider dashboard's "Accept / Decline"
  buttons call a stub in `services/providerDashboardService.ts`; there's no
  matching backend endpoint yet.
- **No real-time updates.** Booking state changes require a page reload to be
  visible across roles. WebSocket / SSE is out of scope for this submission.
- **Maps not yet integrated.** `VITE_GOOGLE_MAPS_API_KEY` is wired through
  `appConfig` but no component consumes it yet.
- **Email-verification deep links require backend `FRONTEND_URL`** - verify the
  backend env var matches the frontend origin or the link in verification emails
  will 404.

---

## Future roadmap

Short-term (next iterations):

- **Customer dashboard** - bookings list, escrow status, jobs completed, ratings
  given, profile edit.
- **Provider availability management UI** - weekly schedule editor + per-date
  overrides backed by the existing `/api/v1/me/availability/` endpoints.
- **Payments** - Stripe Checkout / Payment Intents, escrow release on customer
  confirmation, post-payment status routing.
- **Provider-side accept / decline** - replace the dashboard stubs with a real
  `PATCH /bookings/<id>/` flow once the backend exposes it.
- **Google Maps / Places** - autocomplete on the job address input, provider service
  area overlay on the profile page.

Mid-term:

- **Notifications** - email + push for booking lifecycle, refresh of dashboard
  cards on receipt.
- **Reviews & ratings** - customer-side write-review flow gated on completed
  bookings; in-place display improvements.
- **Admin moderation tools** - flag/unflag reviews, suspend services or providers.
- **Backend production deployment hardening** - managed Postgres binding,
  managed-email provider, monitoring + uptime alerts.

Tooling:

- **Improved test coverage** - component-level Vitest + Testing Library for the
  booking flow, route-guard tests, mapper unit tests.
- **CI/CD** - GitHub Actions running `typecheck`, `lint`, `test:run`, and a Vite
  build on every PR; preview deploys for the frontend.
- **Performance** - route-level code splitting, image optimisation pipeline,
  prefetch hints on the marketplace card hover.
- **Accessibility** - full keyboard navigation pass, axe-core CI lint, ARIA
  refinements on the calendar and time-slot picker.

---

## Technical notes

### React + TypeScript

Strict TypeScript across the SPA. Domain types live under `src/types/` and are
shared between hooks, services, and components. The service layer is the only
boundary that knows about snake_case wire shapes; everything inside the app
consumes camelCase domain types via per-feature mappers
(`services/marketplaceMappers.ts`).

### Tailwind design system

Tailwind's utility classes are scoped by a small design-token palette declared in
`tailwind.config.*`: `brand-primary`, `brand-primaryHover`, `brand-logo`,
`brand-muted`, `brand-borderLight`, `brand-borderStrong`, `brand-surface`,
`brand-background`. Shared spacing / radius patterns are defined inline rather
than abstracted into class names - the code is intentionally explicit.

### Routing

React Router v6 with two layout shells:

- **`LandingLayout`** - marketing navbar + footer; wraps `/`, `/marketplace`,
  `/providers/:id`, `/home`, `/book/:serviceId`, `/bookings/:id`,
  `/booking/success`, `/booking/failure`.
- **`MainLayout`** - minimal shell for auth flows: `/login`, `/register`,
  `/register/provider`, `/forgot-password`, `/reset-password/:uid/:token`,
  `/verify-email/:key`, `/verify-email-sent`, 404 fallback.
- **`/dashboard/provider*`** - renders outside both shells; the provider dashboard
  brings its own sidebar layout.

Route guards live in `src/components/auth/`: `RequireAuth` redirects guests to
`/login` with a `from` state for return-trip; `RedirectIfAuthed` bounces signed-in
users off the auth funnel.

### API service layer

All HTTP goes through `services/apiClient.ts` - a single Axios instance with:

- `baseURL` from `appConfig.apiUrl`
- Request interceptor that injects `Authorization: Bearer <access>` from
  `authStorage`
- Response interceptor that catches 401, calls `/api/v1/auth/token/refresh/`,
  stores the rotated tokens, and replays the original request
- `onSessionExpired` hook that signals the auth store to clear the session and
  trigger a route guard redirect when a refresh definitively fails

Per-domain modules (`authService`, `marketplaceService`, `bookingService`,
`providerDashboardService`) wrap `apiClient`, map wire ↔ domain shapes, and never
appear in components directly.

### State (Zustand)

`store/authStore.ts` is the only global store. It owns the authenticated user,
tokens, status (`idle` / `authenticating` / `authenticated` / `unauthenticated` /
`error`), and the `login`, `register`, `hydrate`, `logout`, `clearSession`
actions. Components subscribe via selector hooks
(e.g. `useAuthStore(selectIsAuthenticated)`).

The rest of the app uses local component state plus per-page custom hooks -
deliberately, to avoid premature globalisation of view state.

### Environment-based configuration

`app/config.ts` reads `import.meta.env.VITE_*` once at module load:

```ts
export const appConfig: AppConfig = {
  apiUrl: (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, ""),
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  environment: (import.meta.env.MODE as AppConfig["environment"]) ?? "development",
};
```

Trailing slashes are stripped so every service can append `/api/v1/...` paths
without worrying about double-slash bugs.

### How the frontend connects to the backend

- **Public endpoints** (`/api/v1/categories/`, `/api/v1/services/`, public provider
  detail, public availability) - fetched without auth; CORS only.
- **Authenticated endpoints** (`/api/v1/bookings/`, `/api/v1/me/availability/*`,
  `/api/v1/auth/user/`) - `apiClient` attaches the Bearer token automatically.
- **Token lifecycle** - JWT issued on `/api/v1/auth/login/`, stored in
  `localStorage` under `skillbridge.auth.tokens.v1`, rotated on every refresh, and
  cleared on a hard 401 or explicit `logout()`.
