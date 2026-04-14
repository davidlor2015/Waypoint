import json
import logging
from typing import AsyncGenerator, Optional
from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.schemas.ai import ItineraryResponse
from app.services.llm.ollama_client import OllamaClient
from app.services.ai.rule_based_service import generate_rule_based_itinerary
from app.repositories.trip_repository import TripRepository
from app.repositories.itinerary_repository import ItineraryRepository

logger = logging.getLogger(__name__)


class ItineraryService:
    def __init__(self, db: Session):
        self.trip_repo = TripRepository(db)
        self.itinerary_repo = ItineraryRepository(db)
        self.llm_client = OllamaClient()

    def _build_system_prompt(self) -> str:
        """
        Defines the AI's persona and strict output rules.
        """
        return """You are a travel planner. Output ONLY valid JSON with this structure:
{"title":"...","summary":"...","days":[{"day_number":1,"date":null,"items":[{"time":"09:00AM","title":"...","location":"...","notes":"...","cost_estimate":"$20"}]}],"budget_breakdown":null,"packing_list":null,"tips":null}
Always fill in cost_estimate for every item (e.g. "Free", "$10", "$50"). No markdown. No explanation. JSON only."""

    def _build_user_prompt(self, trip: Trip, interests: str = None, budget: str = None) -> str:
        """
        Combines DB data into a natural language request.
        """
        dest = trip.destination or "Unknown Location"
        start = str(trip.start_date) if trip.start_date else "TBD"
        end = str(trip.end_date) if trip.end_date else "TBD"
        
        user_interests = interests or "General sightseeing"
        user_budget = budget or "Moderate"
        
        return f"""Plan a short trip:
Destination: {dest}
Dates: {start} to {end}
Budget: {user_budget}
Interests: {user_interests}
Limit to 3 days max, 3 activities per day. Return JSON only."""

    def _clean_json_string(self, raw_text: str) -> str:
        """
        LLMs sometimes wrap JSON in markdown (```json ... ```).
        We need to strip that out.
        """
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "", 1)
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "", 1)
        if cleaned.endswith("```"):
            cleaned = cleaned.replace("```", "", 1)
        return cleaned.strip()

    async def generate_itinerary(self, trip_id: int, user_id: int, 
                                 interests_override: str = None, 
                                 budget_override: str = None) -> ItineraryResponse:
        """
        Orchestrates the generation process.
        """
        # 1. Fetch Context
        trip = self.trip_repo.get_by_id_and_user(trip_id, user_id)
        if not trip:
            raise ValueError("Trip not found or access denied.")

        # 2. Build Prompts
        sys_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(trip, interests_override, budget_override)

        # 3. Call LLM
        raw_response = await self.llm_client.generate_json(sys_prompt, user_prompt)
        logger.info(f"LLM raw response: {raw_response}")
        
        # 4. Validate & Parse
        try:
            # Clean potential markdown
            clean_json = self._clean_json_string(raw_response)
            parsed_dict = json.loads(clean_json)
            
            # Pydantic Validation
            itinerary = ItineraryResponse(**parsed_dict)
            return itinerary
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse LLM response: {raw_response}")
            logger.error(f"Parse error detail: {e}")
            raise ValueError("AI generated invalid data. Please try again.")

    async def generate_itinerary_rule_based(
        self,
        trip_id: int,
        user_id: int,
        interests_override: str = None,
        budget_override: str = None,
    ) -> ItineraryResponse:
        """Generates an itinerary using real POI data (OpenTripMap) — no LLM required."""
        trip = self.trip_repo.get_by_id_and_user(trip_id, user_id)
        if not trip:
            raise ValueError("Trip not found or access denied.")
        return await generate_rule_based_itinerary(trip, interests_override, budget_override)

    async def stream_itinerary(
        self,
        trip_id: int,
        user_id: int,
        interests_override: Optional[str] = None,
        budget_override: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Yields Server-Sent Events for the client:
          - 'token' events carry raw LLM text chunks for live display.
          - 'complete' event carries the final validated ItineraryResponse JSON.
          - 'error' event carries a human-readable message on failure.
        """
        trip = self.trip_repo.get_by_id_and_user(trip_id, user_id)
        if not trip:
            yield f"event: error\ndata: {json.dumps({'message': 'Trip not found or access denied.'})}\n\n"
            return

        sys_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(trip, interests_override, budget_override)

        full_text = ""
        try:
            async for token in self.llm_client.stream_json(sys_prompt, user_prompt):
                full_text += token
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            logger.error(f"Streaming LLM error: {e}")
            yield f"event: error\ndata: {json.dumps({'message': 'LLM connection failed. Is Ollama running?'})}\n\n"
            return

        try:
            clean_json = self._clean_json_string(full_text)
            parsed = json.loads(clean_json)
            itinerary = ItineraryResponse(**parsed)
            yield f"event: complete\ndata: {itinerary.model_dump_json()}\n\n"
        except Exception:
            logger.error(f"Failed to parse streamed LLM response: {full_text}")
            yield f"event: error\ndata: {json.dumps({'message': 'AI generated invalid data. Please try again.'})}\n\n"

    def apply_itinerary_to_db(self, trip_id: int, user_id: int,
                              itinerary: ItineraryResponse) -> Trip:
        """
        Persists the approved itinerary in two places:

        1. Relational tables (itinerary_days / itinerary_events) — the source of
           truth for structured queries and future API use.
        2. trip.description — kept as a plain-text + JSON fallback so the existing
           frontend parser continues to work without changes in this phase.
        """
        trip = self.trip_repo.get_by_id_and_user(trip_id, user_id)
        if not trip:
            raise ValueError("Trip not found.")

        # Save structured data to relational tables.
        self.itinerary_repo.save_itinerary(trip_id, itinerary)

        # Update trip metadata (title + legacy description string).
        return self.trip_repo.update(trip, {
            "title": itinerary.title,
            "description": (
                f"SUMMARY: {itinerary.summary}\n\n"
                f"DETAILS (JSON): {itinerary.model_dump_json(indent=2)}"
            ),
        })