import { useState, useEffect } from "react";
import { getTrips, deleteTrip } from "../../../shared/api/trips";
import {
  planItinerary,
  planItinerarySmart,
  applyItinerary,
  type Itinerary,
} from "../../../shared/api/ai";
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

const LoadingSkeleton = () => {
  return (
    <div className="trip-list-shell container stack-lg">
      <header className="trip-list-header row-between">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-pill" />
      </header>

      <ul className="trip-list-items stack-md" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={index}
            className="trip-card ui-card ui-card--padded stack-md"
          >
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="actions-row">
              <div className="skeleton skeleton-pill" />
              <div className="skeleton skeleton-pill" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const TripList = ({ token, onCreateClick }: TripListProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pendingItineraries, setPendingItineraries] = useState<
    Record<number, Itinerary>
  >({});
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [generatingSmartIds, setGeneratingSmartIds] = useState<Set<number>>(new Set());
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
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;

    setActionError(null);
    try {
      await deleteTrip(token, id);
      setTrips((prevTrips) => prevTrips.filter((trip) => trip.id !== id));
    } catch (err) {
      console.error("Failed to delete trip:", err);
      setActionError("Failed to delete trip. Please try again.");
    }
  };

  const handleGenerate = async (tripId: number) => {
    setActionError(null);
    setGeneratingIds((prev) => new Set(prev).add(tripId));

    try {
      const itinerary = await planItinerary(token, tripId);
      setPendingItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to generate itinerary.",
      );
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  const handleGenerateSmart = async (tripId: number) => {
    setActionError(null);
    setGeneratingSmartIds((prev) => new Set(prev).add(tripId));

    try {
      const itinerary = await planItinerarySmart(token, tripId);
      setPendingItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to generate itinerary.",
      );
    } finally {
      setGeneratingSmartIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  const handleApply = async (tripId: number) => {
    const itinerary = pendingItineraries[tripId];
    if (!itinerary) return;

    setActionError(null);
    setApplyingIds((prev) => new Set(prev).add(tripId));

    try {
      await applyItinerary(token, tripId, itinerary);
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, description: JSON.stringify(itinerary) }
            : t,
        ),
      );
      setPendingItineraries((prev) => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to apply itinerary.",
      );
    } finally {
      setApplyingIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="trip-list-shell container stack-lg">
        <header className="trip-list-header row-between">
          <h2 className="section-title">My Trips</h2>
          <button
            onClick={onCreateClick}
            className="btn btn-primary trip-list-create-btn"
          >
            + Create New Trip
          </button>
        </header>
        <div className="status status-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="trip-list-shell container stack-lg">
      <header className="trip-list-header row-between">
        <div className="stack-xs">
          <h2 className="section-title">My Trips</h2>
          <p className="section-subtitle">
            Plan, generate, and save itineraries in one place.
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="btn btn-primary trip-list-create-btn"
        >
          + Create New Trip
        </button>
      </header>

      {actionError && (
        <div className="status status-error" role="alert">
          {actionError}
        </div>
      )}

      {trips.length === 0 ? (
        <section className="empty-state stack-md" aria-live="polite">
          <h3 className="trip-empty-title">No trips yet</h3>
          <p className="status-muted">
            Create your first trip to start planning your itinerary.
          </p>
          <div>
            <button onClick={onCreateClick} className="btn btn-primary">
              + Create New Trip
            </button>
          </div>
        </section>
      ) : (
        <ul className="trip-list-items stack-md">
          {trips.map((trip) => {
            const isGenerating = generatingIds.has(trip.id);
            const isGeneratingSmart = generatingSmartIds.has(trip.id);
            const isApplying = applyingIds.has(trip.id);
            const pendingItinerary = pendingItineraries[trip.id];
            const hasSavedItinerary = !!trip.description;

            return (
              <li
                key={trip.id}
                className="trip-card ui-card ui-card--padded stack-md"
              >
                <div className="trip-title-row">
                  <h3 className="trip-title">{trip.title}</h3>
                  {hasSavedItinerary && (
                    <span className="badge badge-success">Itinerary saved</span>
                  )}
                </div>

                <dl className="trip-meta">
                  <div className="trip-meta-row">
                    <dt>Destination</dt>
                    <dd>{trip.destination}</dd>
                  </div>
                  <div className="trip-meta-row">
                    <dt>Dates</dt>
                    <dd>
                      {new Date(trip.start_date).toLocaleDateString()} -{" "}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                {pendingItinerary ? (
                  <ItineraryPanel
                    itinerary={pendingItinerary}
                    onApply={() => handleApply(trip.id)}
                    applying={isApplying}
                  />
                ) : (
                  <div className="actions-row">
                    <button
                      onClick={() => handleGenerate(trip.id)}
                      disabled={isGenerating || isGeneratingSmart}
                      className="btn btn-primary"
                    >
                      {isGenerating ? "Generating..." : "AI Plan"}
                    </button>

                    <button
                      onClick={() => handleGenerateSmart(trip.id)}
                      disabled={isGenerating || isGeneratingSmart}
                      className="btn btn-secondary"
                    >
                      {isGeneratingSmart ? "Generating..." : "Smart Plan"}
                    </button>

                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="btn btn-danger"
                    >
                      Delete Trip
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
