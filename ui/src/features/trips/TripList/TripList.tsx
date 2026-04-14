import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrips, deleteTrip, type Trip } from '../../../shared/api/trips';
import {
  planItinerarySmart,
  applyItinerary,
  AI_REQUEST_TIMEOUT_MS,
  type Itinerary,
} from '../../../shared/api/ai';
import { ItineraryPanel } from '../ItineraryPanel';
import { EditTripModal } from '../EditTripModal';
import { useStreamingItinerary } from '../../../shared/hooks/useStreamingItinerary';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TripListProps {
  token: string;
  onCreateClick: () => void;
}

// ── Animation variants ────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, bounce: 0.28, duration: 0.52 },
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-gray-200 rounded-full w-1/3" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
        <div className="h-4 bg-gray-100 rounded-full w-1/2 mb-2" />
        <div className="h-4 bg-gray-100 rounded-full w-2/5 mb-5" />
        <div className="flex gap-2">
          <div className="h-9 bg-gray-200 rounded-full w-24" />
          <div className="h-9 bg-gray-100 rounded-full w-28" />
        </div>
      </div>
    ))}
  </div>
);

interface StreamingDisplayProps {
  text: string;
  onCancel: () => void;
}

const StreamingDisplay = ({ text, onCancel }: StreamingDisplayProps) => {
  const scrollRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-ocean">
          <div className="w-4 h-4 rounded-full border-2 border-ocean border-t-transparent animate-spin flex-shrink-0" />
          Generating itinerary...
          {text.length > 0 && (
            <span className="text-gray font-normal tabular-nums">
              {text.length} chars
            </span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray hover:text-navy transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
      {text.length > 0 && (
        <pre
          ref={scrollRef}
          className="text-xs font-mono text-gray bg-silver rounded-xl p-3 max-h-28 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed"
        >
          {text}
        </pre>
      )}
    </div>
  );
};

interface PillButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant: 'ocean' | 'coral' | 'ghost' | 'danger';
  busy?: boolean;
  children: React.ReactNode;
}

