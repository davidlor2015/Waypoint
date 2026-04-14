# Waypoint

A full-stack web application for planning trips with AI-generated itineraries. Users can register, log in, manage trips, and generate day-by-day travel plans using either a locally-hosted large language model or a rule-based engine powered by real-world POI data.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Backend Design](#backend-design)
- [Frontend Design](#frontend-design)
- [AI Integration](#ai-integration)
- [Database](#database)
- [Authentication and Security](#authentication-and-security)
- [Testing Strategy](#testing-strategy)
- [Software Engineering Practices](#software-engineering-practices)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Trips](#trips)
  - [Matching](#matching)
  - [AI](#ai)
  - [Search](#search)

## Overview

Waypoint lets users:

- Register and log in with secure JWT-based authentication
- Create, view, update, and delete trips with destination and date information
- Generate day-by-day itineraries via a local LLM (Ollama) or a rule-based engine using live POI data
- Preview a generated itinerary before saving it, then apply it to the trip record
- View saved itineraries stored relationally (per-day, per-event) in the database
- Track per-trip packing lists and budget expenses, persisted in localStorage
- Browse curated destination cards on an Explore page and launch trip planning directly from a card
- Search live flight offers and get destination inspiration via the Amadeus sandbox API (clearly labelled as test data)
- View per-destination quality scores (housing, cost of living, safety, etc.) sourced from the Teleport public API
- View a gamified traveller profile with stats, earned badges, and destination history
- Create a travel-companion matching profile with travel style, budget range, interests, group size, and discoverability settings
- Open companion requests for trips and browse ranked matches in the Companions tab
- Land on a polished marketing page before signing in, with animated feature highlights and CTAs that route into registration or login
- View an interactive map of a saved itinerary's locations — per-day colour-coded pins, dashed route polylines, and popup details, powered by Leaflet and OpenStreetMap

## Tech Stack

### Backend

| Technology       | Version       | Purpose                                                |
| ---------------- | ------------- | ------------------------------------------------------ |
| Python           | 3.11+         | Primary language                                       |
| FastAPI          | 0.128.0       | Async REST API framework                               |
| SQLAlchemy       | 2.0.46        | ORM and database abstraction                           |
| Alembic          | 1.18.3        | Database schema migrations                             |
| Pydantic         | 2.12.5        | Request/response validation                            |
| psycopg2-binary  | 2.9.9         | PostgreSQL/MySQL database driver                       |
| python-jose      | 3.5.0         | JWT token encoding/decoding                            |
| passlib + bcrypt | 1.7.4 / 4.3.0 | Password hashing                                       |
| httpx            | 0.28.1        | Async HTTP client (Ollama + OpenTripMap calls)         |
| slowapi          | 0.1.9         | Rate limiting on AI generation endpoints               |
| cachetools       | 7.0.5         | In-memory TTLCache for geocoding, POI, and flight data |
| amadeus          | 9.0+          | Official SDK for Amadeus travel APIs                   |
| Uvicorn          | 0.40.0        | ASGI server                                            |

### Frontend

| Technology          | Version | Purpose                                     |
| ------------------- | ------- | ------------------------------------------- |
| React               | 19.2.0  | UI framework                                |
| TypeScript          | 5.9.3   | Type-safe JavaScript                        |
| Vite                | 7.2.4   | Build tool and dev server                   |
| Tailwind CSS        | 4.x     | Utility-first styling via @tailwindcss/vite |
| Framer Motion       | 12.x    | Spring animations and layout transitions    |
| zod                 | 4.x     | Client-side schema validation               |
| react-hook-form     | 7.x     | Form state management with resolvers        |
| @hookform/resolvers | 5.x     | Bridges react-hook-form with zod            |
| react-leaflet       | 4.x     | React bindings for Leaflet interactive maps |
| leaflet             | 1.x     | Map rendering engine (OpenStreetMap tiles)  |
| ESLint              | 9.39.1  | Code linting                                |

### Infrastructure

| Technology           | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| PostgreSQL 15        | Primary relational database                           |
| Ollama + llama3.2:3b | Local LLM for AI itinerary generation                 |
| OpenTripMap API      | Real-world POI data for rule-based planning           |
| Nominatim (OSM)      | Free geocoding (city name to lat/lon)                 |
| Amadeus (sandbox)    | Flight search and destination inspiration (test data) |
| Teleport API         | City quality-of-life scores — public, no key needed   |

## Architecture

The application follows a clean separation of concerns across three layers:

```
+-------------------------------------+
|         React Frontend (Vite)        |
|         localhost:5173               |
+---------------+---------------------+
                |  HTTP / JSON
                v
+-------------------------------------+
|         FastAPI Backend              |
|         localhost:8000               |
|                                     |
|  Routes -> Services -> Repos -> DB  |
+-----------+--------------+----------+
            |              |
            v              v
     +-----------+   +------------+
     | PostgreSQL|   |   Ollama   |
     |   :5432   |   |   :11434   |
     +-----------+   +------------+
```

The frontend communicates with the backend exclusively through a REST API. The backend handles all business logic, database access, and LLM communication. The frontend has no direct database or LLM access.

## Project Structure

```
travel-planner/
+-- app/                              # FastAPI backend
|   +-- main.py                       # App entry point, CORS, rate-limit handler, routers
|   +-- api/
|   |   +-- deps.py                   # Dependency injection (auth, DB session)
|   |   +-- v1/
|   |       +-- routes/
|   |           +-- auth.py           # /v1/auth endpoints
|   |           +-- trips.py          # /v1/trips CRUD endpoints
|   |           +-- ai.py             # /v1/ai generation endpoints (rate-limited)
|   |           +-- search.py         # /v1/search flight and inspiration endpoints (Amadeus)
|   |           +-- matching.py       # /v1/matching profile, requests, and match results
|   +-- core/
|   |   +-- config.py                 # Settings loaded from environment
|   |   +-- limiter.py                # slowapi Limiter singleton
|   |   +-- security.py               # JWT creation, password hashing
|   +-- db/
|   |   +-- session.py                # SQLAlchemy session factory
|   |   +-- base.py                   # Model registry (for Alembic)
|   +-- models/
|   |   +-- user.py
|   |   +-- trip.py
|   |   +-- itinerary.py              # ItineraryDay + ItineraryEvent
|   |   +-- travel_profile.py
|   |   +-- match_request.py
|   |   +-- match_result.py
|   +-- repositories/
|   |   +-- base.py                   # Generic BaseRepository[T]
|   |   +-- user_repository.py
|   |   +-- trip_repository.py
|   |   +-- itinerary_repository.py   # save_itinerary() atomic replace, get_days_by_trip()
|   |   +-- travel_profile_repository.py
|   |   +-- match_request_repository.py
|   |   +-- match_result_repository.py
|   +-- schemas/
|   |   +-- auth.py
|   |   +-- user.py
|   |   +-- trip.py
|   |   +-- ai.py                     # ItineraryItem (+ lat/lon), DayPlan, ItineraryResponse
|   |   +-- itinerary.py              # ItineraryEventRead, ItineraryDayRead
|   |   +-- search.py                 # FlightOffer, FlightSearchResult, InspirationResult
|   |   +-- matching.py               # TravelProfile, MatchRequest, MatchResult API schemas
|   +-- services/
|       +-- auth_service.py
|       +-- trip_service.py
|       +-- travel_profile_service.py
|       +-- matching_service.py
|       +-- compatibility_scorer.py   # Pure scoring helpers + ScoreBreakdown dataclass
|       +-- ai/
|       |   +-- itinerary_service.py  # LLM pipeline; apply saves to relational tables
|       |   +-- rule_based_service.py # OpenTripMap pipeline with TTLCache
|       +-- llm/
|       |   +-- ollama_client.py
|       +-- travel/
|           +-- amadeus_service.py    # Amadeus SDK wrapper; asyncio.to_thread; 60 s TTLCache
+-- alembic/
|   +-- versions/
|       +-- eb8ceb58b88e_create_user_table.py
|       +-- 70fee314e52b_add_trips_table.py
|       +-- 3f8a1b9c2d4e_add_itinerary_tables.py
|       +-- 8d7f1c2a9b4e_add_travel_profiles_table.py # matching tables + trip discoverability
+-- tests/
|   +-- conftest.py                   # Shared fixtures, SQLite test DB, rate-limiter reset
|   +-- unit/
|   |   +-- test_auth_unit.py
|   |   +-- test_compatibility_scorer.py
|   +-- integration/
|       +-- test_auth_api.py
|       +-- test_trips.py
|       +-- test_ai_plan.py
|       +-- test_itinerary_apply.py
|       +-- test_rate_limit.py
|       +-- test_matching.py
+-- ui/                               # React frontend
    +-- index.html                    # Manrope + Cormorant Garamond loaded via Google Fonts
    +-- src/
        +-- index.css                 # Tailwind v4 import + @theme design tokens
        +-- App.tsx
        +-- app/
        |   +-- config.ts
        |   +-- AppShell/             # Sticky navbar, animated tab indicator, logout
        +-- features/
        |   +-- landing/
        |   |   +-- LandingPage.tsx   # Marketing page: hero, features, steps, CTA strip, footer
        |   +-- auth/
        |   |   +-- LoginPage/        # Card entrance animation, register/login toggle; initialMode + onBack props
        |   +-- dashboard/
        |   |   +-- Dashboard.tsx     # Stat cards (staggered), dual bar charts, destinations map
        |   |   +-- DestinationsMap.tsx # react-leaflet map with geocoded trip pins
        |   +-- explore/
        |   |   +-- ExplorePage.tsx   # FlightSearch + Teleport scores + 16 curated cards with tag filter
        |   +-- search/
        |   |   +-- FlightSearch.tsx  # Tabbed flight search / inspiration UI; Amadeus test-env badge
        |   +-- profile/
        |   |   +-- useProfileStats.ts     # useMemo derivation: stats, 8 badge rules, traveller title
        |   |   +-- ProfilePage.tsx        # Avatar, stat grid, badge grid (earned/locked), destinations
        |   |   +-- MatchingPage.tsx       # Companion discovery page / matching profile gate
        |   |   +-- TravelProfileForm.tsx
        |   |   +-- MatchRequestList.tsx
        |   |   +-- MatchRequestCard.tsx
        |   |   +-- MatchResultList.tsx
        |   |   +-- MatchResultCard.tsx
        |   |   +-- ScoreBar.tsx
        |   |   +-- useMatchingProfile.ts
        |   |   +-- useMatchRequests.ts
        |   |   +-- useMatchResults.ts
        |   +-- trips/
        |       +-- TripList/         # Staggered card list, SSE streaming display
        |       +-- CreateTripForm/   # react-hook-form + zod, animated field errors, defaultDestination prop
        |       +-- EditTripModal/    # Prefilled edit form in an animated modal overlay
        |       +-- ItineraryPanel/   # Day/event breakdown, apply button; SVG pin icons
        |       +-- ItineraryMap/     # Interactive Leaflet map: per-day coloured pins, route polylines
        |       |   +-- ItineraryMap.tsx    # MapContainer, BoundsFitter, DayLegend, createPin divIcon
        |       |   +-- useItineraryPins.ts # Merges item.lat/lon with Nominatim fallback into ItineraryPin[]
        |       +-- PackingList/      # Per-trip checklist, localStorage, progress bar, AnimatePresence items
        |       +-- BudgetTracker/    # Per-trip expense tracker, localStorage, category pills, dynamic progress bar
        |       +-- schemas/
        |           +-- tripSchema.ts # Zod schema mirroring TripCreate Pydantic model
        +-- shared/
            +-- api/
            |   +-- auth.ts
            |   +-- trips.ts          # getTrips, createTrip, updateTrip, deleteTrip
            |   +-- ai.ts             # planItinerarySmart, applyItinerary, timeout constants
            |   +-- search.ts         # searchFlights, getInspirations; typed response interfaces
            |   +-- matching.ts       # typed matching profile / request / result client
            +-- hooks/
            |   +-- useGeocode.ts           # Nominatim geocoding with module-level session cache
            |   +-- useStreamingItinerary.ts # SSE fetch stream reader, per-trip state management
            |   +-- useTeleportScore.ts      # Teleport city quality score (public API, no key)
            +-- ui/
                +-- FormField.tsx     # Shared label + animated error wrapper
                +-- inputCls.ts       # Shared input className helper
```

## Backend Design

### Layered Architecture

The backend is organized into four distinct layers, each with a single responsibility:

```
Routes -> Services -> Repositories -> DB
```

**Routes** (`app/api/v1/routes/`) handle HTTP concerns only: parse requests, delegate to services, return responses. No business logic or DB queries live here.

**Services** (`app/services/`) own all business logic. `AuthService` handles registration and login. `TripService` handles CRUD with ownership checks. `ItineraryService` orchestrates the full LLM pipeline and delegates persistence to `ItineraryRepository`. `TravelProfileService` manages matching-profile reads and upserts. `MatchingService` opens requests, scores candidates, stores ranked results, and invalidates stale matches when source data changes.

**Repositories** (`app/repositories/`) are the only layer that writes SQLAlchemy queries. `BaseRepository[T]` provides generic `get_by_id`, `add`, and `delete`. `ItineraryRepository` handles the atomic save of nested `ItineraryDay` and `ItineraryEvent` rows. Matching repositories encapsulate profile upserts, candidate trip lookups, and match result bulk upserts / cleanup.

**Models** (`app/models/`) contain SQLAlchemy ORM definitions. `ItineraryDay` and `ItineraryEvent` extend the schema with a fully relational itinerary structure. `TravelProfile`, `MatchRequest`, and `MatchResult` power the companion-matching feature, while `Trip.is_discoverable` controls whether a trip can appear in candidate searches.

**Schemas** (`app/schemas/`) are Pydantic v2 models for API request and response. They are separate from ORM models so the API shape and the database shape can evolve independently. Matching response schemas are intentionally UI-oriented, returning a structured score breakdown plus `matched_trip` and `matched_user` objects.

### Matching System

The matching flow is layered on top of trips and user profiles:

```
TravelProfile -> MatchRequest -> Candidate Search -> Compatibility Scoring -> MatchResult
```

- Each user can maintain one `TravelProfile`
- A match request can be opened only for a trip the user owns
- Candidate trips are filtered by matching destination, overlapping dates, `is_discoverable=True`, and different owner
- `compatibility_scorer.py` calculates pure-function scores for destination, date overlap, travel style, budget, interests, and group size
- Results below the minimum threshold are discarded, and surviving matches are stored in `match_results`
- `MatchingService._invalidate()` clears stale results when a profile is updated, a trip is updated, or a trip is deleted

### Rate Limiting

AI generation endpoints (`/v1/ai/plan`, `/v1/ai/plan-smart`) are rate-limited per client IP using `slowapi`. The limit is configured via the `AI_RATE_LIMIT` environment variable (default: `10/minute`). The `/v1/ai/apply` endpoint is intentionally not rate-limited because it is a cheap database write. Exceeded limits return `HTTP 429 Too Many Requests`.

### API Versioning

All routes are prefixed with `/v1/`. This allows non-breaking changes under `/v2/` in the future without disrupting existing clients.

### Dependency Injection

FastAPI's `Depends()` system injects shared resources:

```python
SessionDep  = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User,    Depends(get_current_user)]
```

Route functions declare what they need. FastAPI handles wiring. Dependencies are swapped in tests without changing production code.

### Data Validation

Pydantic v2 validates all incoming request data. Invalid requests are rejected before reaching route logic. `TripCreate` enforces `end_date >= start_date` via a `@model_validator`. `ItineraryResponse` coerces LLM type mismatches (int costs, string tips) to the expected types before the response reaches the service layer.

## Frontend Design

### Design System

The frontend uses Tailwind CSS v4 (via `@tailwindcss/vite`) with a custom theme defined in `index.css` using the `@theme` block. All custom design tokens are declared there and generate standard Tailwind utility classes automatically. No separate `tailwind.config.js` is required.

The visual theme ("Cultured Traveller") is built around a warm editorial palette, dual-family typography, and fully rounded pill-shaped interactive elements:

| Token                | Value              | Usage                                                                                                                   |
| -------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `--color-ivory`      | #FAFAF9            | Page background                                                                                                         |
| `--color-smoke`      | #E7E5E4            | Borders and dividers                                                                                                    |
| `--color-parchment`  | #F5F5F4            | Subtle fills, ghost buttons, card hover states                                                                          |
| `--color-espresso`   | #1C1917            | Primary text, headings, active nav pill                                                                                 |
| `--color-flint`      | #78716C            | Secondary / muted text                                                                                                  |
| `--color-amber`      | #B45309            | Primary CTA, focus rings, badges                                                                                        |
| `--color-amber-dark` | #92400E            | Amber hover state                                                                                                       |
| `--color-clay`       | #8B5A3E            | Secondary accent (PackingList, second buttons)                                                                          |
| `--color-clay-dark`  | #7A4E33            | Clay hover state                                                                                                        |
| `--color-olive`      | #3F6212            | Nature / success (cost pills, budget progress)                                                                          |
| `--color-danger`     | #881337            | Error banners, over-budget indicators                                                                                   |
| `--font-sans`        | Manrope            | All UI text, loaded via Google Fonts                                                                                    |
| `--font-display`     | Cormorant Garamond | Headlines; auto-applied to h1–h6 via `@layer base`; add `font-display` class to non-heading elements styled as headings |

Framer Motion handles all transitions. Spring-based animations (`type: 'spring', bounce: 0.28`) are used consistently across card entrances, tab indicators, and button interactions so the UI feels responsive and energetic rather than mechanical.

The base font size is set to `0.9375rem` (15 px) in `index.css` so all `rem`-based utility classes scale proportionally without touching individual component styles.

All icons throughout the application are inline SVG components — no emoji characters are used anywhere. This guarantees pixel-perfect, consistent rendering across platforms and colour schemes. SVG icon components (`PlaneIcon`, `GlobeIcon`, `MapPinIcon`, etc.) are co-located with the component that uses them or placed in `shared/ui/` when reused across features.

### Shared Primitives

To enforce DRY across feature components, reusable UI elements live in `shared/`:

- `shared/ui/FormField.tsx` — label and animated error message wrapper used by every form in the app.
- `shared/ui/inputCls.ts` — shared input className helper (border, focus ring, error state). Kept in its own file so `FormField.tsx` exports only a component and satisfies the Fast Refresh constraint.
- `shared/hooks/useGeocode.ts` — geocodes destination strings via Nominatim. Results are stored in a module-level `Map` so the same city is never fetched twice within a session, and requests are spaced 1.1 s apart to respect Nominatim's rate limit.
- `shared/hooks/useStreamingItinerary.ts` — manages one SSE fetch stream per trip. Parses `token`, `complete`, and `error` events from the server, accumulates raw text for live display, and exposes `start()` / `reset()` per trip ID.

### AppShell

`AppShell` (`src/app/AppShell/`) is the persistent layout wrapper rendered for all authenticated views. It contains:

- A sticky top navigation bar with the app logo (inline SVG plane icon)
- An animated tab indicator that slides between five tabs — Dashboard, My Trips, Explore, Companions, and Profile — using Framer Motion's `layoutId` prop. The pill slides smoothly to the active tab without JavaScript measurement or manual positioning. Each tab uses an inline SVG icon instead of an emoji.
- A logout button with hover and tap scale animations

### Feature-Based Structure

The frontend is organized by feature. Each feature owns its components, hooks, and validation schemas:

```
features/
  landing/
    LandingPage.tsx      pre-auth marketing page; sticky navbar, hero section with Framer Motion blob
                         animations, animated features grid (whileInView), numbered how-it-works steps,
                         CTA strip, footer; "Get Started" routes to register, "Sign In" routes to login;
                         no "AI" copy, no emoji — inline SVG icons throughout
  auth/
    LoginPage/           entrance animation, register/login toggle with AnimatePresence;
                         accepts initialMode ('login' | 'register') and onBack props so App.tsx
                         can route back to the landing page from the auth screen
  dashboard/
    Dashboard.tsx        stat cards with staggered entrance, dual Recharts bar charts
    DestinationsMap.tsx  Leaflet map with one pin per unique destination, OSM tiles
  explore/
    ExplorePage.tsx      FlightSearch panel at top (Amadeus); 16 curated destination cards each
                         enriched with a live Teleport quality score badge; search and tag filter;
                         Plan CTA pre-fills CreateTripForm and switches tab automatically
  search/
    FlightSearch.tsx     two-tab panel: "Search Flights" (origin/dest/date/adults) and "Get Inspired"
                         (cheapest destinations from an origin); prominent "Amadeus Test Environment"
                         badge on every result; "Plan trip" CTA passes destination to trip creation
  profile/
    useProfileStats.ts   pure useMemo hook — derives stats, 8 badge rules (including
                         localStorage reads for packing/budget badges), traveller title
    ProfilePage.tsx      avatar, 4 stat cards, badge grid (earned/locked), destination pills
    MatchingPage.tsx     companion discovery page; gates on matching profile existence
    TravelProfileForm.tsx matching profile editor with react-hook-form + zod
    MatchRequestList.tsx open and list requests for the current user's trips
    MatchRequestCard.tsx request summary card with close action and expandable matches
    MatchResultList.tsx  fetches and renders match results for a specific request
    MatchResultCard.tsx  match summary card with expandable score breakdown
    ScoreBar.tsx         reusable animated score/progress component
    useMatchingProfile.ts fetches/upserts matching profile
    useMatchRequests.ts  manages request list, open, and close actions
    useMatchResults.ts   fetches results by request id
  trips/
    TripList/            staggered card list, SSE streaming display, edit modal trigger
    CreateTripForm/      react-hook-form + zod, animated per-field error messages
                         accepts optional defaultDestination prop for Explore handoff
    EditTripModal/       animated modal overlay with prefilled form, PUT /v1/trips/{id}
    ItineraryPanel/      day and event breakdown, apply button; SVG map-pin icons replace emoji
    ItineraryMap/        interactive Leaflet map rendered below a saved itinerary; per-day
                         colour-coded numbered pins (L.DivIcon), dashed route polylines per day,
                         BoundsFitter inner component reactively fits the viewport, DayLegend
                         shows coloured day pills when itinerary spans multiple days;
                         useItineraryPins hook resolves coordinates from item.lat/lon first,
                         falls back to Nominatim geocoding for plain location strings
    PackingList/         per-trip checklist persisted in localStorage; clay-accented panel;
                         progress bar, AnimatePresence item enter/exit; usePackingList hook
    BudgetTracker/       per-trip expense tracker persisted in localStorage; amber-accented;
                         category pills (Food/Transport/Stay/Activities/Other); progress bar
                         transitions olive → amber → danger as spend approaches limit;
                         useBudgetTracker hook
    schemas/
      tripSchema.ts      Zod schema mirroring backend TripCreate
```

### Form Validation

`CreateTripForm` uses `react-hook-form` with a `zodResolver` to validate all fields before any network request is made. The Zod schema (`tripSchema.ts`) mirrors the backend `TripCreate` Pydantic model exactly:

- `title` and `destination`: required, max 255 characters
- `start_date` and `end_date`: required ISO date strings
- Cross-field: `end_date >= start_date` (same rule as the backend `@model_validator`)
- `notes`: optional

Validation errors appear inline below each field with an `AnimatePresence` slide-in animation. The `noValidate` attribute disables browser-native validation so Zod is the single source of truth.

`TravelProfileForm` follows the same pattern for the matching feature, using `react-hook-form` + `zod` for radio-pill enums, interest chips, group-size fields, and the discoverability toggle.

### AI Generation — Streaming (AI Plan)

The primary "AI Plan" flow uses Server-Sent Events so tokens appear on screen as the LLM produces them, rather than after a silent 60–120 second wait.

1. The frontend calls `GET /v1/ai/stream/{trip_id}` with an `Authorization: Bearer` header via `fetch()` (not `EventSource`, which does not support custom headers).
2. `useStreamingItinerary` reads the `ReadableStream` body chunk by chunk, assembles SSE messages across chunk boundaries, and dispatches on event type:
   - `token` — appends the raw text to per-trip state; rendered live in a monospace scrollable box inside the trip card.
   - `complete` — sets the validated `Itinerary` object; the card transitions to the preview/apply view.
   - `error` — displays a per-card error banner.
3. A Cancel button aborts the in-flight fetch via `AbortController`.

### AI Generation — Non-Streaming (Smart Plan)

The rule-based "Smart Plan" uses a standard `POST` request with a 3-minute `AbortController` hard timeout. A spinner is shown inside the card while waiting. On completion the result goes through the same preview/apply flow as the streaming path.

### API Layer Separation

All `fetch` calls are isolated in `shared/api/` or `shared/hooks/`. React components never call `fetch` directly.

### Landing Page Routing

`App.tsx` manages an `authMode: 'login' | 'register' | null` state alongside the authenticated `user` state:

- `authMode === null` and no user → renders `<LandingPage>` (marketing page)
- `authMode === 'login'` or `'register'` and no user → renders `<LoginPage initialMode={authMode} onBack={...}>` (clicking Back returns to landing page)
- `user` present → renders `<AppShell>` (authenticated views)

Logging out clears both `user` and resets `authMode` to `null`, so the user lands back on the marketing page rather than the login form.

```
shared/api/auth.ts                -> login(), register()
shared/api/trips.ts               -> getTrips(), createTrip(), updateTrip(), deleteTrip()
shared/api/ai.ts                  -> planItinerarySmart(), applyItinerary()
shared/api/search.ts              -> searchFlights(), getInspirations()
shared/api/matching.ts            -> getProfile(), upsertProfile(), getRequests(), openRequest(), closeRequest(), getMatches()
shared/hooks/useStreamingItinerary -> manages SSE fetch stream for AI Plan
shared/hooks/useGeocode           -> geocodes destination strings for the map
shared/hooks/useTeleportScore     -> fetches Teleport city quality score per destination card
```

## AI Integration

The app supports two independent itinerary generation strategies, both returning the same `ItineraryResponse` shape. The save flow (`/ai/apply`) works identically for both.

### Strategy 1 — LLM (Ollama)

Uses a local Ollama instance running `llama3.2:3b`. No external API keys required.

```
1. Fetch trip from DB         -> verify ownership, get destination/dates
2. Build system prompt        -> set persona, inject JSON schema constraints
3. Build user prompt          -> inject trip details, interests, budget
4. Call Ollama                -> async HTTP POST via httpx
5. Clean response             -> strip markdown code fences if present
6. Parse JSON                 -> json.loads()
7. Validate with Pydantic     -> ItineraryResponse(**parsed_dict)
8. Return structured object   -> guaranteed shape, safe to use
```

### Strategy 2 — Rule-Based (OpenTripMap)

Generates itineraries from real POI data without an LLM. Entirely free, no credit card required.

```
1. Fetch trip from DB         -> verify ownership, get destination/dates
2. Geocode destination        -> Nominatim converts city name to lat/lon (cached 24 h)
3. Map user interests         -> translate keywords to OpenTripMap category kinds
4. Fetch POIs                 -> OpenTripMap radius endpoint (cached 1 h per location+kinds)
5. Score and rank             -> sort by POI rating, deduplicate by name
6. Assemble days              -> slot top N POIs across trip days (max 7 days, 3 per day)
7. Return ItineraryResponse   -> identical shape to LLM output
```

**Caching:** Nominatim responses are cached for 24 hours. OpenTripMap POI lists are cached for 1 hour keyed by `(lat_rounded_3dp, lon_rounded_3dp, kinds)`. Both caches are module-level `TTLCache` instances from `cachetools`.

**Interest keywords** (comma-separated): `food`, `history`, `nature`, `art`, `shopping`, `religion`, `beach`, `sport`, `nightlife`

**Budget values**: `budget`, `mid_range`, `luxury`

If no POIs match the requested interest categories, the service automatically retries with the broadest category (`interesting_places`).

### Strategy 3 — Streaming LLM (SSE)

`GET /v1/ai/stream/{trip_id}` runs the same LLM pipeline as Strategy 1 but streams output token by token using FastAPI's `StreamingResponse` with `media_type="text/event-stream"`.

```
1. Fetch trip from DB            -> verify ownership
2. Build prompts                 -> same as Strategy 1
3. Call Ollama (stream=True)     -> OllamaClient.stream_json() reads NDJSON line by line
4. Yield token SSE events        -> one event per non-empty content chunk
5. Assemble full text            -> concatenate all tokens
6. Validate with Pydantic        -> ItineraryResponse(**parsed_dict)
7. Yield complete SSE event      -> validated JSON payload
```

If Ollama raises an error or the JSON is invalid, an `error` SSE event is yielded and the generator returns cleanly. `X-Accel-Buffering: no` is set on the response so nginx proxies do not buffer the stream.

### Two-Step Save Flow

Generation and saving are intentionally separate:

- `GET /v1/ai/stream/{trip_id}` — LLM streaming generation, preview only
- `POST /v1/ai/plan` — LLM generation (non-streaming), preview only
- `POST /v1/ai/plan-smart` — Rule-based generation, preview only
- `POST /v1/ai/apply` — Save any approved itinerary to the trip record

On apply, the itinerary is persisted in two places:

1. **Relational tables** (`itinerary_days`, `itinerary_events`) — the source of truth for structured queries
2. **`trip.description`** — a plain-text and JSON fallback kept for backward compatibility with the frontend parser

## Database

### Schema

Core tables managed via Alembic migrations:

**users**

| Column          | Type    | Notes        |
| --------------- | ------- | ------------ |
| id              | INT     | Primary key  |
| email           | VARCHAR | Unique       |
| hashed_password | VARCHAR | bcrypt hash  |
| is_active       | BOOLEAN | Default true |

**trips**

| Column          | Type     | Notes                                          |
| --------------- | -------- | ---------------------------------------------- |
| id              | INT      | Primary key                                    |
| user_id         | INT      | FK to users.id                                 |
| title           | VARCHAR  | Required                                       |
| destination     | VARCHAR  | Required, indexed                              |
| start_date      | DATE     | Required                                       |
| end_date        | DATE     | Required                                       |
| description     | TEXT     | Legacy itinerary string                        |
| notes           | TEXT     | User interests/notes                           |
| is_discoverable | BOOLEAN  | Whether trip can appear in matching candidates |
| created_at      | DATETIME | Auto-set                                       |

**itinerary_days**

| Column     | Type    | Notes                           |
| ---------- | ------- | ------------------------------- |
| id         | INT     | Primary key                     |
| trip_id    | INT     | FK to trips.id (CASCADE DELETE) |
| day_number | INT     | 1-indexed day of the itinerary  |
| day_date   | VARCHAR | ISO date string (nullable)      |

**itinerary_events**

| Column        | Type    | Notes                                    |
| ------------- | ------- | ---------------------------------------- |
| id            | INT     | Primary key                              |
| day_id        | INT     | FK to itinerary_days.id (CASCADE DELETE) |
| sort_order    | INT     | Preserves activity order within a day    |
| time          | VARCHAR | e.g. "09:00 AM" (nullable)               |
| title         | VARCHAR | Activity name                            |
| location      | VARCHAR | Human-readable location (nullable)       |
| lat           | FLOAT   | Latitude (nullable)                      |
| lon           | FLOAT   | Longitude (nullable)                     |
| notes         | TEXT    | Description or tip (nullable)            |
| cost_estimate | VARCHAR | e.g. "$20", "Free" (nullable)            |

**travel_profiles**

| Column          | Type    | Notes                                       |
| --------------- | ------- | ------------------------------------------- |
| id              | INT     | Primary key                                 |
| user_id         | INT     | FK to users.id, unique                      |
| travel_style    | VARCHAR | `adventure`, `relaxed`, `cultural`, `party` |
| budget_range    | VARCHAR | `budget`, `mid_range`, `luxury`             |
| interests       | JSON    | Array of strings                            |
| group_size_min  | INT     | Minimum preferred group size                |
| group_size_max  | INT     | Maximum preferred group size                |
| is_discoverable | BOOLEAN | Syncs discoverability onto the user's trips |

**match_requests**

| Column      | Type     | Notes                                                |
| ----------- | -------- | ---------------------------------------------------- |
| id          | INT      | Primary key                                          |
| sender_id   | INT      | FK to users.id                                       |
| receiver_id | INT      | FK to users.id                                       |
| trip_id     | INT      | FK to trips.id                                       |
| status      | VARCHAR  | Stored as enum; current UI contract uses open/closed |
| created_at  | DATETIME | Auto-set                                             |

There is a partial unique index preventing duplicate open requests for the same sender, receiver, and trip.

**match_results**

| Column       | Type  | Notes                                       |
| ------------ | ----- | ------------------------------------------- |
| id           | INT   | Primary key                                 |
| request_a_id | INT   | FK to match_requests.id                     |
| request_b_id | INT   | FK to match_requests.id                     |
| score        | FLOAT | Total compatibility score                   |
| breakdown    | JSON  | Per-factor score details returned to the UI |

`match_results` also enforces `UNIQUE(request_a_id, request_b_id)`.

### Migrations

| File           | Description                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `eb8ceb58b88e` | Create users table                                                            |
| `70fee314e52b` | Add trips table                                                               |
| `3f8a1b9c2d4e` | Add itinerary_days and itinerary_events tables                                |
| `8d7f1c2a9b4e` | Add travel_profiles, match_requests, match_results, and trips.is_discoverable |

## Authentication and Security

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

Passwords are hashed with bcrypt via `passlib`. A SHA-256 pre-hash step handles bcrypt's 72-byte truncation limit so long passwords are not silently weakened.

### User Isolation

Every trip query filters by both `trip_id` and `current_user.id`. A user cannot read, modify, or delete another user's trips even if they know the trip ID.

The same ownership checks apply to matching. A user can only read and update their own travel profile, open requests on their own trips, view results for requests they own, and close their own requests.

### CORS

`CORSMiddleware` is configured with an explicit origin allowlist from `CORS_ORIGINS` (defaults to `http://localhost:5173`). No wildcard origins are used in production configuration.

### Rate Limiting

The two AI generation endpoints are protected by `slowapi` per client IP:

| Endpoint                 | Limit (default) |
| ------------------------ | --------------- |
| `POST /v1/ai/plan`       | 10 requests/min |
| `POST /v1/ai/plan-smart` | 10 requests/min |
| `POST /v1/ai/apply`      | No limit        |

The limit is configurable via the `AI_RATE_LIMIT` environment variable using slowapi's string syntax (e.g. `"20/minute"`, `"100/hour"`).

## Testing Strategy

Tests use `pytest` with the following approach.

### Isolated Test Database

Tests run against an in-memory SQLite database, not the production PostgreSQL instance. Each test gets a fresh transaction that is rolled back after the test. No test data persists and no cleanup code is needed.

### Dependency Override

FastAPI's `dependency_overrides` replaces the production database session with the test session. Application code runs unchanged; only the injected dependency differs.

### Rate Limiter Isolation

An `autouse` fixture calls `limiter._storage.reset()` before and after every test, preventing rate-limit hits in one test from bleeding into the next. The `AI_RATE_LIMIT` environment variable is set to `"3/minute"` in the test environment so rate-limit exhaustion can be triggered with just four requests.

### Test Coverage

| File                                  | Type        | What it tests                                                                                                           |
| ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `unit/test_auth_unit.py`              | Unit        | Password hashing, token creation                                                                                        |
| `integration/test_auth_api.py`        | Integration | Register, login, wrong password, /me                                                                                    |
| `integration/test_trips.py`           | Integration | Full CRUD, user isolation, access control                                                                               |
| `integration/test_ai_plan.py`         | Integration | LLM generation with mocked Ollama client                                                                                |
| `integration/test_itinerary_apply.py` | Integration | Repository save, replace, order; apply endpoint saves relational rows, reapply replaces, wrong-owner 404                |
| `integration/test_rate_limit.py`      | Integration | Per-IP limit enforced on plan and plan-smart; apply not limited; geocode and POI cache hits verified                    |
| `unit/test_compatibility_scorer.py`   | Unit        | Destination, overlap, budget, interests, group size, and weighted compatibility scoring                                 |
| `integration/test_matching.py`        | Integration | Missing profile validation, duplicate requests, overlap/no-overlap, discoverability filtering, request closing behavior |

## Software Engineering Practices

### Single Responsibility

Each file and class has one job. Routes handle HTTP. Services handle business logic. Repositories handle database access. Schemas handle validation. `OllamaClient` does one thing: make HTTP calls to Ollama (`generate_json` for batch, `stream_json` for SSE). On the frontend, sub-components like `StatCard`, `FormField`, `PillButton`, and `StreamingDisplay` each handle one concern. Shared hooks (`useGeocode`, `useStreamingItinerary`) own data-fetching logic so components stay pure renderers.

### Separation of Concerns

The API shape (Pydantic schemas) is deliberately separate from the database shape (SQLAlchemy models). The database can change without breaking the API contract, and vice versa. Client-side Zod schemas mirror the backend Pydantic schemas, creating a consistent validation contract across the full stack. On the frontend, business logic lives in custom hooks or handler functions; components are responsible only for rendering.

### Fail-Safe Defaults

- Unauthenticated requests are rejected at the dependency level before reaching route logic
- Invalid data is rejected by Pydantic before reaching the database
- LLM output is validated through Pydantic before being returned to the client
- Client requests to AI endpoints are guarded by a hard 3-minute `AbortController` timeout
- Matching results are invalidated when source profile or trip data changes, preventing stale compatibility rankings

### Type Safety

The backend uses Python type annotations throughout. The frontend uses TypeScript with explicit interfaces for all props, state, and API responses. The use of `any` is not permitted. The Zod schema on the frontend is the TypeScript source of truth for form data (`TripFormData = z.infer<typeof tripSchema>`).

### Environment-Based Configuration

All secrets and environment-specific values are loaded from environment variables via `pydantic-settings`. No secrets are hardcoded in application logic. On the frontend, the API base URL is routed through Vite's `import.meta.env`.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- Ollama with `llama3.2:3b` pulled

### Backend Setup

```bash
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env

alembic upgrade head

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
pytest tests/ -v
```

## Environment Variables

### Backend

| Variable                      | Required | Description                                                         |
| ----------------------------- | -------- | ------------------------------------------------------------------- |
| `DATABASE_URL`                | Yes      | PostgreSQL connection string                                        |
| `JWT_SECRET`                  | Yes      | Secret key for signing JWT tokens                                   |
| `JWT_ALG`                     | Yes      | JWT algorithm (default: HS256)                                      |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes      | Token lifetime in minutes                                           |
| `CORS_ORIGINS`                | No       | Comma-separated allowed origins (default: http://localhost:5173)    |
| `OLLAMA_BASE_URL`             | Yes      | Ollama server URL                                                   |
| `OLLAMA_MODEL`                | Yes      | Model name (e.g. llama3.2:3b)                                       |
| `OLLAMA_TIMEOUT_SECONDS`      | Yes      | Request timeout for LLM calls                                       |
| `OPENTRIPMAP_API_KEY`         | No       | Free key from opentripmap.com, required for /v1/ai/plan-smart       |
| `AI_RATE_LIMIT`               | No       | slowapi limit string for AI endpoints (default: 10/minute)          |
| `AMADEUS_CLIENT_ID`           | No       | Amadeus self-service app Client ID — required for /v1/search/\*     |
| `AMADEUS_CLIENT_SECRET`       | No       | Amadeus self-service app Client Secret — required for /v1/search/\* |

### Frontend

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `VITE_API_URL` | Backend API URL (default: http://127.0.0.1:8000) |

## API Reference

Full interactive documentation at `http://localhost:8000/docs` when the backend is running.

### Auth

| Method | Endpoint            | Auth | Description               |
| ------ | ------------------- | ---- | ------------------------- |
| POST   | `/v1/auth/register` | None | Create a new user account |
| POST   | `/v1/auth/login`    | None | Log in, receive JWT token |
| GET    | `/v1/auth/me`       | JWT  | Get current user profile  |

### Trips

| Method | Endpoint         | Auth | Description                     |
| ------ | ---------------- | ---- | ------------------------------- |
| GET    | `/v1/trips/`     | JWT  | List all trips for current user |
| POST   | `/v1/trips/`     | JWT  | Create a new trip               |
| GET    | `/v1/trips/{id}` | JWT  | Get a single trip               |
| PATCH  | `/v1/trips/{id}` | JWT  | Partially update a trip         |
| DELETE | `/v1/trips/{id}` | JWT  | Delete a trip                   |

### Matching

| Method | Endpoint                             | Auth | Description                                          |
| ------ | ------------------------------------ | ---- | ---------------------------------------------------- |
| POST   | `/v1/matching/profile`               | JWT  | Create or update the current user's matching profile |
| GET    | `/v1/matching/profile`               | JWT  | Read the current user's matching profile             |
| POST   | `/v1/matching/requests`              | JWT  | Open a companion request for one of the user's trips |
| GET    | `/v1/matching/requests`              | JWT  | List the current user's match requests               |
| DELETE | `/v1/matching/requests/{id}`         | JWT  | Close a request                                      |
| GET    | `/v1/matching/requests/{id}/matches` | JWT  | Get ranked matches for a request                     |

`POST /v1/matching/requests` returns the created request plus any stored matches meeting the score threshold.

`GET /v1/matching/requests/{id}/matches` supports:

| Query param | Required | Description                          |
| ----------- | -------- | ------------------------------------ |
| `min_score` | No       | Minimum score filter (default `0.0`) |
| `limit`     | No       | Max number of matches returned       |
| `offset`    | No       | Pagination offset                    |

### AI

| Method | Endpoint                  | Auth | Rate Limited | Description                                                   |
| ------ | ------------------------- | ---- | ------------ | ------------------------------------------------------------- |
| GET    | `/v1/ai/stream/{trip_id}` | JWT  | No           | Stream an itinerary via LLM as SSE (token / complete / error) |
| POST   | `/v1/ai/plan`             | JWT  | Yes          | Generate an itinerary via LLM (preview only, non-streaming)   |
| POST   | `/v1/ai/plan-smart`       | JWT  | Yes          | Generate an itinerary via rule-based engine (preview only)    |
| POST   | `/v1/ai/apply`            | JWT  | No           | Save any generated itinerary to a trip                        |

**SSE event types** returned by `/v1/ai/stream/{trip_id}`:

| Event      | Data shape                    | Meaning                                    |
| ---------- | ----------------------------- | ------------------------------------------ |
| `token`    | `{"token": "..."}`            | One raw LLM text chunk                     |
| `complete` | Full `ItineraryResponse` JSON | Generation done; validated itinerary ready |
| `error`    | `{"message": "..."}`          | Generation failed; human-readable reason   |

Both plan endpoints accept the same request body:

```json
{
  "trip_id": 1,
  "interests_override": "history,food",
  "budget_override": "moderate"
}
```

Exceeded rate limits return `HTTP 429 Too Many Requests`.

### Search

All search endpoints use the **Amadeus sandbox** (test data, not live availability) and require authentication. Results are cached server-side for 60 seconds. The `test_env: true` field is always present in responses and the frontend labels results clearly.

| Method | Endpoint                  | Auth | Description                                             |
| ------ | ------------------------- | ---- | ------------------------------------------------------- |
| GET    | `/v1/search/flights`      | JWT  | Search flight offers for a given route and date         |
| GET    | `/v1/search/inspirations` | JWT  | Get cheapest destinations reachable from an origin city |

**Flight search query parameters:**

| Parameter     | Required | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `origin`      | Yes      | 3-letter IATA code (e.g. `LHR`)               |
| `destination` | Yes      | 3-letter IATA code (e.g. `NRT`)               |
| `date`        | Yes      | Departure date `YYYY-MM-DD`                   |
| `adults`      | No       | Number of adult passengers (default 1, max 9) |

**Inspiration query parameters:**

| Parameter   | Required | Description                       |
| ----------- | -------- | --------------------------------- |
| `origin`    | Yes      | 3-letter IATA code (e.g. `MAD`)   |
| `max_price` | No       | Optional upper price limit in USD |

Both endpoints return `HTTP 503` with a descriptive message when `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` are not configured.

> **Teleport city scores** are fetched directly from the public Teleport API (`api.teleport.org`) by the frontend — no backend endpoint or API key required. Each curated destination card loads its score independently and degrades silently if the city is not found in the Teleport dataset.
