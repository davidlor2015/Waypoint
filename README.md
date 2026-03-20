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
- Apply generated itineraries back to saved trips

---

## Tech Stack

### Backend

| Technology       | Version       | Purpose                          |
| ---------------- | ------------- | -------------------------------- |
| Python           | 3.11+         | Primary language                 |
| FastAPI          | 0.128.0       | Async REST API framework         |
| SQLAlchemy       | 2.0.46        | ORM and database abstraction     |
| Alembic          | 1.18.3        | Database schema migrations       |
| Pydantic         | 2.12.5        | Request/response validation      |
| PyMySQL          | 1.1.2         | MySQL database driver            |
| python-jose      | 3.5.0         | JWT token encoding/decoding      |
| passlib + bcrypt | 1.7.4 / 4.3.0 | Password hashing                 |
| httpx            | 0.28.1        | Async HTTP client (Ollama calls) |
| Uvicorn          | 0.40.0        | ASGI server                      |

### Frontend

| Technology | Version | Purpose                   |
| ---------- | ------- | ------------------------- |
| React      | 19.2.0  | UI framework              |
| TypeScript | 5.9.3   | Type-safe JavaScript      |
| Vite       | 7.2.4   | Build tool and dev server |
| ESLint     | 9.39.1  | Code linting              |

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
│  Routes → Services → Models → DB    │
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
│   ├── main.py                       # App entry point, CORS, middleware, router registration
│   ├── api/
│   │   ├── deps.py                   # Dependency injection (auth, DB session)
│   │   ├── middleware/
│   │   │   └── error_handler.py      # Global unhandled exception handler
│   │   └── v1/
│   │       └── routes/
│   │           ├── auth.py           # /v1/auth endpoints
│   │           ├── trips.py          # /v1/trips CRUD endpoints
│   │           └── ai.py             # /v1/ai generation endpoints
│   ├── core/
│   │   ├── config.py                 # Settings loaded from environment
│   │   ├── logging.py                # Structured logging configuration
│   │   └── security.py              # JWT creation, password hashing
│   ├── db/
│   │   ├── session.py                # SQLAlchemy session factory
│   │   ├── base_class.py             # Declarative base
│   │   └── base.py                   # Model registry (for Alembic)
│   ├── models/                       # SQLAlchemy ORM models
│   │   ├── user.py
│   │   └── trip.py
│   ├── repositories/                 # Data access layer — all DB queries live here
│   │   ├── base.py                   # Generic BaseRepository[T] (get_by_id, add, delete)
│   │   ├── user_repository.py        # User queries (get_by_email)
│   │   └── trip_repository.py        # Trip queries (get_by_id_and_user, get_all_by_user)
│   ├── schemas/                      # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── trip.py
│   │   └── ai.py
│   └── services/
│       ├── auth_service.py           # Registration and login business logic
│       ├── trip_service.py           # Trip CRUD business logic
│       ├── ai/
│       │   ├── itinerary_service.py  # Orchestrates LLM itinerary generation
│       │   └── rule_based_service.py # Rule-based generation via OpenTripMap POI data
│       └── llm/
│           └── ollama_client.py      # Low-level Ollama HTTP client
├── alembic/                          # Database migration scripts
│   └── versions/
│       ├── eb8ceb58b88e_create_user_table.py
│       └── 70fee314e52b_add_trips_table.py
├── tests/
│   ├── conftest.py                   # Shared fixtures, test DB setup
│   ├── unit/
│   │   └── test_auth_unit.py         # Password hashing, token creation
│   └── integration/
│       ├── test_auth_api.py          # Register, login, /me endpoint
│       ├── test_trips.py             # Full CRUD, user isolation, access control
│       └── test_ai_plan.py           # AI generation with mocked Ollama client
├── ui/                               # React frontend
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       ├── features/
│       │   ├── auth/
│       │   │   └── LoginPage/
│       │   │       ├── LoginPage.tsx
│       │   │       ├── LoginPage.css
│       │   │       └── index.ts
│       │   └── trips/
│       │       ├── TripList/
│       │       ├── CreateTripForm/
│       │       ├── ItineraryPanel/
│       │       └── types.ts
│       └── shared/
│           └── api/
│               ├── auth.ts           # Auth API functions
│               └── trips.ts          # Trips API functions
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

**Services** (`app/services/`) — Own all business logic. `AuthService` handles registration and login. `TripService` handles CRUD with ownership checks. `ItineraryService` orchestrates the full LLM pipeline. Services raise `HTTPException` for domain errors.

**Repositories** (`app/repositories/`) — The only layer that writes SQLAlchemy queries. `BaseRepository[T]` provides generic `get_by_id`, `add`, and `delete` via Python generics. Subclasses add domain-specific queries. This makes DB access independently testable and swappable.

**Models** (`app/models/`) — SQLAlchemy ORM definitions. Represent the database schema as Python classes.

**Schemas** (`app/schemas/`) — Pydantic v2 models that define what data comes in and goes out of the API. Deliberately separate from ORM models — the database shape and the API shape are not the same thing.

