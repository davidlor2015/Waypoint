from __future__ import annotations

from cachetools import TTLCache
from fastapi import HTTPException
import httpx
from sqlalchemy.orm import Session

from app.models.explore_destination import ExploreDestination
from app.repositories.explore_destination_repository import ExploreDestinationRepository
from app.schemas.search import (
    ExploreDestinationCreate,
    ExploreDestinationUpdate,
)

SCORE_CACHE: TTLCache[str, float] = TTLCache(maxsize=2048, ttl=60 * 60)
VALID_REGIONS = {"popular", "europe", "asia", "americas", "africa", "oceania"}

SEED_DESTINATIONS: list[dict[str, str | int | None]] = [
    {"slug": "tokyo", "city": "Tokyo", "country": "Japan", "region": "popular", "tag": "Culture", "description": "Neon lights, ancient temples, and world-class ramen.", "sort_order": 1},
    {"slug": "bali", "city": "Bali", "country": "Indonesia", "region": "popular", "tag": "Beach", "description": "Terraced rice fields, hidden temples, and turquoise surf.", "sort_order": 2},
    {"slug": "paris", "city": "Paris", "country": "France", "region": "popular", "tag": "Culture", "description": "Café culture, art museums, and a tower lit at midnight.", "sort_order": 3},
    {"slug": "barcelona", "city": "Barcelona", "country": "Spain", "region": "europe", "sort_order": 1},
    {"slug": "rome", "city": "Rome", "country": "Italy", "region": "europe", "sort_order": 2},
    {"slug": "amsterdam", "city": "Amsterdam", "country": "Netherlands", "region": "europe", "sort_order": 3},
    {"slug": "bangkok", "city": "Bangkok", "country": "Thailand", "region": "asia", "sort_order": 1},
    {"slug": "singapore", "city": "Singapore", "country": "Singapore", "region": "asia", "sort_order": 2},
    {"slug": "seoul", "city": "Seoul", "country": "South Korea", "region": "asia", "sort_order": 3},
    {"slug": "new-york", "city": "New York", "country": "USA", "region": "americas", "sort_order": 1},
    {"slug": "toronto", "city": "Toronto", "country": "Canada", "region": "americas", "sort_order": 2},
    {"slug": "sao-paulo", "city": "São Paulo", "country": "Brazil", "region": "americas", "sort_order": 3},
    {"slug": "cape-town", "city": "Cape Town", "country": "South Africa", "region": "africa", "sort_order": 1},
    {"slug": "cairo", "city": "Cairo", "country": "Egypt", "region": "africa", "sort_order": 2},
    {"slug": "nairobi", "city": "Nairobi", "country": "Kenya", "region": "africa", "sort_order": 3},
    {"slug": "sydney", "city": "Sydney", "country": "Australia", "region": "oceania", "sort_order": 1},
    {"slug": "auckland", "city": "Auckland", "country": "New Zealand", "region": "oceania", "sort_order": 2},
    {"slug": "queenstown", "city": "Queenstown", "country": "New Zealand", "region": "oceania", "sort_order": 3},
]


class ExploreDestinationService:
    def __init__(self, db: Session):
        self.repo = ExploreDestinationRepository(db)

    def _ensure_seeded(self) -> None:
        if self.repo.count_all() > 0:
            return
        rows = [
            ExploreDestination(
                slug=str(item["slug"]),
                city=str(item["city"]),
                country=str(item.get("country", "")),
                region=str(item["region"]),
                tag=item.get("tag"),
                description=item.get("description"),
                sort_order=int(item.get("sort_order", 0)),
                is_active=True,
            )
            for item in SEED_DESTINATIONS
        ]
        self.repo.create_many(rows)

    async def _score_for_slug(self, slug: str) -> float | None:
        if slug in SCORE_CACHE:
            return SCORE_CACHE[slug]
        url = f"https://api.teleport.org/api/urban_areas/slug:{slug}/scores/"
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                score = float(resp.json().get("teleport_city_score", 0))
                SCORE_CACHE[slug] = score
                return score
        except Exception:
            return None

    async def get_grouped(self, region: str | None, include_scores: bool) -> dict[str, list[dict]]:
        if region and region not in VALID_REGIONS:
            raise HTTPException(status_code=400, detail="Unsupported region")

        self._ensure_seeded()
        rows = self.repo.list_active()

        grouped: dict[str, list[dict]] = {k: [] for k in VALID_REGIONS if k != "popular"}
        grouped["popular"] = []

        for row in rows:
            if region and row.region not in {"popular", region}:
                continue
            score = await self._score_for_slug(row.slug) if include_scores else None
            payload = {
                "slug": row.slug,
                "city": row.city,
                "country": row.country,
                "region": row.region,
                "tag": row.tag,
                "description": row.description,
                "sort_order": row.sort_order,
                "teleport_score": score,
            }
            if row.region == "popular":
                grouped["popular"].append(payload)
            elif row.region in grouped:
                grouped[row.region].append(payload)

        return grouped

    def create(self, data: ExploreDestinationCreate) -> ExploreDestination:
        if data.region not in VALID_REGIONS:
            raise HTTPException(status_code=400, detail="Unsupported region")
        row = ExploreDestination(**data.model_dump())
        return self.repo.create(row)

    def update(self, slug: str, patch: ExploreDestinationUpdate) -> ExploreDestination:
        row = self.repo.get_by_slug(slug)
        if not row:
            raise HTTPException(status_code=404, detail="Destination not found")

        updates = patch.model_dump(exclude_unset=True)
        if "region" in updates and updates["region"] not in VALID_REGIONS:
            raise HTTPException(status_code=400, detail="Unsupported region")

        for key, value in updates.items():
            setattr(row, key, value)

        self.repo.commit()
        return row

    def delete(self, slug: str) -> None:
        row = self.repo.get_by_slug(slug)
        if not row:
            raise HTTPException(status_code=404, detail="Destination not found")
        self.repo.delete(row)
