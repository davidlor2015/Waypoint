import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrips, getTripSummaries, deleteTrip, type Trip, type TripSummary } from '../../../shared/api/trips';
import {
  planItinerarySmart,
  applyItinerary,
  AI_REQUEST_TIMEOUT_MS,
  type Itinerary,
} from '../../../shared/api/ai';
import { ItineraryPanel } from '../ItineraryPanel';
import { EditTripModal } from '../EditTripModal';
import { useStreamingItinerary } from '../../../shared/hooks/useStreamingItinerary';
import { PackingList } from '../PackingList';
import { BudgetTracker } from '../BudgetTracker';
import { ItineraryMap } from '../ItineraryMap';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseItinerary(description: string): Itinerary | null {
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
}

type TripStatus = 'upcoming' | 'active' | 'past';
type TripWorkspaceTab = 'overview' | 'itinerary' | 'packing' | 'budget' | 'map';

interface PackingSummary {
  total: number;
  checked: number;
  progressPct: number;
  loading: boolean;
}

interface BudgetSummary {
  limit: number | null;
  totalSpent: number;
  remaining: number | null;
  isOverBudget: boolean;
  expenseCount: number;
  loading: boolean;
}

const STATUS_CONFIG: Record<TripStatus, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming', cls: 'bg-amber/15 text-amber border-amber/30'   },
  active:   { label: 'Active',   cls: 'bg-olive/10 text-olive border-olive/20'   },
  past:     { label: 'Past',     cls: 'bg-parchment text-flint border-smoke'      },
};

function getTripStatus(startIso: string, endIso: string): TripStatus {
  const now   = Date.now();
  const start = new Date(startIso).getTime();
  const end   = new Date(endIso).getTime();
  if (now < start) return 'upcoming';
  if (now > end)   return 'past';
  return 'active';
}

function getTripTimelineLabel(startIso: string, endIso: string): string {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const daysUntilStart = Math.ceil((start - now) / 86_400_000);
  const daysUntilEnd = Math.ceil((end - now) / 86_400_000);

  if (daysUntilStart > 1) return `${daysUntilStart} days until departure`;
  if (daysUntilStart === 1) return 'Departs tomorrow';
  if (daysUntilStart === 0) return 'Departs today';
  if (daysUntilEnd >= 0) return 'Currently traveling';
  if (daysUntilEnd === -1) return 'Ended yesterday';
  return `Completed ${Math.abs(daysUntilEnd)} days ago`;
}

function itinerarySnapshotLabel(hasSavedItinerary: boolean, hasPendingItinerary: boolean, isGenerating: boolean): string {
  if (isGenerating) return 'Generating itinerary';
  if (hasPendingItinerary) return 'Draft ready to review';
  if (hasSavedItinerary) return 'Saved itinerary';
  return 'No itinerary yet';
}

function packingSnapshotLabel(summary: PackingSummary | undefined): string {
  if (!summary || summary.loading) return 'Loading packing';
  if (summary.total === 0) return 'No packing items yet';
  return `${summary.checked}/${summary.total} packed`;
}

function budgetSnapshotLabel(summary: BudgetSummary | undefined): string {
  if (!summary || summary.loading) return 'Loading budget';
  if (summary.limit === null) return summary.expenseCount > 0 ? 'Expenses added, no limit set' : 'No budget set';
  if (summary.isOverBudget) return `Over budget by $${Math.abs(summary.remaining ?? 0).toFixed(0)}`;
  return `$${Math.max(summary.remaining ?? 0, 0).toFixed(0)} remaining`;
}

