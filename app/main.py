from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import auth, trips, ai
from app.api.middleware.error_handler import global_exception_handler
from app.core.logging import configure_logging

configure_logging()

app = FastAPI(title="Travel Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(Exception, global_exception_handler)

app.include_router(auth.router, prefix="/v1/auth", tags=["Auth"])
app.include_router(trips.router, prefix="/v1/trips", tags=["Trips"])
app.include_router(ai.router, prefix="/v1/ai", tags=["AI"])