### API Versioning

All routes are prefixed with `/v1/` (e.g. `POST /v1/auth/login`, `GET /v1/trips/`). This allows non-breaking changes to be introduced under `/v2/` in the future without disrupting existing clients.

### Dependency Injection

FastAPI's `Depends()` system is used throughout to inject shared resources:

```python
# app/api/deps.py
SessionDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
```

Route functions declare what they need as parameters. FastAPI handles the wiring. This makes routes easy to test — dependencies can be swapped out in test configuration without changing production code.

### Data Validation

Pydantic v2 validates all incoming request data automatically. Invalid requests are rejected before reaching route logic. For example, `TripCreate` enforces that `end_date >= start_date` via a `@model_validator`:

```python
@model_validator(mode="after")
def validate_dates(self):
    if self.end_date < self.start_date:
        raise ValueError("end_date must be on or after start_date")
    return self
```

---

## Frontend Design

### Feature-Based Structure

The frontend is organized by feature rather than by file type. Each feature owns its components:

```
features/
  auth/
    LoginPages.tsx
  trips/
    TripList.tsx
    CreateTripForm.tsx
```

This scales better than grouping all components together as the app grows.

### API Layer Separation

All `fetch` calls are isolated in `shared/api/`. React components never call `fetch` directly — they call typed functions that return typed data:

```
shared/api/auth.ts    → login(), getMe()
shared/api/trips.ts   → getTrips(), createTrip(), deleteTrip()
```

This means if the API changes, only one file needs updating. Components don't need to know about URLs, headers, or HTTP methods.

### State Management

State is managed with React's built-in `useState` and `useEffect` hooks. The root `App.tsx` owns authentication state (`user`, `token`) and passes callbacks down to children. This keeps auth logic centralized in one place.

Component-level state (form inputs, loading flags, errors) stays local to the component that owns it.

---

## AI Integration

The app supports two independent itinerary generation strategies, both returning the same `ItineraryResponse` shape. The save flow (`/ai/apply`) works identically for both.

### Strategy 1 — LLM (Ollama)

Uses a local Ollama instance running `llama3.2:3b`. No external API keys required.

```
1. Fetch trip from DB         → verify ownership, get destination/dates
2. Build system prompt        → set persona, inject Pydantic JSON schema
3. Build user prompt          → inject trip details, interests, budget
4. Call Ollama                → async HTTP POST via httpx
5. Clean response             → strip markdown code fences if present
6. Parse JSON                 → json.loads()
7. Validate with Pydantic     → ItineraryResponse(**parsed_dict)
8. Return structured object   → guaranteed shape, safe to use
```

The system prompt injects the full Pydantic JSON schema of `ItineraryResponse` directly into the LLM context, reducing hallucinated or malformed responses.

### Strategy 2 — Rule-Based (OpenTripMap)

Generates itineraries from real POI data without an LLM. Entirely free — no credit card required.

```
1. Fetch trip from DB         → verify ownership, get destination/dates
2. Geocode destination        → Nominatim (OpenStreetMap) converts city name → lat/lon
3. Map user interests         → translate keywords to OpenTripMap category kinds
4. Fetch POIs                 → OpenTripMap returns rated attractions within 5km
5. Score & rank               → sort by POI rating, deduplicate by name
6. Assemble days              → slot top N POIs across trip days (max 3 days, 3 per day)
7. Return ItineraryResponse   → identical shape to LLM output
```

**Interest keywords** (comma-separated): `food`, `history`, `nature`, `art`, `shopping`, `religion`, `beach`, `sport`, `nightlife`

**Budget values**: `budget`, `moderate`, `luxury`

If no POIs match the requested interest categories (e.g. `beach` in a landlocked city), the service automatically retries with the broadest category (`interesting_places`).

### Two-Step Save Flow

Generation and saving are intentionally separate. Both strategies use the same save endpoint:

- `POST /v1/ai/plan` — LLM generation, preview only
- `POST /v1/ai/plan-smart` — Rule-based generation, preview only
- `POST /v1/ai/apply` — Save any approved itinerary to the trip record

---

## Database

### Schema

Two tables managed via Alembic migrations:

**users**
| Column | Type | Notes |
|---|---|---|
| id | INT | Primary key |
| email | VARCHAR | Unique |
| hashed_password | VARCHAR | bcrypt hash |
| is_active | BOOLEAN | Default true |
| created_at | DATETIME | Auto-set |

**trips**
| Column | Type | Notes |
|---|---|---|
| id | INT | Primary key |
| user_id | INT | Foreign key → users.id |
| title | VARCHAR | Required |
| destination | VARCHAR | Required |
| start_date | DATE | Required |
| end_date | DATE | Required |
| description | TEXT | Optional |
| notes | TEXT | Optional |
| created_at | DATETIME | Auto-set |

### Migrations

Alembic handles schema changes. Each migration is a versioned Python file with `upgrade()` and `downgrade()` functions, making schema changes reproducible and reversible across environments.

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

