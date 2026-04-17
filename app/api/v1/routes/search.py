from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.search import FlightSearchResult, InspirationResult, ExploreDestinationsResult
from app.services.travel import amadeus_service

router = APIRouter()

POPULAR_DESTINATIONS = [
    {"id": "tokyo", "city": "Tokyo", "country": "Japan", "tag": "Culture", "description": "Neon lights, ancient temples, and world-class ramen."},
    {"id": "bali", "city": "Bali", "country": "Indonesia", "tag": "Beach", "description": "Terraced rice fields, hidden temples, and turquoise surf."},
    {"id": "paris", "city": "Paris", "country": "France", "tag": "Culture", "description": "Café culture, art museums, and a tower lit at midnight."},
    {"id": "barcelona", "city": "Barcelona", "country": "Spain", "tag": "Food", "description": "Tapas bars, modernist architecture, and late-night markets."},
    {"id": "kyoto", "city": "Kyoto", "country": "Japan", "tag": "Culture", "description": "Bamboo forests, geisha districts, and 1,600 Buddhist temples."},
    {"id": "santorini", "city": "Santorini", "country": "Greece", "tag": "Beach", "description": "Blue-domed churches, cliff-top sunsets, and volcanic beaches."},
    {"id": "queenstown", "city": "Queenstown", "country": "New Zealand", "tag": "Adventure", "description": "Bungee jumping, ski slopes, and fjords around every bend."},
    {"id": "rome", "city": "Rome", "country": "Italy", "tag": "Culture", "description": "Two thousand years of history on every street corner."},
    {"id": "marrakech", "city": "Marrakech", "country": "Morocco", "tag": "Culture", "description": "Labyrinthine souks, rooftop riads, and mint tea at sunset."},
    {"id": "bangkok", "city": "Bangkok", "country": "Thailand", "tag": "Food", "description": "Street carts, floating markets, and flavours that hit hard."},
    {"id": "reykjavik", "city": "Reykjavik", "country": "Iceland", "tag": "Adventure", "description": "Northern lights, lava fields, and geysers at every turn."},
    {"id": "cape-town", "city": "Cape Town", "country": "South Africa", "tag": "Nature", "description": "Table Mountain, penguin colonies, and the end of the world."},
    {"id": "new-york", "city": "New York", "country": "USA", "tag": "Culture", "description": "Five boroughs, infinite bagels, and a skyline that delivers."},
    {"id": "auckland", "city": "Auckland", "country": "New Zealand", "tag": "Nature", "description": "Volcanic islands, harbour cruises, and world-class hiking."},
    {"id": "amsterdam", "city": "Amsterdam", "country": "Netherlands", "tag": "Culture", "description": "Canals, cycling culture, and world-class museums."},
    {"id": "dubai", "city": "Dubai", "country": "UAE", "tag": "Adventure", "description": "Skyscrapers, desert dunes, and tax-free shopping malls."},
    {"id": "singapore", "city": "Singapore", "country": "Singapore", "tag": "Food", "description": "Hawker centres, sky gardens, and seamless modernity."},
    {"id": "lisbon", "city": "Lisbon", "country": "Portugal", "tag": "Culture", "description": "Trams, pastel tiles, and the best custard tarts in the world."},
    {"id": "sydney", "city": "Sydney", "country": "Australia", "tag": "Beach", "description": "Harbour icons, golden beaches, and world-class surf."},
    {"id": "vienna", "city": "Vienna", "country": "Austria", "tag": "Culture", "description": "Imperial grandeur, coffee houses, and Mozart at every corner."},
]

