import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrips, deleteTrip } from '../../../shared/api/trips';
import {
  planItinerary,
  planItinerarySmart,
  applyItinerary,
  AI_REQUEST_TIMEOUT_MS,
  AI_SLOW_THRESHOLD_MS,
  type Itinerary,
} from '../../../shared/api/ai';
import { ItineraryPanel } from '../ItineraryPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface GeneratingIndicatorProps {
  elapsedSeconds: number;
}

const GeneratingIndicator = ({ elapsedSeconds }: GeneratingIndicatorProps) => {
  const isSlow = elapsedSeconds * 1000 >= AI_SLOW_THRESHOLD_MS;
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-ocean/5 border border-ocean/20 rounded-xl">
      <div className="w-5 h-5 rounded-full border-2 border-ocean border-t-transparent animate-spin flex-shrink-0" />
      <span className="text-sm font-medium text-ocean tabular-nums">
        Generating itinerary{elapsedSeconds > 0 ? ` (${elapsedSeconds}s)` : '…'}
      </span>
      {isSlow && (
        <p className="w-full m-0 text-sm text-gray italic">
          Still working — LLM responses can take 1–2 minutes on CPU. Keep this tab open.
        </p>
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
  const [trips, setTrips]               = useState<Trip[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);

  const [pendingItineraries, setPendingItineraries] = useState<Record<number, Itinerary>>({});
  const [generatingIds, setGeneratingIds]           = useState<Set<number>>(new Set());
  const [generatingSmartIds, setGeneratingSmartIds] = useState<Set<number>>(new Set());
  const [applyingIds, setApplyingIds]               = useState<Set<number>>(new Set());
  const [viewingIds, setViewingIds]                 = useState<Set<number>>(new Set());
  const [generatingElapsed, setGeneratingElapsed]   = useState<Record<number, number>>({});

  const timerRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  // ── Timer helpers ──────────────────────────────────────────────────────────

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

  useEffect(() => () => { Object.values(timerRefs.current).forEach(clearInterval); }, []);

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

  const runGeneration = async (
    tripId: number,
    generate: (signal: AbortSignal) => Promise<Itinerary>,
    trackingSet: React.Dispatch<React.SetStateAction<Set<number>>>,
  ) => {
    setActionError(null);
    trackingSet((prev) => new Set(prev).add(tripId));
    startTimer(tripId);

    const controller = new AbortController();
    const hardTimeout = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const itinerary = await generate(controller.signal);
      setPendingItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setActionError('The AI took too long and the request was cancelled. Try again — shorter trips generate faster.');
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to generate itinerary.');
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
      (signal) => planItinerary(token, tripId, { interests_override: trip?.notes ?? undefined }, signal),
      setGeneratingIds,
    );
  };

  const handleGenerateSmart = (tripId: number) => {
    const trip = trips.find((t) => t.id === tripId);
    return runGeneration(
      tripId,
      (signal) => planItinerarySmart(token, tripId, { interests_override: trip?.notes ?? undefined }, signal),
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

      {/* ── Action error banner ── */}
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
          <span className="text-6xl select-none" aria-hidden="true">🗺️</span>
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
        /* ── Trip card list ── */
        <motion.ul
          className="space-y-4 list-none p-0 m-0"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {trips.map((trip) => {
            const isGenerating      = generatingIds.has(trip.id);
            const isGeneratingSmart = generatingSmartIds.has(trip.id);
            const isAnyGenerating   = isGenerating || isGeneratingSmart;
            const isApplying        = applyingIds.has(trip.id);
            const isViewing         = viewingIds.has(trip.id);
            const pendingItinerary  = pendingItineraries[trip.id];
            const hasSavedItinerary = !!trip.description;
            const savedItinerary    = hasSavedItinerary ? parseItinerary(trip.description!) : null;
            const elapsed           = generatingElapsed[trip.id] ?? 0;

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
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sunny/30 text-sunny-dark text-xs font-bold">
                      ✓ Itinerary saved
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="flex items-center gap-1.5 text-gray">
                    <span aria-hidden="true">📍</span>
                    <span className="font-medium text-navy">{trip.destination}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-gray">
                    <span aria-hidden="true">📅</span>
                    {startDate} – {endDate}
                  </span>
                </div>

                {/* Generating indicator */}
                {isAnyGenerating && <GeneratingIndicator elapsedSeconds={elapsed} />}

                {/* Pending itinerary preview */}
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

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <PillButton
                        variant="ocean"
                        onClick={() => handleGenerate(trip.id)}
                        disabled={isAnyGenerating}
                        busy={isGenerating}
                      >
                        {isGenerating ? 'Working…' : '✨ AI Plan'}
                      </PillButton>

                      <PillButton
                        variant="coral"
                        onClick={() => handleGenerateSmart(trip.id)}
                        disabled={isAnyGenerating}
                        busy={isGeneratingSmart}
                      >
                        {isGeneratingSmart ? 'Working…' : '🧠 Smart Plan'}
                      </PillButton>

                      {savedItinerary && (
                        <PillButton variant="ghost" onClick={() => toggleView(trip.id)}>
                          {isViewing ? '🙈 Hide' : '👁 View Itinerary'}
                        </PillButton>
                      )}

                      <PillButton variant="danger" onClick={() => handleDelete(trip.id)}>
                        🗑 Delete
                      </PillButton>
                    </div>
                  </>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
};