Passwords are hashed with bcrypt via `passlib`. A bcrypt-specific detail is handled: bcrypt truncates input at 72 bytes. For passwords longer than 72 bytes, the plain text is first SHA-256 hashed before bcrypt hashing, preventing silent truncation.

### User Isolation

Every trip query filters by both `trip_id` and `current_user.id`. A user cannot read, modify, or delete another user's trips — even if they know the trip ID.

---

## Testing Strategy

Tests use `pytest` with the following approach:

### Isolated Test Database

Tests run against an in-memory SQLite database, not the production MySQL instance. Each test function gets a fresh transaction that is rolled back after the test completes — no test data persists between tests and no cleanup code is needed.

### Dependency Override

FastAPI's `dependency_overrides` replaces the production database session with the test session. The application code runs unchanged — only the injected dependency differs.

### Test Coverage

| File                              | Type        | What it tests                               |
| --------------------------------- | ----------- | ------------------------------------------- |
| `unit/test_auth_unit.py`          | Unit        | Password hashing, token creation            |
| `integration/test_auth_api.py`    | Integration | Register, login, wrong password, /v1/auth/me |
| `integration/test_trips.py`       | Integration | Full CRUD, user isolation, access control   |
| `integration/test_ai_plan.py`     | Integration | AI generation with mocked Ollama client     |

### AI Test Isolation

The Ollama client is mocked with `AsyncMock` in AI tests. This means AI tests run instantly without requiring a real LLM, and can simulate any response shape to test parsing logic.

---

## Software Engineering Practices

### Single Responsibility

Each file and class has one job. Routes handle HTTP. Services handle business logic. Schemas handle validation. Models handle persistence. The Ollama client handles one thing: making HTTP calls to Ollama.

### Separation of Concerns

The API shape (Pydantic schemas) is deliberately separate from the database shape (SQLAlchemy models). This means the database can change without breaking the API contract, and vice versa.

### Fail-Safe Defaults

- Unauthenticated requests are rejected at the dependency level before reaching route logic
- Invalid data is rejected by Pydantic before reaching the database
- LLM output is validated through Pydantic before being returned to the client — malformed AI responses raise a controlled error rather than crashing

### Type Safety

The backend uses Python type annotations throughout, which enables IDE tooling, catches bugs early, and makes Pydantic and FastAPI work correctly. The frontend uses TypeScript for the same reasons — API responses have typed interfaces so incorrect data access is caught at compile time.

### Environment-Based Configuration

All secrets and environment-specific values (database URL, JWT secret, Ollama URL) are loaded from environment variables via `pydantic-settings`. No secrets are hardcoded in application logic.

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

Backend runs at `http://localhost:8000`. Interactive API docs available at `http://localhost:8000/docs`.

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
pytest tests/
```

---

## Environment Variables

| Variable                      | Required | Description                       |
| ----------------------------- | -------- | --------------------------------- |
| `DATABASE_URL`                | Yes      | MySQL connection string           |
| `JWT_SECRET`                  | Yes      | Secret key for signing JWT tokens |
| `JWT_ALG`                     | Yes      | JWT algorithm (default: `HS256`)  |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes      | Token lifetime in minutes         |
| `OLLAMA_BASE_URL`             | Yes      | Ollama server URL                 |
| `OLLAMA_MODEL`                | Yes      | Model name (e.g. `llama3.2:3b`)   |
| `OLLAMA_TIMEOUT_SECONDS`      | Yes      | Request timeout for LLM calls     |
| `OPENTRIPMAP_API_KEY`         | No       | Free key from opentripmap.com — required for `/v1/ai/plan-smart` |

Frontend:

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| `VITE_API_URL` | Backend API URL (default: `http://127.0.0.1:8000`) |

---

## API Reference

Full interactive documentation is available at `http://localhost:8000/docs` when the backend is running.

### Auth

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| POST   | `/v1/auth/register` | Create a new user account |
| POST   | `/v1/auth/login`    | Log in, receive JWT token |
| GET    | `/v1/auth/me`       | Get current user profile  |

### Trips

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| GET    | `/v1/trips/`     | List all trips for current user |
| POST   | `/v1/trips/`     | Create a new trip               |
| GET    | `/v1/trips/{id}` | Get a single trip               |
| PATCH  | `/v1/trips/{id}` | Partially update a trip         |
| DELETE | `/v1/trips/{id}` | Delete a trip                   |

### AI

| Method | Endpoint             | Description                                          |
| ------ | -------------------- | ---------------------------------------------------- |
| POST   | `/v1/ai/plan`        | Generate an itinerary via LLM (preview only)         |
| POST   | `/v1/ai/plan-smart`  | Generate an itinerary via rule-based engine (preview only) |
| POST   | `/v1/ai/apply`       | Save any generated itinerary to a trip               |

Both plan endpoints accept the same request body:

```json
{
  "trip_id": 1,
  "interests_override": "history,food",
  "budget_override": "moderate"
}
```
