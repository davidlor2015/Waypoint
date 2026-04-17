from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.routes import auth, trips, ai, search, matching, packing, budget
from app.api.middleware.error_handler import global_exception_handler
from app.core.config import settings
from app.core.limiter import limiter
from app.core.logging import configure_logging

configure_logging()

app = FastAPI(title="Waypoint API")

# CORS — origins are configured via CORS_ORIGINS env var.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting — slowapi reads app.state.limiter; the exception handler
# converts RateLimitExceeded into a proper 429 JSON response.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_exception_handler(Exception, global_exception_handler)

app.include_router(auth.router, prefix="/v1/auth", tags=["Auth"])
app.include_router(trips.router, prefix="/v1/trips", tags=["Trips"])
app.include_router(matching.router, prefix="/v1/matching", tags=["Matching"])
app.include_router(ai.router, prefix="/v1/ai", tags=["AI"])
app.include_router(search.router, prefix="/v1/search", tags=["Search"])
app.include_router(packing.router, prefix="/v1/trips/{trip_id}/packing", tags=["Packing"])
app.include_router(budget.router, prefix="/v1/trips/{trip_id}/budget", tags=["Budget"])