REGION_DESTINATIONS = {
    "europe": [
        {"id": "amsterdam", "city": "Amsterdam"}, {"id": "athens", "city": "Athens"}, {"id": "barcelona", "city": "Barcelona"}, {"id": "berlin", "city": "Berlin"}, {"id": "birmingham", "city": "Birmingham"}, {"id": "brussels", "city": "Brussels"}, {"id": "bucharest", "city": "Bucharest"}, {"id": "budapest", "city": "Budapest"}, {"id": "cologne", "city": "Cologne"}, {"id": "copenhagen", "city": "Copenhagen"}, {"id": "dublin", "city": "Dublin"}, {"id": "edinburgh", "city": "Edinburgh"}, {"id": "frankfurt", "city": "Frankfurt"}, {"id": "hamburg", "city": "Hamburg"}, {"id": "helsinki", "city": "Helsinki"}, {"id": "istanbul", "city": "Istanbul"}, {"id": "lisbon", "city": "Lisbon"}, {"id": "london", "city": "London"}, {"id": "lyon", "city": "Lyon"}, {"id": "madrid", "city": "Madrid"}, {"id": "manchester", "city": "Manchester"}, {"id": "milan", "city": "Milan"}, {"id": "moscow", "city": "Moscow"}, {"id": "munich", "city": "Munich"}, {"id": "oslo", "city": "Oslo"}, {"id": "paris", "city": "Paris"}, {"id": "prague", "city": "Prague"}, {"id": "rome", "city": "Rome"}, {"id": "stockholm", "city": "Stockholm"}, {"id": "toulouse", "city": "Toulouse"}, {"id": "valencia", "city": "Valencia"}, {"id": "vienna", "city": "Vienna"}, {"id": "warsaw", "city": "Warsaw"}, {"id": "zurich", "city": "Zurich"},
    ],
    "asia": [
        {"id": "abu-dhabi", "city": "Abu Dhabi"}, {"id": "bangkok", "city": "Bangkok"}, {"id": "beijing", "city": "Beijing"}, {"id": "chennai", "city": "Chennai"}, {"id": "chengdu", "city": "Chengdu"}, {"id": "delhi", "city": "Delhi"}, {"id": "dhaka", "city": "Dhaka"}, {"id": "dubai", "city": "Dubai"}, {"id": "guangzhou", "city": "Guangzhou"}, {"id": "ho-chi-minh-city", "city": "Ho Chi Minh City"}, {"id": "hong-kong", "city": "Hong Kong"}, {"id": "hyderabad", "city": "Hyderabad"}, {"id": "jakarta", "city": "Jakarta"}, {"id": "karachi", "city": "Karachi"}, {"id": "kolkata", "city": "Kolkata"}, {"id": "kuala-lumpur", "city": "Kuala Lumpur"}, {"id": "kyoto", "city": "Kyoto"}, {"id": "lahore", "city": "Lahore"}, {"id": "manila", "city": "Manila"}, {"id": "mumbai", "city": "Mumbai"}, {"id": "osaka", "city": "Osaka"}, {"id": "riyadh", "city": "Riyadh"}, {"id": "seoul", "city": "Seoul"}, {"id": "shanghai", "city": "Shanghai"}, {"id": "shenzhen", "city": "Shenzhen"}, {"id": "singapore", "city": "Singapore"}, {"id": "taipei", "city": "Taipei"}, {"id": "tehran", "city": "Tehran"}, {"id": "tokyo", "city": "Tokyo"},
    ],
    "americas": [
        {"id": "atlanta", "city": "Atlanta"}, {"id": "austin", "city": "Austin"}, {"id": "bogota", "city": "Bogotá"}, {"id": "boston", "city": "Boston"}, {"id": "buenos-aires", "city": "Buenos Aires"}, {"id": "calgary", "city": "Calgary"}, {"id": "chicago", "city": "Chicago"}, {"id": "dallas", "city": "Dallas"}, {"id": "denver", "city": "Denver"}, {"id": "guadalajara", "city": "Guadalajara"}, {"id": "houston", "city": "Houston"}, {"id": "lima", "city": "Lima"}, {"id": "los-angeles", "city": "Los Angeles"}, {"id": "medellin", "city": "Medellín"}, {"id": "mexico-city", "city": "Mexico City"}, {"id": "miami", "city": "Miami"}, {"id": "minneapolis", "city": "Minneapolis"}, {"id": "montreal", "city": "Montreal"}, {"id": "new-york", "city": "New York"}, {"id": "philadelphia", "city": "Philadelphia"}, {"id": "portland", "city": "Portland"}, {"id": "rio-de-janeiro", "city": "Rio de Janeiro"}, {"id": "san-diego", "city": "San Diego"}, {"id": "san-francisco", "city": "San Francisco"}, {"id": "santiago", "city": "Santiago"}, {"id": "sao-paulo", "city": "São Paulo"}, {"id": "seattle", "city": "Seattle"}, {"id": "toronto", "city": "Toronto"}, {"id": "vancouver", "city": "Vancouver"}, {"id": "washington-dc", "city": "Washington D.C."},
    ],
    "africa": [
        {"id": "accra", "city": "Accra"}, {"id": "addis-ababa", "city": "Addis Ababa"}, {"id": "cairo", "city": "Cairo"}, {"id": "cape-town", "city": "Cape Town"}, {"id": "casablanca", "city": "Casablanca"}, {"id": "dar-es-salaam", "city": "Dar es Salaam"}, {"id": "johannesburg", "city": "Johannesburg"}, {"id": "kampala", "city": "Kampala"}, {"id": "khartoum", "city": "Khartoum"}, {"id": "lagos", "city": "Lagos"}, {"id": "nairobi", "city": "Nairobi"}, {"id": "tunis", "city": "Tunis"},
    ],
    "oceania": [
        {"id": "adelaide", "city": "Adelaide"}, {"id": "auckland", "city": "Auckland"}, {"id": "brisbane", "city": "Brisbane"}, {"id": "canberra", "city": "Canberra"}, {"id": "christchurch", "city": "Christchurch"}, {"id": "gold-coast", "city": "Gold Coast"}, {"id": "melbourne", "city": "Melbourne"}, {"id": "perth", "city": "Perth"}, {"id": "queenstown", "city": "Queenstown"}, {"id": "sydney", "city": "Sydney"}, {"id": "wellington", "city": "Wellington"},
    ],
}


@router.get("/flights", response_model=FlightSearchResult)
async def search_flights(
    origin: str = Query(..., min_length=3, max_length=3, description="Origin IATA code, e.g. LHR"),
    destination: str = Query(..., min_length=3, max_length=3, description="Destination IATA code, e.g. NRT"),
    date: str = Query(..., description="Departure date YYYY-MM-DD"),
    adults: int = Query(1, ge=1, le=9),
    _: User = Depends(get_current_user),
):
    """
    Search flight offers via Amadeus **sandbox** (test data, not real bookings).
    Results are cached for 60 s to stay within sandbox rate limits.
    """
    try:
        return await amadeus_service.search_flights(origin, destination, date, adults)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/inspirations", response_model=InspirationResult)
async def get_inspirations(
    origin: str = Query(..., min_length=3, max_length=3, description="Origin IATA code, e.g. MAD"),
    max_price: int | None = Query(None, ge=1, description="Optional max price in USD"),
    _: User = Depends(get_current_user),
):
    """
    Return cheapest reachable destinations from *origin* via Amadeus **sandbox**.
    Useful for "Where can I fly from here?" inspiration on the Explore page.
    """
    try:
        return await amadeus_service.get_inspirations(origin, max_price)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/explore-destinations", response_model=ExploreDestinationsResult)
async def get_explore_destinations(_: User = Depends(get_current_user)):
    """Return curated Explore destinations to keep the client render path light and cacheable."""
    return {"popular": POPULAR_DESTINATIONS, "regions": REGION_DESTINATIONS}
