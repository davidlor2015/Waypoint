# app/scripts/generate_itineraries.py
"""
Mass-generate itinerary records using the local Ollama model and save them to
a JSON file (default: data/generated_itineraries.json).

Run standalone:
    python -m app.scripts.generate_itineraries [options]

Or import run() to call from the pipeline orchestrator.
Adjust the generation matrix constants below to expand or shrink the batch.
Each combination triggers one Ollama call.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from itertools import product
from pathlib import Path

from app.services.ollama_service import OllamaService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Defaults ──────────────────────────────────────────────────────────────────

OUTPUT_PATH = Path("data/generated_itineraries.json")
DEFAULT_MODEL = "qwen2.5:14b"
DEFAULT_MAX_RECORDS: int | None = 20

# ── Generation matrix ─────────────────────────────────────────────────────────
# Edit these to expand or restrict what gets generated.

DESTINATIONS: list[tuple[str, str]] = [
    ("Rome",             "Italy"),
    ("Paris",            "France"),
    ("Tokyo",            "Japan"),
    ("Barcelona",        "Spain"),
    ("New York City",    "USA"),
    ("Ho Chi Minh City", "Vietnam"),
]

INTEREST_COMBOS: list[list[str]] = [
    ["food", "history", "walking"],
    ["culture", "food", "city exploration"],
    ["nightlife", "food", "shopping"],
    ["landmarks", "walking", "photography"],
]

DAYS_OPTIONS:   list[int] = [3, 5, 7]
BUDGET_OPTIONS: list[str] = ["budget", "moderate"]
PACE_OPTIONS:   list[str] = ["relaxed", "balanced"]



def _make_id(
    destination: str,
    days: int,
    budget: str,
    pace: str,
    interests: list[str],
) -> str:
    dest_slug = destination.lower().replace(" ", "-")
    interest_slug = "-".join(i.split()[0][:4] for i in interests)
    return f"{dest_slug}-{days}d-{budget[:3]}-{interest_slug}-{pace[:3]}"


def _build_plan() -> list[dict]:
    combos = []
    for (dest, country), interests, days, budget, pace in product(
        DESTINATIONS, INTEREST_COMBOS, DAYS_OPTIONS, BUDGET_OPTIONS, PACE_OPTIONS,
    ):
        combos.append({
            "destination": dest,
            "country":     country,
            "days":        days,
            "budget":      budget,
            "pace":        pace,
            "interests":   list(interests),
        })
    return combos


def _save(records: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def run(
    output_path: Path = OUTPUT_PATH,
    max_records: int | None = DEFAULT_MAX_RECORDS,
    model: str = DEFAULT_MODEL,
) -> dict:
    """Generate itineraries and write them to *output_path*.

    Returns a summary dict: succeeded, failed, output_path.
    """
    plan = _build_plan()
    if max_records is not None:
        plan = plan[:max_records]
    total = len(plan)
    logger.info("Generation plan: %d combinations | model: %s", total, model)
    logger.info("Output: %s", output_path.resolve())

    service = OllamaService(model=model)
    results: list[dict] = []
    failed = 0

    for idx, params in enumerate(plan, start=1):
        dest = params["destination"]
        logger.info(
            "[%d/%d] %s — %dd | budget=%s | pace=%s | interests=%s",
            idx, total, dest, params["days"], params["budget"], params["pace"],
            ", ".join(params["interests"]),
        )
        t0 = time.monotonic()
        try:
            data = service.generate_itinerary(
                destination=params["destination"],
                country=    params["country"],
                days=       params["days"],
                budget=     params["budget"],
                pace=       params["pace"],
                interests=  params["interests"],
            )
        except Exception as exc:
            logger.error("  FAILED (%s): %s", type(exc).__name__, exc)
            failed += 1
            continue

        elapsed = time.monotonic() - t0
        itinerary_id = _make_id(
            params["destination"], params["days"],
            params["budget"], params["pace"], params["interests"],
        )
        record: dict = {
            "itinerary_id": itinerary_id,
            "destination":  params["destination"],
            "country":      params["country"],
            "days":         params["days"],
            "budget":       params["budget"],
            "interests":    params["interests"],
            "pace":         params["pace"],
            "source_type":  "generated",
            "title":        data.get("title", f"{params['days']}-Day {dest} Trip"),
            "summary":      data.get("summary", ""),
            "day_plans":    data.get("day_plans", []),
        }
        results.append(record)
        logger.info(
            "  OK in %.1fs — %d day(s). ID: %s",
            elapsed, len(record["day_plans"]), itinerary_id,
        )
        # Incremental save so a mid-run interruption doesn't lose completed work.
        _save(results, output_path)

    logger.info(
        "Generation complete: %d/%d succeeded, %d failed.",
        len(results), total, failed,
    )
    return {"succeeded": len(results), "failed": failed, "output_path": output_path}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate travel itineraries using a local Ollama model.",
    )
    parser.add_argument(
        "--output-path", default=str(OUTPUT_PATH), metavar="PATH",
        help=f"Destination JSON file (default: {OUTPUT_PATH})",
    )
    parser.add_argument(
        "--max-records", type=int,
        default=DEFAULT_MAX_RECORDS if DEFAULT_MAX_RECORDS is not None else 0,
        metavar="N",
        help="Records to generate; 0 = all combinations (default: 20)",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL, metavar="MODEL",
        help=f"Ollama model for generation (default: {DEFAULT_MODEL})",
    )
    args = parser.parse_args()

    stats = run(
        output_path=Path(args.output_path),
        max_records=args.max_records if args.max_records > 0 else None,
        model=args.model,
    )
    if stats["failed"] and stats["succeeded"] == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
