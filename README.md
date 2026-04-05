# Travel Planner

A full-stack web application for planning trips with AI-generated itineraries. Users can register, log in, manage trips, and generate day-by-day travel plans using either a locally-hosted large language model or a rule-based engine powered by real-world POI data.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Backend Design](#backend-design)
- [Frontend Design](#frontend-design)
- [AI Integration](#ai-integration)
- [Database](#database)
- [Authentication & Security](#authentication--security)
- [Testing Strategy](#testing-strategy)
- [Software Engineering Practices](#software-engineering-practices)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)

---

## Overview

Travel Planner lets users:

- Register and log in with secure JWT-based authentication
- Create, view, update, and delete trips with destination and date information
- Generate day-by-day itineraries via a local LLM (Ollama) or a rule-based engine using live POI data
- Preview a generated itinerary before saving it, then apply it to the trip record
- View saved itineraries stored relationally (per-day, per-event) in the database

---

## Tech Stack

### Backend

| Technology         | Version       | Purpose                                        |
| ------------------ | ------------- | ---------------------------------------------- |
| Python             | 3.11+         | Primary language                               |
| FastAPI            | 0.128.0       | Async REST API framework                       |
| SQLAlchemy         | 2.0.46        | ORM and database abstraction                   |
| Alembic            | 1.18.3        | Database schema migrations                     |
| Pydantic           | 2.12.5        | Request/response validation                    |
| psycopg2-binary    | 2.9.9         | PostgreSQL/MySQL database driver               |
| python-jose        | 3.5.0         | JWT token encoding/decoding                    |
| passlib + bcrypt   | 1.7.4 / 4.3.0 | Password hashing                               |
| httpx              | 0.28.1        | Async HTTP client (Ollama + OpenTripMap calls) |
| slowapi            | 0.1.9         | Rate limiting on AI generation endpoints       |
| cachetools         | 7.0.5         | In-memory TTLCache for geocoding and POI data  |
| Uvicorn            | 0.40.0        | ASGI server                                    |

### Frontend

| Technology          | Version | Purpose                              |
| ------------------- | ------- | ------------------------------------ |
| React               | 19.2.0  | UI framework                         |
| TypeScript          | 5.9.3   | Type-safe JavaScript                 |
| Vite                | 7.2.4   | Build tool and dev server            |
| zod                 | 4.x     | Client-side schema validation        |
| react-hook-form     | 7.x     | Form state management with resolvers |
| @hookform/resolvers | 5.x     | Bridges react-hook-form with zod     |
| ESLint              | 9.39.1  | Code linting                         |

### Infrastructure

| Technology           | Purpose                                     |
| -------------------- | ------------------------------------------- |
| MySQL 8.0            | Primary relational database                 |
| Ollama + llama3.2:3b | Local LLM for AI itinerary generation       |
| OpenTripMap API      | Real-world POI data for rule-based planning |
| Nominatim (OSM)      | Free geocoding (city name → lat/lon)        |

---

## Architecture

The application follows a clean separation of concerns across three layers:

```
┌─────────────────────────────────────┐
│         React Frontend (Vite)        │
│         localhost:5173               │
└──────────────┬──────────────────────┘
               │ HTTP / JSON
               ▼
┌─────────────────────────────────────┐
│         FastAPI Backend              │
│         localhost:8000               │
│                                     │
│  Routes → Services → Repos → DB     │
└──────────┬──────────────┬───────────┘
           │              │
           ▼              ▼
    ┌──────────┐   ┌─────────────┐
    │  MySQL   │   │   Ollama    │
    │  :3306   │   │   :11434    │
    └──────────┘   └─────────────┘
```

The frontend communicates with the backend exclusively through a REST API. The backend handles all business logic, database access, and LLM communication. The frontend has no direct database or LLM access.

---

## Project Structure

```
travel-planner/
├── app/                              # FastAPI backend
│   ├── main.py                       # App entry point, CORS, rate-limit handler, routers
│   ├── api/
│   │   ├── deps.py                   # Dependency injection (auth, DB session)
│   │   ├── middleware/
│   │   │   └── error_handler.py      # Global unhandled exception handler
│   │   └── v1/
│   │       └── routes/
│   │           ├── auth.py           # /v1/auth endpoints
│   │           ├── trips.py          # /v1/trips CRUD endpoints
│   │           └── ai.py             # /v1/ai generation endpoints (rate-limited)
│   ├── core/
│   │   ├── config.py                 # Settings loaded from environment
│   │   ├── limiter.py                # slowapi Limiter singleton
│   │   ├── logging.py                # Structured logging configuration
│   │   └── security.py              # JWT creation, password hashing
│   ├── db/
│   │   ├── session.py                # SQLAlchemy session factory
│   │   ├── base_class.py             # Declarative base
│   │   └── base.py                   # Model registry (for Alembic)
│   ├── models/                       # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── trip.py
│   │   └── itinerary.py              # ItineraryDay + ItineraryEvent
│   ├── repositories/                 # Data access layer — all DB queries live here
│   │   ├── base.py                   # Generic BaseRepository[T] (get_by_id, add, delete)
│   │   ├── user_repository.py
│   │   ├── trip_repository.py
│   │   └── itinerary_repository.py   # save_itinerary() atomic replace, get_days_by_trip()
│   ├── schemas/                      # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── trip.py
│   │   ├── ai.py                     # ItineraryItem (+ lat/lon), DayPlan, ItineraryResponse
│   │   └── itinerary.py              # ItineraryEventRead, ItineraryDayRead (ORM read schemas)
│   └── services/
│       ├── auth_service.py
│       ├── trip_service.py
│       ├── ai/
│       │   ├── itinerary_service.py  # LLM pipeline; apply now saves to relational tables
│       │   └── rule_based_service.py # OpenTripMap pipeline with TTLCache on geocode + POIs
│       └── llm/
│           └── ollama_client.py
├── alembic/
│   └── versions/
│       ├── eb8ceb58b88e_create_user_table.py
│       ├── 70fee314e52b_add_trips_table.py
│       └── 3f8a1b9c2d4e_add_itinerary_tables.py   # itinerary_days + itinerary_events
├── tests/
│   ├── conftest.py                   # Shared fixtures, SQLite test DB, rate-limiter reset
│   ├── unit/
│   │   └── test_auth_unit.py
│   └── integration/
│       ├── test_auth_api.py
│       ├── test_trips.py
│       ├── test_ai_plan.py
│       ├── test_itinerary_apply.py   # Repository + apply endpoint tests (Phase 1)
│       └── test_rate_limit.py        # Rate limit + cache hit tests (Phase 2)
├── ui/                               # React frontend
│   └── src/
│       ├── App.tsx
│       ├── features/
│       │   ├── auth/
│       │   │   └── LoginPage/
│       │   └── trips/
│       │       ├── TripList/         # Elapsed timer, AbortController, slow hint
│       │       ├── CreateTripForm/   # react-hook-form + zod validation
│       │       ├── ItineraryPanel/
│       │       └── schemas/
│       │           └── tripSchema.ts # Zod schema mirroring TripCreate Pydantic model
│       └── shared/
│           └── api/
│               ├── auth.ts
│               ├── trips.ts
│               └── ai.ts             # AbortSignal support, timeout constants
├── requirements.txt
├── alembic.ini
└── .env
```

---

## Backend Design

### Layered Architecture

The backend is organized into four distinct layers, each with a single responsibility:

```
Routes → Services → Repositories → DB
```

**Routes** (`app/api/v1/routes/`) — Handle HTTP concerns only: parse requests, delegate to services, return responses. No business logic or DB queries live here.

**Services** (`app/services/`) — Own all business logic. `AuthService` handles registration and login. `TripService` handles CRUD with ownership checks. `ItineraryService` orchestrates the full LLM pipeline and delegates persistence to `ItineraryRepository`.

**Repositories** (`app/repositories/`) — The only layer that writes SQLAlchemy queries. `BaseRepository[T]` provides generic `get_by_id`, `add`, and `delete`. `ItineraryRepository` handles the atomic save of nested `ItineraryDay`/`ItineraryEvent` rows.

**Models** (`app/models/`) — SQLAlchemy ORM definitions. `ItineraryDay` and `ItineraryEvent` extend the schema with a fully relational itinerary structure.

**Schemas** (`app/schemas/`) — Pydantic v2 models for API request/response. Separate from ORM models — the API shape and the database shape evolve independently.

### Rate Limiting

AI generation endpoints (`/v1/ai/plan`, `/v1/ai/plan-smart`) are rate-limited per client IP using `slowapi`. The limit is configured via the `AI_RATE_LIMIT` environment variable (default: `10/minute`). The `/v1/ai/apply` endpoint is intentionally not rate-limited — it is a cheap DB write.

Exceeded limits return `HTTP 429 Too Many Requests`.

### API Versioning

All routes are prefixed with `/v1/`. This allows non-breaking changes under `/v2/` in the future without disrupting existing clients.

### Dependency Injection

FastAPI's `Depends()` system injects shared resources:

```python
SessionDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
```

Route functions declare what they need. FastAPI handles wiring. Dependencies are swapped in tests without changing production code.

### Data Validation

Pydantic v2 validates all incoming request data. Invalid requests are rejected before reaching route logic. `TripCreate` enforces `end_date >= start_date` via a `@model_validator`. `ItineraryResponse` coerces LLM type mismatches (int costs, string tips) to the expected types before reaching the service layer.

---

## Frontend Design

### Feature-Based Structure

The frontend is organized by feature. Each feature owns its components, styles, and (now) its validation schemas:

```
features/
  auth/
    LoginPage/
  trips/
    TripList/         ← loading states, abort controller
    CreateTripForm/   ← react-hook-form + zod
    ItineraryPanel/
    schemas/
      tripSchema.ts   ← Zod schema mirroring backend TripCreate
```

### Form Validation

`CreateTripForm` uses `react-hook-form` with a `zodResolver` to validate all fields before any network request is made. The Zod schema (`tripSchema.ts`) mirrors the backend `TripCreate` Pydantic model exactly:

- `title` and `destination`: required, max 255 characters
- `start_date` and `end_date`: required ISO date strings
- Cross-field: `end_date >= start_date` (same rule as the backend `@model_validator`)
- `notes`: optional

Validation errors appear inline below the relevant field immediately on blur/submit. The `noValidate` attribute disables browser-native validation so Zod is the single source of truth.

### AI Loading State

Long-running AI requests (Ollama on CPU can take 60–120 s) are handled with three mechanisms:

1. **AbortController timeout** — every `planItinerary` / `planItinerarySmart` call receives an `AbortSignal` tied to a 3-minute hard timeout. If the server does not respond in time, the request is cancelled and a clear message is shown to the user.
2. **Elapsed timer** — a `setInterval` (stored in `useRef` to avoid stale closures) increments a per-trip counter every second. The count is shown in the generating indicator inside the trip card.
3. **Slow hint** — after 30 seconds (`AI_SLOW_THRESHOLD_MS`) a note appears: *"The AI is still working — LLM responses can take 1–2 minutes on CPU."*

The `AbortSignal` parameter in the API layer is the designated seam for future SSE streaming: when the backend exposes an SSE endpoint, the `fetch` call is replaced with `new EventSource(url)` at that single call site.

### API Layer Separation

All `fetch` calls are isolated in `shared/api/`. React components never call `fetch` directly — they call typed functions that return typed data:

```
shared/api/auth.ts    → login(), register()
shared/api/trips.ts   → getTrips(), createTrip(), deleteTrip()
shared/api/ai.ts      → planItinerary(), planItinerarySmart(), applyItinerary()
```

---

## AI Integration

The app supports two independent itinerary generation strategies, both returning the same `ItineraryResponse` shape. The save flow (`/ai/apply`) works identically for both.

### Strategy 1 — LLM (Ollama)

Uses a local Ollama instance running `llama3.2:3b`. No external API keys required.

```
1. Fetch trip from DB         → verify ownership, get destination/dates
2. Build system prompt        → set persona, inject JSON schema constraints
3. Build user prompt          → inject trip details, interests, budget
4. Call Ollama                → async HTTP POST via httpx
5. Clean response             → strip markdown code fences if present
6. Parse JSON                 → json.loads()
7. Validate with Pydantic     → ItineraryResponse(**parsed_dict)
8. Return structured object   → guaranteed shape, safe to use
```

### Strategy 2 — Rule-Based (OpenTripMap)

Generates itineraries from real POI data without an LLM. Entirely free — no credit card required.

```
1. Fetch trip from DB         → verify ownership, get destination/dates
2. Geocode destination        → Nominatim converts city name → lat/lon (cached 24 h)
3. Map user interests         → translate keywords to OpenTripMap category kinds
4. Fetch POIs                 → OpenTripMap radius endpoint (cached 1 h per location+kinds)
5. Score & rank               → sort by POI rating, deduplicate by name
6. Assemble days              → slot top N POIs across trip days (max 7 days, 3 per day)
7. Return ItineraryResponse   → identical shape to LLM output
```

**Caching:** Nominatim responses are cached for 24 hours (coordinates for a city name are stable). OpenTripMap POI lists are cached for 1 hour keyed by `(lat_rounded_3dp, lon_rounded_3dp, kinds)`. Both caches are module-level `TTLCache` instances from `cachetools`. This avoids burning external API quota on repeated requests for the same destination.

**Interest keywords** (comma-separated): `food`, `history`, `nature`, `art`, `shopping`, `religion`, `beach`, `sport`, `nightlife`

**Budget values**: `budget`, `moderate`, `luxury`

If no POIs match the requested interest categories, the service automatically retries with the broadest category (`interesting_places`).

### Two-Step Save Flow

Generation and saving are intentionally separate:

- `POST /v1/ai/plan` — LLM generation, preview only
- `POST /v1/ai/plan-smart` — Rule-based generation, preview only
- `POST /v1/ai/apply` — Save any approved itinerary to the trip record

On apply, the itinerary is persisted in two places:
1. **Relational tables** (`itinerary_days`, `itinerary_events`) — the source of truth for structured queries.
2. **`trip.description`** — a plain-text + JSON fallback kept for backward compatibility with the frontend parser.

---

## Database

### Schema

Four tables managed via Alembic migrations:

**users**
| Column          | Type     | Notes            |
|-----------------|----------|------------------|
| id              | INT      | Primary key      |
| email           | VARCHAR  | Unique           |
| hashed_password | VARCHAR  | bcrypt hash      |
| is_active       | BOOLEAN  | Default true     |

**trips**
| Column      | Type     | Notes                   |
|-------------|----------|-------------------------|
| id          | INT      | Primary key             |
| user_id     | INT      | FK → users.id           |
| title       | VARCHAR  | Required                |
| destination | VARCHAR  | Required, indexed       |
| start_date  | DATE     | Required                |
| end_date    | DATE     | Required                |
| description | TEXT     | Legacy itinerary string |
| notes       | TEXT     | User interests/notes    |
| created_at  | DATETIME | Auto-set                |

**itinerary_days**
| Column     | Type    | Notes                          |
|------------|---------|--------------------------------|
| id         | INT     | Primary key                    |
| trip_id    | INT     | FK → trips.id (CASCADE DELETE) |
| day_number | INT     | 1-indexed day of the itinerary |
| day_date   | VARCHAR | ISO date string (nullable)     |

**itinerary_events**
| Column       | Type    | Notes                                  |
|--------------|---------|----------------------------------------|
| id           | INT     | Primary key                            |
| day_id       | INT     | FK → itinerary_days.id (CASCADE DELETE)|
| sort_order   | INT     | Preserves activity order within a day  |
| time         | VARCHAR | e.g. "09:00 AM" (nullable)             |
| title        | VARCHAR | Activity name                          |
| location     | VARCHAR | Human-readable location (nullable)     |
| lat          | FLOAT   | Latitude (nullable)                    |
| lon          | FLOAT   | Longitude (nullable)                   |
| notes        | TEXT    | Description / tip (nullable)           |
| cost_estimate| VARCHAR | e.g. "$20", "Free" (nullable)          |

### Migrations

| File | Description |
|------|-------------|
| `eb8ceb58b88e` | Create users table |
| `70fee314e52b` | Add trips table |
| `3f8a1b9c2d4e` | Add itinerary_days and itinerary_events tables |

Alembic handles schema changes as versioned Python files with `upgrade()` and `downgrade()`, making changes reproducible and reversible across environments.

---

## Authentication & Security

### JWT Flow

```
1. User POSTs email + password to /auth/login
2. Server verifies password hash with bcrypt
3. Server issues a signed JWT (HS256, 30 min expiry)
4. Client stores token in localStorage
5. Client sends token as Authorization: Bearer <token> on every request
6. Server validates signature and expiry on protected routes
```

### Password Hashing

Passwords are hashed with bcrypt via `passlib`. A SHA-256 pre-hash step handles bcrypt's 72-byte truncation limit — long passwords are not silently weakened.

### User Isolation

Every trip query filters by both `trip_id` and `current_user.id`. A user cannot read, modify, or delete another user's trips — even if they know the trip ID.

### CORS

`CORSMiddleware` is configured with an explicit origin allowlist from `CORS_ORIGINS` (defaults to `http://localhost:5173`). No wildcard origins are used in production configuration.

### Rate Limiting

The two AI generation endpoints are protected by `slowapi` per client IP:

| Endpoint            | Limit (default)  |
|---------------------|------------------|
| `POST /v1/ai/plan`  | 10 requests/min  |
| `POST /v1/ai/plan-smart` | 10 requests/min |
| `POST /v1/ai/apply` | No limit         |

The limit is configurable via `AI_RATE_LIMIT` env var using slowapi's string syntax (e.g. `"20/minute"`, `"100/hour"`).

---

## Testing Strategy

Tests use `pytest` with the following approach:

### Isolated Test Database

Tests run against an in-memory SQLite database, not the production MySQL instance. Each test gets a fresh transaction rolled back after the test — no test data persists and no cleanup code is needed.

### Dependency Override

FastAPI's `dependency_overrides` replaces the production database session with the test session. Application code runs unchanged — only the injected dependency differs.

### Rate Limiter Isolation

An `autouse` fixture calls `limiter._storage.reset()` before and after every test, preventing rate-limit hits in one test from bleeding into the next. The `AI_RATE_LIMIT` env var is set to `"3/minute"` in the test environment so rate-limit exhaustion can be triggered with just 4 requests.

### Test Coverage

| File | Type | What it tests |
|------|------|---------------|
| `unit/test_auth_unit.py` | Unit | Password hashing, token creation |
| `integration/test_auth_api.py` | Integration | Register, login, wrong password, /me |
| `integration/test_trips.py` | Integration | Full CRUD, user isolation, access control |
| `integration/test_ai_plan.py` | Integration | LLM generation with mocked Ollama client |
| `integration/test_itinerary_apply.py` | Integration | Repository save/replace/order; apply endpoint saves relational rows, updates trip, reapply replaces, wrong-owner 404 |
| `integration/test_rate_limit.py` | Integration | Per-IP limit enforced on plan/plan-smart; apply not limited; geocode and POI fetch cache hit verified via httpx-layer patching |

---

## Software Engineering Practices

### Single Responsibility

Each file and class has one job. Routes handle HTTP. Services handle business logic. Repositories handle DB access. Schemas handle validation. The Ollama client does one thing: make HTTP calls to Ollama.

### Separation of Concerns

The API shape (Pydantic schemas) is deliberately separate from the database shape (SQLAlchemy models). The database can change without breaking the API contract, and vice versa. Client-side Zod schemas mirror the backend Pydantic schemas, creating a consistent validation contract across the full stack.

### Fail-Safe Defaults

- Unauthenticated requests are rejected at the dependency level before reaching route logic
- Invalid data is rejected by Pydantic before reaching the database
- LLM output is validated through Pydantic before being returned to the client — malformed AI responses raise a controlled error rather than crashing
- Client requests to AI endpoints are guarded by a hard 3-minute `AbortController` timeout — the UI never hangs indefinitely

### Type Safety

The backend uses Python type annotations throughout. The frontend uses TypeScript — API responses have typed interfaces so incorrect data access is caught at compile time. The `zod` schema on the frontend is the `TypeScript` source of truth for form data (`TripFormData = z.infer<typeof tripSchema>`).

### Environment-Based Configuration

All secrets and environment-specific values (database URL, JWT secret, Ollama URL, rate limit, CORS origins) are loaded from environment variables via `pydantic-settings`. No secrets are hardcoded in application logic.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0
- [Ollama](https://ollama.com) with `llama3.2:3b` pulled

### Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env             # edit with your DB credentials

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd ui
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Running Tests

```bash
# From project root with venv activated
pytest tests/ -v
```

---

## Environment Variables

### Backend

| Variable                      | Required | Description                                                     |
| ----------------------------- | -------- | --------------------------------------------------------------- |
| `DATABASE_URL`                | Yes      | MySQL connection string                                         |
| `JWT_SECRET`                  | Yes      | Secret key for signing JWT tokens                               |
| `JWT_ALG`                     | Yes      | JWT algorithm (default: `HS256`)                                |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes      | Token lifetime in minutes                                       |
| `CORS_ORIGINS`                | No       | Comma-separated allowed origins (default: `http://localhost:5173`) |
| `OLLAMA_BASE_URL`             | Yes      | Ollama server URL                                               |
| `OLLAMA_MODEL`                | Yes      | Model name (e.g. `llama3.2:3b`)                                 |
| `OLLAMA_TIMEOUT_SECONDS`      | Yes      | Request timeout for LLM calls                                   |
| `OPENTRIPMAP_API_KEY`         | No       | Free key from opentripmap.com — required for `/v1/ai/plan-smart` |
| `AI_RATE_LIMIT`               | No       | slowapi limit string for AI endpoints (default: `10/minute`)    |

### Frontend

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| `VITE_API_URL` | Backend API URL (default: `http://127.0.0.1:8000`) |

---

## API Reference

Full interactive documentation at `http://localhost:8000/docs` when the backend is running.

### Auth

| Method | Endpoint            | Auth | Description               |
| ------ | ------------------- | ---- | ------------------------- |
| POST   | `/v1/auth/register` | —    | Create a new user account |
| POST   | `/v1/auth/login`    | —    | Log in, receive JWT token |
| GET    | `/v1/auth/me`       | JWT  | Get current user profile  |

### Trips

| Method | Endpoint         | Auth | Description                     |
| ------ | ---------------- | ---- | ------------------------------- |
| GET    | `/v1/trips/`     | JWT  | List all trips for current user |
| POST   | `/v1/trips/`     | JWT  | Create a new trip               |
| GET    | `/v1/trips/{id}` | JWT  | Get a single trip               |
| PATCH  | `/v1/trips/{id}` | JWT  | Partially update a trip         |
| DELETE | `/v1/trips/{id}` | JWT  | Delete a trip                   |

### AI

| Method | Endpoint            | Auth | Rate Limited | Description                                           |
| ------ | ------------------- | ---- | ------------ | ----------------------------------------------------- |
| POST   | `/v1/ai/plan`       | JWT  | Yes          | Generate an itinerary via LLM (preview only)          |
| POST   | `/v1/ai/plan-smart` | JWT  | Yes          | Generate an itinerary via rule-based engine (preview only) |
| POST   | `/v1/ai/apply`      | JWT  | No           | Save any generated itinerary to a trip                |

Both plan endpoints accept the same request body:

```json
{
  "trip_id": 1,
  "interests_override": "history,food",
  "budget_override": "moderate"
}
```

Exceeded rate limits return `HTTP 429 Too Many Requests`.
