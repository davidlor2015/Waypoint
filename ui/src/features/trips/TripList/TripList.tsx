import { useState, useEffect, useRef } from "react";
import { getTrips, deleteTrip } from "../../../shared/api/trips";
import {
  planItinerary,
  planItinerarySmart,
  applyItinerary,
  AI_REQUEST_TIMEOUT_MS,
  AI_SLOW_THRESHOLD_MS,
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

// ------------------------------------------------------------------
// Loading skeleton (shown while the trip list is first fetched)
// ------------------------------------------------------------------

const LoadingSkeleton = () => (
  <div className="trip-list-shell container stack-lg">
    <header className="trip-list-header row-between">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-pill" />
    </header>
    <ul className="trip-list-items stack-md" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="trip-card ui-card ui-card--padded stack-md">
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

// ------------------------------------------------------------------
// Generating indicator (shown inside a trip card during AI generation)
// ------------------------------------------------------------------

interface GeneratingIndicatorProps {
  elapsedSeconds: number;
}

const GeneratingIndicator = ({ elapsedSeconds }: GeneratingIndicatorProps) => {
  const isSlow = elapsedSeconds * 1000 >= AI_SLOW_THRESHOLD_MS;
  return (
    <div className="generating-indicator" aria-live="polite" aria-atomic="true">
      <span className="generating-spinner" aria-hidden="true" />
      <span className="generating-label">
        Generating itinerary… {elapsedSeconds > 0 && `(${elapsedSeconds}s)`}
      </span>
      {isSlow && (
        <p className="generating-slow-hint">
          The AI is still working — LLM responses can take 1–2 minutes on CPU.
          Please keep this tab open.
        </p>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------

export const TripList = ({ token, onCreateClick }: TripListProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pendingItineraries, setPendingItineraries] = useState<
    Record<number, Itinerary>
  >({});

  // Sets tracking which trips are in a given async state
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [generatingSmartIds, setGeneratingSmartIds] = useState<Set<number>>(new Set());
  const [applyingIds, setApplyingIds] = useState<Set<number>>(new Set());
  const [viewingIds, setViewingIds] = useState<Set<number>>(new Set());

  // Per-trip elapsed seconds counter (drives the generating indicator display)
  const [generatingElapsed, setGeneratingElapsed] = useState<Record<number, number>>({});

  // Mutable refs for timer IDs — using ref avoids stale-closure issues in callbacks
  const timerRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  // ------------------------------------------------------------------
  // Timer helpers
  // ------------------------------------------------------------------

  const startTimer = (tripId: number) => {
    setGeneratingElapsed((prev) => ({ ...prev, [tripId]: 0 }));
    timerRefs.current[tripId] = setInterval(() => {
      setGeneratingElapsed((prev) => ({
        ...prev,
        [tripId]: (prev[tripId] ?? 0) + 1,
      }));
    }, 1000);
  };

  const stopTimer = (tripId: number) => {
    clearInterval(timerRefs.current[tripId]);
    delete timerRefs.current[tripId];
    setGeneratingElapsed((prev) => {
      const next = { ...prev };
      delete next[tripId];
      return next;
    });
  };

  // Cleanup all timers when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  // ------------------------------------------------------------------
  // Data helpers
  // ------------------------------------------------------------------

  const parseItinerary = (description: string): Itinerary | null => {
    try {
      return JSON.parse(description);
    } catch {
      const marker = "DETAILS (JSON): ";
      const idx = description.indexOf(marker);
      if (idx !== -1) {
        try {
          return JSON.parse(description.slice(idx + marker.length));
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const toggleView = (tripId: number) => {
    setViewingIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });
  };

  // ------------------------------------------------------------------
  // Initial fetch
  // ------------------------------------------------------------------

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

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    setActionError(null);
    try {
      await deleteTrip(token, id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setActionError("Failed to delete trip. Please try again.");
    }
  };

  /**
   * Shared generator — used by both "AI Plan" and "Smart Plan" buttons.
   *
   * Attaches an AbortController (hard timeout = AI_REQUEST_TIMEOUT_MS) so
   * the browser never hangs indefinitely waiting for a slow LLM response.
   * The elapsed timer provides real-time feedback in the UI.
   *
   * SSE groundwork: when the backend exposes a streaming endpoint, replace
   * the `generate` fetch call here with `new EventSource(url)` and push
   * partial tokens into state as they arrive.
   */
  const runGeneration = async (
    tripId: number,
    generate: (signal: AbortSignal) => Promise<Itinerary>,
    trackingSet: React.Dispatch<React.SetStateAction<Set<number>>>,
  ) => {
    setActionError(null);
    trackingSet((prev) => new Set(prev).add(tripId));
    startTimer(tripId);

    const controller = new AbortController();
    const hardTimeout = window.setTimeout(
      () => controller.abort(),
      AI_REQUEST_TIMEOUT_MS,
    );

    try {
      const itinerary = await generate(controller.signal);
      setPendingItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setActionError(
          "The AI is taking too long and the request was cancelled. " +
          "Please try again — shorter trips generate faster.",
        );
      } else {
        setActionError(
          err instanceof Error ? err.message : "Failed to generate itinerary.",
        );
      }
    } finally {
      window.clearTimeout(hardTimeout);
      stopTimer(tripId);
      trackingSet((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  const handleGenerate = (tripId: number) => {
    const trip = trips.find((t) => t.id === tripId);
    return runGeneration(
      tripId,
      (signal) =>
        planItinerary(token, tripId, { interests_override: trip?.notes ?? undefined }, signal),
      setGeneratingIds,
    );
  };

  const handleGenerateSmart = (tripId: number) => {
    const trip = trips.find((t) => t.id === tripId);
    return runGeneration(
      tripId,
      (signal) =>
        planItinerarySmart(token, tripId, { interests_override: trip?.notes ?? undefined }, signal),
      setGeneratingSmartIds,
    );
  };

  const handleApply = async (tripId: number) => {
    const itinerary = pendingItineraries[tripId];
    if (!itinerary) return;

    setActionError(null);
    setApplyingIds((prev) => new Set(prev).add(tripId));

    try {
      await applyItinerary(token, tripId, itinerary);
      const freshTrips = await getTrips(token);
      setTrips(freshTrips);
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

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

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
            const isAnyGenerating = isGenerating || isGeneratingSmart;
            const isApplying = applyingIds.has(trip.id);
            const isViewing = viewingIds.has(trip.id);
            const pendingItinerary = pendingItineraries[trip.id];
            const hasSavedItinerary = !!trip.description;
            const savedItinerary = hasSavedItinerary
              ? parseItinerary(trip.description!)
              : null;
            const elapsed = generatingElapsed[trip.id] ?? 0;

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
                      {new Date(trip.start_date).toLocaleDateString()} –{" "}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                {/* Show generating indicator inside the card while working */}
                {isAnyGenerating && (
                  <GeneratingIndicator elapsedSeconds={elapsed} />
                )}

                {pendingItinerary ? (
                  <ItineraryPanel
                    itinerary={pendingItinerary}
                    onApply={() => handleApply(trip.id)}
                    applying={isApplying}
                  />
                ) : (
                  <>
                    {isViewing && savedItinerary && (
                      <ItineraryPanel itinerary={savedItinerary} />
                    )}
                    <div className="actions-row">
                      <button
                        onClick={() => handleGenerate(trip.id)}
                        disabled={isAnyGenerating}
                        className="btn btn-primary"
                        aria-busy={isGenerating}
                      >
                        {isGenerating ? "Working…" : "AI Plan"}
                      </button>

                      <button
                        onClick={() => handleGenerateSmart(trip.id)}
                        disabled={isAnyGenerating}
                        className="btn btn-secondary"
                        aria-busy={isGeneratingSmart}
                      >
                        {isGeneratingSmart ? "Working…" : "Smart Plan"}
                      </button>

                      {savedItinerary && (
                        <button
                          onClick={() => toggleView(trip.id)}
                          className="btn btn-secondary"
                        >
                          {isViewing ? "Hide Itinerary" : "View Itinerary"}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="btn btn-danger"
                      >
                        Delete Trip
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