const PillButton = ({ onClick, disabled, variant, busy, children }: PillButtonProps) => {
  const base =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    ocean:  'bg-ocean text-white hover:bg-ocean-dark shadow-sm shadow-ocean/25',
    coral:  'bg-coral text-white hover:bg-coral-dark shadow-sm shadow-coral/25',
    ghost:  'bg-silver text-navy hover:bg-gray-200',
    danger: 'bg-coral/10 text-coral border border-coral/25 hover:bg-coral/20',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      whileHover={!disabled ? { scale: 1.04 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </motion.button>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const TripList = ({ token, onCreateClick }: TripListProps) => {
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pendingItineraries, setPendingItineraries] = useState<Record<number, Itinerary>>({});
  const [generatingSmartIds, setGeneratingSmartIds] = useState<Set<number>>(new Set());
  const [applyingIds, setApplyingIds]               = useState<Set<number>>(new Set());
  const [viewingIds, setViewingIds]                 = useState<Set<number>>(new Set());
  const [editingTrip, setEditingTrip]               = useState<Trip | null>(null);

  const { streams, start: startStream, reset: resetStream } = useStreamingItinerary(token);

  // ── Data helpers ───────────────────────────────────────────────────────────

  const parseItinerary = (description: string): Itinerary | null => {
    try {
      return JSON.parse(description);
    } catch {
      const marker = 'DETAILS (JSON): ';
      const idx = description.indexOf(marker);
      if (idx !== -1) {
        try { return JSON.parse(description.slice(idx + marker.length)); } catch { return null; }
      }
      return null;
    }
  };

  const toggleView = (tripId: number) => {
    setViewingIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) { next.delete(tripId); } else { next.add(tripId); }
      return next;
    });
  };

  // ── Initial fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTrips(token);
        setTrips(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    setActionError(null);
    try {
      await deleteTrip(token, id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setActionError('Failed to delete trip. Please try again.');
    }
  };

  const handleGenerateSmart = async (tripId: number) => {
    const trip = trips.find((t) => t.id === tripId);
    setActionError(null);
    setGeneratingSmartIds((prev) => new Set(prev).add(tripId));

    const controller = new AbortController();
    const hardTimeout = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const itinerary = await planItinerarySmart(
        token,
        tripId,
        { interests_override: trip?.notes ?? undefined },
        controller.signal,
      );
      setPendingItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setActionError('The AI took too long. Try again — shorter trips generate faster.');
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to generate itinerary.');
      }
    } finally {
      window.clearTimeout(hardTimeout);
      setGeneratingSmartIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  const handleApply = async (tripId: number) => {
    // Itinerary may come from the streaming hook or the Smart Plan pending state.
    const itinerary = streams[tripId]?.itinerary ?? pendingItineraries[tripId];
    if (!itinerary) return;

    setActionError(null);
    setApplyingIds((prev) => new Set(prev).add(tripId));
    try {
      await applyItinerary(token, tripId, itinerary);
      const freshTrips = await getTrips(token);
      setTrips(freshTrips);
      resetStream(tripId);
      setPendingItineraries((prev) => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to apply itinerary.');
    } finally {
      setApplyingIds((prev) => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-navy">My Trips</h2>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onCreateClick}
            className="px-5 py-2.5 rounded-full bg-ocean text-white text-sm font-bold shadow-sm shadow-ocean/25 cursor-pointer"
          >
            + New Trip
          </motion.button>
        </div>
        <div className="px-4 py-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-sm" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-navy">My Trips</h2>
          <p className="text-sm text-gray mt-0.5">Plan, generate, and save itineraries in one place.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onCreateClick}
          className="px-5 py-2.5 rounded-full bg-ocean text-white text-sm font-bold shadow-sm shadow-ocean/25 cursor-pointer flex-shrink-0"
        >
          + New Trip
        </motion.button>
      </div>

      {/* ── Global action error banner ── */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-sm font-medium"
            role="alert"
          >
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <div>
            <h3 className="text-lg font-bold text-navy">No trips yet</h3>
            <p className="text-sm text-gray mt-1">Create your first trip to start planning.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onCreateClick}
            className="px-6 py-2.5 rounded-full bg-ocean text-white text-sm font-bold shadow-sm shadow-ocean/25 cursor-pointer"
          >
            + Create your first trip
          </motion.button>
        </div>
      ) : (
        <motion.ul
          className="space-y-4 list-none p-0 m-0"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {trips.map((trip) => {
            const streamState     = streams[trip.id];
            const isStreaming     = streamState?.streaming ?? false;
            const streamText     = streamState?.text ?? '';
            const streamError    = streamState?.error ?? null;
            const streamItinerary = streamState?.itinerary ?? null;

            const isGeneratingSmart = generatingSmartIds.has(trip.id);
            const isAnyGenerating   = isStreaming || isGeneratingSmart;
            const isApplying        = applyingIds.has(trip.id);
            const isViewing         = viewingIds.has(trip.id);

            // Completed itinerary from either streaming or Smart Plan
            const pendingItinerary  = streamItinerary ?? pendingItineraries[trip.id] ?? null;
            const hasSavedItinerary = !!trip.description;
            const savedItinerary    = hasSavedItinerary ? parseItinerary(trip.description!) : null;

            const startDate = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const endDate   = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <motion.li
                key={trip.id}
                variants={cardVariants}
                layout
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-4"
              >
                {/* Title row */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-navy leading-tight">{trip.title}</h3>
                  {hasSavedItinerary && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sunny/30 text-sunny-dark text-xs font-bold">
                      Itinerary saved
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1 text-sm text-gray">
                  <span className="font-medium text-navy">{trip.destination}</span>
                  <span>{startDate} – {endDate}</span>
                </div>

                {/* Per-card stream error */}
                <AnimatePresence>
                  {streamError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-sm font-medium"
                      role="alert"
                    >
                      {streamError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live streaming display */}
                {isStreaming && (
                  <StreamingDisplay
                    text={streamText}
                    onCancel={() => resetStream(trip.id)}
                  />
                )}

                {/* Smart Plan spinner */}
                {isGeneratingSmart && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-coral/5 border border-coral/20 rounded-xl">
                    <div className="w-4 h-4 rounded-full border-2 border-coral border-t-transparent animate-spin flex-shrink-0" />
                    <span className="text-sm font-medium text-coral">Generating Smart Plan...</span>
                  </div>
                )}

                {/* Completed itinerary pending review */}
                {!isStreaming && pendingItinerary ? (
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

                    {/* Action buttons — hidden while streaming */}
                    {!isStreaming && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <PillButton
                          variant="ocean"
                          onClick={() => startStream(trip.id, trip.notes ?? undefined)}
                          disabled={isAnyGenerating}
                        >
                          AI Plan
                        </PillButton>

                        <PillButton
                          variant="coral"
                          onClick={() => handleGenerateSmart(trip.id)}
                          disabled={isAnyGenerating}
                          busy={isGeneratingSmart}
                        >
                          {isGeneratingSmart ? 'Working...' : 'Smart Plan'}
                        </PillButton>

                        {savedItinerary && (
                          <PillButton variant="ghost" onClick={() => toggleView(trip.id)}>
                            {isViewing ? 'Hide' : 'View Itinerary'}
                          </PillButton>
                        )}

                        <PillButton variant="ghost" onClick={() => setEditingTrip(trip)}>
                          Edit
                        </PillButton>

                        <PillButton variant="danger" onClick={() => handleDelete(trip.id)}>
                          Delete
                        </PillButton>
                      </div>
                    )}
                  </>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editingTrip && (
          <EditTripModal
            key={editingTrip.id}
            token={token}
            trip={editingTrip}
            onSuccess={(updated) => {
              setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
              setEditingTrip(null);
            }}
            onClose={() => setEditingTrip(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