const TAB_LABELS: Array<{ id: TripWorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'packing', label: 'Packing' },
  { id: 'budget', label: 'Budget' },
  { id: 'map', label: 'Map' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-smoke/50 shadow-sm p-6 animate-pulse"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-smoke rounded-full w-1/3" />
          <div className="h-5 bg-parchment rounded-full w-20" />
        </div>
        <div className="h-4 bg-parchment rounded-full w-1/2 mb-2" />
        <div className="h-4 bg-parchment rounded-full w-2/5 mb-5" />
        <div className="flex gap-2">
          <div className="h-9 bg-smoke rounded-full w-24" />
          <div className="h-9 bg-parchment rounded-full w-28" />
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
        <div className="flex items-center gap-2 text-sm font-medium text-amber">
          <div className="w-4 h-4 rounded-full border-2 border-amber border-t-transparent animate-spin flex-shrink-0" />
          Generating itinerary...
          {text.length > 0 && (
            <span className="text-flint font-normal tabular-nums">
              {text.length} chars
            </span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-flint hover:text-espresso transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
      {text.length > 0 && (
        <pre
          ref={scrollRef}
          className="text-xs font-mono text-flint bg-parchment rounded-xl p-3 max-h-28 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed"
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
    ocean:  'bg-amber text-white hover:bg-amber-dark shadow-sm shadow-amber/25',
    coral:  'bg-clay text-white hover:bg-clay-dark shadow-sm shadow-clay/20',
    ghost:  'bg-parchment text-espresso hover:bg-smoke',
    danger: 'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15',
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
  const [confirmDeleteId, setConfirmDeleteId]       = useState<number | null>(null);
  const [activeTabs, setActiveTabs]                 = useState<Record<number, TripWorkspaceTab>>({});
  const [packingSummaries, setPackingSummaries]     = useState<Record<number, PackingSummary>>({});
  const [budgetSummaries, setBudgetSummaries]       = useState<Record<number, BudgetSummary>>({});

  const { streams, start: startStream, reset: resetStream } = useStreamingItinerary(token);

  // ── Data helpers ───────────────────────────────────────────────────────────

  const toggleView = (tripId: number) => {
    setViewingIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) { next.delete(tripId); } else { next.add(tripId); }
      return next;
    });
  };

  const setActiveTab = (tripId: number, tab: TripWorkspaceTab) => {
    setActiveTabs((prev) => ({ ...prev, [tripId]: tab }));
  };

  // ── Initial fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, summaries] = await Promise.all([getTrips(token), getTripSummaries(token)]);
        setTrips(data);
        setPackingSummaries(
          Object.fromEntries(
            summaries.map((summary: TripSummary) => [
              summary.trip_id,
              {
                total: summary.packing_total,
                checked: summary.packing_checked,
                progressPct: summary.packing_progress_pct,
                loading: false,
              },
            ]),
          ),
        );
        setBudgetSummaries(
          Object.fromEntries(
            summaries.map((summary: TripSummary) => [
              summary.trip_id,
              {
                limit: summary.budget_limit,
                totalSpent: summary.budget_total_spent,
                remaining: summary.budget_remaining,
                isOverBudget: summary.budget_is_over,
                expenseCount: summary.budget_expense_count,
                loading: false,
              },
            ]),
          ),
        );
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
    setActionError(null);
    try {
      await deleteTrip(token, id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    } catch {
      setActionError('Failed to delete trip. Please try again.');
      setConfirmDeleteId(null);
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
          <h2 className="text-xl sm:text-2xl font-bold text-espresso">My Trips</h2>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onCreateClick}
            className="px-5 py-2.5 rounded-full bg-amber text-white text-sm font-bold shadow-sm shadow-amber/25 cursor-pointer"
          >
            + New Trip
          </motion.button>
        </div>
        <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm" role="alert">
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
          <h2 className="text-xl sm:text-2xl font-bold text-espresso">My Trips</h2>
          <p className="text-sm text-flint mt-0.5">Plan, generate, and save itineraries in one place.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onCreateClick}
          className="px-5 py-2.5 rounded-full bg-amber text-white text-sm font-bold shadow-sm shadow-amber/25 cursor-pointer flex-shrink-0"
        >
          + New Trip
        </motion.button>
      </div>

      {/* ── Global action error banner ── */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
            role="alert"
          >
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 border-2 border-dashed border-smoke rounded-2xl text-center">
          <div>
            <h3 className="text-lg font-bold text-espresso">No trips yet</h3>
            <p className="text-sm text-flint mt-1">Create your first trip to start planning.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onCreateClick}
            className="px-6 py-2.5 rounded-full bg-amber text-white text-sm font-bold shadow-sm shadow-amber/25 cursor-pointer"
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

            const pendingItinerary  = streamItinerary ?? pendingItineraries[trip.id] ?? null;
            const savedItinerary    = trip.description ? parseItinerary(trip.description) : null;
            const hasSavedItinerary = savedItinerary !== null;
            const tripStatus        = getTripStatus(trip.start_date, trip.end_date);
            const activeTab         = activeTabs[trip.id] ?? 'overview';
            const packingSummary    = packingSummaries[trip.id];
            const budgetSummary     = budgetSummaries[trip.id];

            const startDate = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const endDate   = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <motion.li
                key={trip.id}
                variants={cardVariants}
                layout
                className="bg-white rounded-2xl border border-smoke/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-4"
              >
                {/* Title row */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-espresso leading-tight">{trip.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${STATUS_CONFIG[tripStatus].cls}`}>
                      {STATUS_CONFIG[tripStatus].label}
                    </span>
                    {hasSavedItinerary && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber/20 text-amber text-xs font-bold">
                        Itinerary saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1 text-sm text-flint">
                  <span className="font-medium text-espresso">{trip.destination}</span>
                  <span>{startDate} – {endDate}</span>
                  <span className="text-xs font-semibold text-flint/80">{getTripTimelineLabel(trip.start_date, trip.end_date)}</span>
                  {trip.notes && (
                    <span className="text-xs text-flint/70 italic mt-0.5">{trip.notes}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-smoke bg-parchment/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Timeline</p>
                    <p className="text-sm font-bold text-espresso mt-1">{getTripTimelineLabel(trip.start_date, trip.end_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-smoke bg-parchment/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Itinerary</p>
                    <p className="text-sm font-bold text-espresso mt-1">
                      {itinerarySnapshotLabel(hasSavedItinerary, !!pendingItinerary, isAnyGenerating)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-smoke bg-parchment/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Packing</p>
                    <p className="text-sm font-bold text-espresso mt-1">{packingSnapshotLabel(packingSummary)}</p>
                  </div>
                  <div className="rounded-2xl border border-smoke bg-parchment/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Budget</p>
                    <p className="text-sm font-bold text-espresso mt-1">{budgetSnapshotLabel(budgetSummary)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    <PillButton variant="ocean" onClick={() => setActiveTab(trip.id, 'itinerary')}>
                      Continue Planning
                    </PillButton>
                    <PillButton variant="ghost" onClick={() => setEditingTrip(trip)}>
                      Edit
                    </PillButton>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {confirmDeleteId === trip.id ? (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm font-semibold text-danger">Delete trip?</span>
                        <PillButton variant="danger" onClick={() => handleDelete(trip.id)}>
                          Yes, delete
                        </PillButton>
                        <PillButton variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </PillButton>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PillButton variant="danger" onClick={() => setConfirmDeleteId(trip.id)}>
                          Delete
                        </PillButton>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-1 bg-parchment rounded-full p-1 w-fit flex-wrap">
                  {TAB_LABELS.map((tab) => {
                    const disabled = tab.id === 'map' && !savedItinerary;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => !disabled && setActiveTab(trip.id, tab.id)}
                        disabled={disabled}
                        className={[
                          'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150',
                          activeTab === tab.id
                            ? 'bg-white text-espresso shadow-sm'
                            : 'text-flint hover:text-espresso',
                          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Per-card stream error */}
                <AnimatePresence>
                  {streamError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
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
                  <div className="flex items-center gap-3 px-4 py-3 bg-clay/5 border border-clay/20 rounded-xl">
                    <div className="w-4 h-4 rounded-full border-2 border-clay border-t-transparent animate-spin flex-shrink-0" />
                    <span className="text-sm font-medium text-clay">Generating Smart Plan...</span>
                  </div>
                )}

                {activeTab === 'overview' && (
                  <div className="rounded-2xl border border-smoke bg-parchment/40 px-5 py-4">
                    <p className="text-sm font-semibold text-espresso">
                      {hasSavedItinerary
                        ? 'Your trip already has a saved itinerary. Continue planning to refine the details, review the map, or update logistics.'
                        : 'Start in the itinerary tab to generate a plan, then move into packing and budget once the trip takes shape.'}
                    </p>
                  </div>
                )}

                {activeTab === 'itinerary' && (
                  <div className="space-y-4">
                    {!isStreaming && (
                      <div className="flex flex-wrap gap-2 pt-1 items-center">
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
                            {isViewing ? 'Hide Saved Itinerary' : 'View Saved Itinerary'}
                          </PillButton>
                        )}
                      </div>
                    )}

                    {!isStreaming && pendingItinerary ? (
                      <ItineraryPanel
                        itinerary={pendingItinerary}
                        onApply={() => handleApply(trip.id)}
                        applying={isApplying}
                      />
                    ) : (
                      isViewing && savedItinerary && <ItineraryPanel itinerary={savedItinerary} />
                    )}

                    {!pendingItinerary && !isViewing && !isStreaming && !savedItinerary && (
                      <div className="rounded-2xl border border-dashed border-smoke bg-parchment/40 px-5 py-8 text-center">
                        <p className="text-sm font-semibold text-espresso">No itinerary yet</p>
                        <p className="text-sm text-flint mt-1">Generate an AI plan or smart plan to start building this trip.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'packing' && (
                  <PackingList
                    token={token}
                    tripId={trip.id}
                    onSummaryChange={(summary) =>
                      setPackingSummaries((prev) => ({ ...prev, [trip.id]: summary }))
                    }
                  />
                )}
                {activeTab === 'budget' && (
                  <BudgetTracker
                    token={token}
                    tripId={trip.id}
                    onSummaryChange={(summary) =>
                      setBudgetSummaries((prev) => ({ ...prev, [trip.id]: summary }))
                    }
                  />
                )}
                {activeTab === 'map' && savedItinerary && (
                  <ItineraryMap key={`trip-map-${trip.id}`} itinerary={savedItinerary} />
                )}
                {activeTab === 'map' && !savedItinerary && (
                  <div className="rounded-2xl border border-dashed border-smoke bg-parchment/40 px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-espresso">Map unavailable</p>
                    <p className="text-sm text-flint mt-1">Save a valid itinerary first to view locations on the map.</p>
                  </div>
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
