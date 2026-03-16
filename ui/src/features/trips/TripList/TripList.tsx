import { useState, useEffect } from "react";
import { getTrips, deleteTrip } from "../../../shared/api/trips";
import { planItinerary, applyItinerary, type Itinerary } from "../../../shared/api/ai";
import { ItineraryPanel } from "../ItineraryPanel";
import "./TripList.css";

interface Trip {
  id: number;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string | null;
  notes: string | null;
}

interface TripListProps {
  token: string;
  onCreateClick: () => void;
}

export const TripList = ({ token, onCreateClick }: TripListProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-trip AI state: tripId → itinerary being previewed
  const [pendingItineraries, setPendingItineraries] = useState<Record<number, Itinerary>>({});
  // Tracks which trips are currently generating or applying
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [applyingIds, setApplyingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTrips(token);
        setTrips(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occured",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;

    try {
      await deleteTrip(token, id);
      setTrips((prevTrips) => prevTrips.filter((trip) => trip.id !== id));
    } catch (err) {
      console.error("Failed to delete trip:", err);
      alert("Failed to delete the trip. Please try again.");
    }
  };

  const handleGenerate = async (tripId: number) => {
    setGeneratingIds((prev) => new Set(prev).add(tripId));
    try {
      const itinerary = await planItinerary(token, tripId);
      setPendingItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate itinerary.");
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  const handleApply = async (tripId: number) => {
    const itinerary = pendingItineraries[tripId];
    if (!itinerary) return;

    setApplyingIds((prev) => new Set(prev).add(tripId));
    try {
      await applyItinerary(token, tripId, itinerary);
      // Save itinerary JSON into the trip's description locally so the saved badge appears
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId ? { ...t, description: JSON.stringify(itinerary) } : t
        )
      );
      setPendingItineraries((prev) => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply itinerary.");
    } finally {
      setApplyingIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  if (loading) return <div>Loading trips...</div>;
  if (error) return <div className="trip-error">{error}</div>;

  return (
    <div className="trip-list-container">
      <header className="trip-list-header">
        <h2>My Trips</h2>
        <button onClick={onCreateClick}>+ Create New Trip</button>
      </header>

      {trips.length === 0 ? (
        <p>You don't have any trips planned yet.</p>
      ) : (
        <ul className="trip-list-items">
          {trips.map((trip) => {
            const isGenerating = generatingIds.has(trip.id);
            const isApplying = applyingIds.has(trip.id);
            const pendingItinerary = pendingItineraries[trip.id];
            const hasSavedItinerary = !!trip.description;

            return (
              <li key={trip.id} className="trip-card">
                <h3 className="trip-title">
                  {trip.title}
                  {hasSavedItinerary && (
                    <span className="trip-saved-badge">Itinerary saved</span>
                  )}
                </h3>
                <p>
                  <strong>Destination:</strong> {trip.destination}
                </p>
                <p>
                  <strong>Dates:</strong>{" "}
                  {new Date(trip.start_date).toLocaleDateString()} -{" "}
                  {new Date(trip.end_date).toLocaleDateString()}
                </p>

                {pendingItinerary ? (
                  <ItineraryPanel
                    itinerary={pendingItinerary}
                    onApply={() => handleApply(trip.id)}
                    applying={isApplying}
                  />
                ) : (
                  <button
                    onClick={() => handleGenerate(trip.id)}
                    disabled={isGenerating}
                    className="trip-generate-btn"
                  >
                    {isGenerating ? "Generating..." : hasSavedItinerary ? "Regenerate Itinerary" : "Generate Itinerary"}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(trip.id)}
                  className="trip-delete-btn"
                >
                  Delete Trip
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
