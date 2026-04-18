import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrips, getTripSummaries, deleteTrip, type Trip, type TripSummary } from '../../../shared/api/trips';
import {
  planItinerarySmart,
  applyItinerary,
  refineItinerary,
  AI_REQUEST_TIMEOUT_MS,
  type Itinerary,
} from '../../../shared/api/ai';
import { ItineraryPanel } from '../ItineraryPanel';
import { EditableItineraryPanel } from '../EditableItineraryPanel/EditableItineraryPanel';
import { EditTripModal } from '../EditTripModal';
import { useStreamingItinerary } from '../../../shared/hooks/useStreamingItinerary';
import { PackingList } from '../PackingList';
import { BudgetTracker } from '../BudgetTracker';
import { ItineraryMap } from '../ItineraryMap';
import { ReservationsPanel } from '../ReservationsPanel';
import { PrepPanel } from '../PrepPanel';
import {
  buildItemReferences,
  moveEditableItineraryItem,
  preserveSelectionIds,
  toApiItinerary,
  toEditableItinerary,
  type EditableItinerary,
  type RefinementTimeBlock,
  type RefinementVariant,
} from '../itineraryDraft';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TripListProps {
  token: string;
  onCreateClick: () => void;
  initialTripId?: number;
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
type TripWorkspaceTab = 'overview' | 'itinerary' | 'reservations' | 'prep' | 'packing' | 'budget' | 'map';

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

interface ReservationSummary {
  total: number;
  upcoming: number;
  loading: boolean;
}

interface PrepSummary {
  total: number;
  completed: number;
  overdue: number;
  loading: boolean;
}

interface NextActionSummary {
  tab: TripWorkspaceTab;
  label: string;
  hint: string;
}

interface RegenerationControlState {
  dayNumber: number;
  timeBlock: RefinementTimeBlock;
  variant: RefinementVariant;
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

function packingSnapshotLabel(summary: PackingSummary | undefined): string {
  if (!summary || summary.loading) return 'Loading packing';
  if (summary.total === 0) return 'No packing items yet';
  return `${summary.checked}/${summary.total} packed`;
}

function prepSnapshotLabel(summary: PrepSummary | undefined): string {
  if (!summary || summary.loading) return 'Loading prep';
  if (summary.total === 0) return 'Nothing added';
  if (summary.overdue > 0) return `${summary.overdue} overdue`;
  if (summary.completed === summary.total) return 'All covered';
  return `${summary.total - summary.completed} to handle`;
}

function getNextActionSummary(args: {
  hasSavedItinerary: boolean;
  hasPendingItinerary: boolean;
  tripStatus: TripStatus;
  reservationSummary?: ReservationSummary;
  prepSummary?: PrepSummary;
  packingSummary?: PackingSummary;
}): NextActionSummary {
  const {
    hasSavedItinerary,
    hasPendingItinerary,
    tripStatus,
    reservationSummary,
    prepSummary,
    packingSummary,
  } = args;

  if (!hasSavedItinerary && !hasPendingItinerary) {
    return {
      tab: 'itinerary',
      label: 'Start with the itinerary',
      hint: 'Generate the trip plan first so the rest of the details have something to anchor to.',
    };
  }

  if ((prepSummary?.overdue ?? 0) > 0) {
    return {
      tab: 'prep',
      label: `${prepSummary?.overdue} prep item${prepSummary?.overdue === 1 ? '' : 's'} need attention`,
      hint: 'Take care of overdue travel prep before departure.',
    };
  }

  if ((reservationSummary?.total ?? 0) === 0 && tripStatus !== 'past') {
    return {
      tab: 'reservations',
      label: 'Save your bookings',
      hint: 'Keep flights, stays, and trains together so the trip stays easy to manage.',
    };
  }

  if ((packingSummary?.total ?? 0) === 0 && tripStatus !== 'past') {
    return {
      tab: 'packing',
      label: 'Start the packing list',
      hint: 'Capture the essentials now so you are not scrambling at the end.',
    };
  }

  if ((packingSummary?.total ?? 0) > 0 && (packingSummary?.checked ?? 0) < (packingSummary?.total ?? 0) && tripStatus === 'active') {
    return {
      tab: 'packing',
      label: 'Finish the last packing details',
      hint: 'A few items are still unchecked for this trip.',
    };
  }

  return {
    tab: 'overview',
    label: 'Everything is in a good place',
    hint: 'You can review the trip details or keep refining the plan.',
  };
}

const TAB_LABELS: Array<{ id: TripWorkspaceTab; label: string; helper: string }> = [
  { id: 'overview', label: 'Overview', helper: 'See the trip at a glance and pick up where you left off.' },
  { id: 'itinerary', label: 'Plan', helper: 'Shape the day-by-day plan for this trip.' },
  { id: 'reservations', label: 'Bookings', helper: 'What have I already booked?' },
  { id: 'prep', label: 'Ready', helper: 'What still needs handling before I go?' },
  { id: 'packing', label: 'Pack', helper: 'What should I bring?' },
  { id: 'budget', label: 'Money', helper: 'What have I committed to spend?' },
  { id: 'map', label: 'Map', helper: 'See how the saved itinerary fits together geographically.' },
];

function parsePreferences(notes: string | null): { budget?: string; pace?: string; interests?: string[] } | null {
  if (!notes) return null;
  const result: { budget?: string; pace?: string; interests?: string[] } = {};
  for (const part of notes.split('|').map((p) => p.trim())) {
    const b = part.match(/^Budget:\s*(.+)$/i);
    if (b) { result.budget = b[1].trim(); continue; }
    const p = part.match(/^Pace:\s*(.+)$/i);
    if (p) { result.pace = p[1].trim(); continue; }
    const i = part.match(/^Interests:\s*(.+)$/i);
    if (i) result.interests = i[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return Object.keys(result).length > 0 ? result : null;
}

function getDefaultRegenerationControls(itinerary: EditableItinerary): RegenerationControlState {
  return {
    dayNumber: itinerary.days[0]?.day_number ?? 1,
    timeBlock: 'full_day',
    variant: 'more_local',
  };
}

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

export const TripList = ({ token, onCreateClick, initialTripId }: TripListProps) => {
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pendingItineraries, setPendingItineraries] = useState<Record<number, EditableItinerary>>({});
  const [generatingSmartIds, setGeneratingSmartIds] = useState<Set<number>>(new Set());
  const [regeneratingIds, setRegeneratingIds]       = useState<Set<number>>(new Set());
  const [applyingIds, setApplyingIds]               = useState<Set<number>>(new Set());
  const [viewingIds, setViewingIds]                 = useState<Set<number>>(new Set());
  const [editingTrip, setEditingTrip]               = useState<Trip | null>(null);
  const [confirmDeleteId, setConfirmDeleteId]       = useState<number | null>(null);
  const [openMenuId, setOpenMenuId]                 = useState<number | null>(null);
  const [activeTabs, setActiveTabs]                 = useState<Record<number, TripWorkspaceTab>>({});
  const [packingSummaries, setPackingSummaries]     = useState<Record<number, PackingSummary>>({});
  const [, setBudgetSummaries]                      = useState<Record<number, BudgetSummary>>({});
  const [reservationSummaries, setReservationSummaries] = useState<Record<number, ReservationSummary>>({});
  const [prepSummaries, setPrepSummaries]           = useState<Record<number, PrepSummary>>({});
  const [lockedItemIds, setLockedItemIds]           = useState<Record<number, string[]>>({});
  const [favoriteItemIds, setFavoriteItemIds]       = useState<Record<number, string[]>>({});
  const [regenerationControls, setRegenerationControls] = useState<Record<number, RegenerationControlState>>({});

  const tripCardRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  const { streams, start: startStream, reset: resetStream } = useStreamingItinerary(token);

  // ── Data helpers ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!initialTripId || trips.length === 0) return;
    const el = tripCardRefs.current.get(initialTripId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialTripId, trips]);

  const toggleView = (tripId: number) => {
    setViewingIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) { next.delete(tripId); } else { next.add(tripId); }
      return next;
    });
  };

  const setActiveTab = (tripId: number, tab: TripWorkspaceTab) => {
    setActiveTabs((prev) => ({ ...prev, [tripId]: tab }));
    setOpenMenuId((current) => (current === tripId ? null : current));
  };

  const upsertDraftItinerary = (tripId: number, itinerary: Itinerary, previous?: EditableItinerary) => {
    const editable = toEditableItinerary(itinerary, previous);
    setPendingItineraries((prev) => ({ ...prev, [tripId]: editable }));
    setRegenerationControls((prev) => ({
      ...prev,
      [tripId]: prev[tripId] ?? getDefaultRegenerationControls(editable),
    }));

    if (previous) {
      setLockedItemIds((prev) => ({ ...prev, [tripId]: preserveSelectionIds(previous, editable, prev[tripId] ?? []) }));
      setFavoriteItemIds((prev) => ({ ...prev, [tripId]: preserveSelectionIds(previous, editable, prev[tripId] ?? []) }));
    } else {
      setLockedItemIds((prev) => ({ ...prev, [tripId]: prev[tripId] ?? [] }));
      setFavoriteItemIds((prev) => ({ ...prev, [tripId]: prev[tripId] ?? [] }));
    }
  };

  const toggleDraftSelection = (
    tripId: number,
    itemId: string,
    setter: (updater: (prev: Record<number, string[]>) => Record<number, string[]>) => void,
  ) => {
    setter((prev) => {
      const current = new Set(prev[tripId] ?? []);
      if (current.has(itemId)) {
        current.delete(itemId);
      } else {
        current.add(itemId);
      }
      return { ...prev, [tripId]: Array.from(current) };
    });
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
        setReservationSummaries(
          Object.fromEntries(
            summaries.map((summary: TripSummary) => [
              summary.trip_id,
              {
                total: summary.reservation_count,
                upcoming: summary.reservation_upcoming_count,
                loading: false,
              },
            ]),
          ),
        );
        setPrepSummaries(
          Object.fromEntries(
            summaries.map((summary: TripSummary) => [
              summary.trip_id,
              {
                total: summary.prep_total,
                completed: summary.prep_completed,
                overdue: summary.prep_overdue_count,
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

  useEffect(() => {
    for (const [tripIdKey, streamState] of Object.entries(streams)) {
      const tripId = Number(tripIdKey);
      const completedItinerary = streamState?.itinerary;
      if (completedItinerary) {
        setPendingItineraries((prev) => {
          if (prev[tripId]) {
            return prev;
          }
          const editable = toEditableItinerary(completedItinerary);
          setRegenerationControls((controls) => ({
            ...controls,
            [tripId]: controls[tripId] ?? getDefaultRegenerationControls(editable),
          }));
          return { ...prev, [tripId]: editable };
        });
      }
    }
  }, [streams]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    setActionError(null);
    try {
      await deleteTrip(token, id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
      setOpenMenuId((current) => (current === id ? null : current));
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
      upsertDraftItinerary(tripId, itinerary, pendingItineraries[tripId]);
      setActiveTab(tripId, 'itinerary');
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
    const itinerary = pendingItineraries[tripId] ?? (streams[tripId]?.itinerary ? toEditableItinerary(streams[tripId].itinerary) : null);
    if (!itinerary) return;

    setActionError(null);
    setApplyingIds((prev) => new Set(prev).add(tripId));
    try {
      await applyItinerary(token, tripId, toApiItinerary(itinerary));
      const freshTrips = await getTrips(token);
      setTrips(freshTrips);
      resetStream(tripId);
      setPendingItineraries((prev) => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
      setLockedItemIds((prev) => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
      setFavoriteItemIds((prev) => {
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

  const handleLoadSavedAsDraft = (tripId: number, itinerary: Itinerary) => {
    upsertDraftItinerary(tripId, itinerary, pendingItineraries[tripId]);
    setActiveTab(tripId, 'itinerary');
  };

  const handleMoveDraftItem = (
    tripId: number,
    sourceDayNumber: number,
    sourceIndex: number,
    targetDayNumber: number,
    targetIndex: number,
  ) => {
    setPendingItineraries((prev) => {
      const current = prev[tripId];
      if (!current) return prev;
      return {
        ...prev,
        [tripId]: moveEditableItineraryItem(current, sourceDayNumber, sourceIndex, targetDayNumber, targetIndex),
      };
    });
  };

  const handleRegenerateDraft = async (tripId: number) => {
    const current = pendingItineraries[tripId];
    const controls = regenerationControls[tripId];
    if (!current || !controls) return;

    setActionError(null);
    setRegeneratingIds((prev) => new Set(prev).add(tripId));
    try {
      const refined = await refineItinerary(token, tripId, {
        current_itinerary: toApiItinerary(current),
        locked_items: buildItemReferences(current, lockedItemIds[tripId] ?? []),
        favorite_items: buildItemReferences(current, favoriteItemIds[tripId] ?? []),
        regenerate_day_number: controls.dayNumber,
        regenerate_time_block: controls.timeBlock === 'full_day' ? undefined : controls.timeBlock,
        variant: controls.variant,
      });
      upsertDraftItinerary(tripId, refined, current);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to refine itinerary.');
    } finally {
      setRegeneratingIds((prev) => {
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

            const isGeneratingSmart = generatingSmartIds.has(trip.id);
            const isRegenerating    = regeneratingIds.has(trip.id);
            const isAnyGenerating   = isStreaming || isGeneratingSmart;
            const isApplying        = applyingIds.has(trip.id);
            const isViewing         = viewingIds.has(trip.id);

            const pendingItinerary  = pendingItineraries[trip.id] ?? null;
            const savedItinerary    = trip.description ? parseItinerary(trip.description) : null;
            const hasSavedItinerary = savedItinerary !== null;
            const tripStatus        = getTripStatus(trip.start_date, trip.end_date);
            const activeTab         = activeTabs[trip.id] ?? 'overview';
            const packingSummary    = packingSummaries[trip.id];
            const reservationSummary = reservationSummaries[trip.id];
            const prepSummary = prepSummaries[trip.id];
            const controls          = regenerationControls[trip.id] ?? (pendingItinerary ? getDefaultRegenerationControls(pendingItinerary) : null);
            const nextAction = getNextActionSummary({
              hasSavedItinerary,
              hasPendingItinerary: !!pendingItinerary,
              tripStatus,
              reservationSummary,
              prepSummary,
              packingSummary,
            });
            const activeTabMeta = TAB_LABELS.find((tab) => tab.id === activeTab) ?? TAB_LABELS[0];

            const startDate = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const endDate   = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <motion.li
                key={trip.id}
                ref={(el) => {
                  if (el) tripCardRefs.current.set(trip.id, el);
                  else tripCardRefs.current.delete(trip.id);
                }}
                variants={cardVariants}
                layout="position"
                className="bg-white rounded-2xl border border-smoke/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${STATUS_CONFIG[tripStatus].cls}`}>
                        {STATUS_CONFIG[tripStatus].label}
                      </span>
                      {hasSavedItinerary && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber/15 text-amber text-xs font-bold">
                          Planned
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-espresso leading-tight">{trip.title}</h3>
                      <p className="text-base font-semibold text-espresso/90 mt-1">{trip.destination}</p>
                    </div>
                    <div className="space-y-0.5 text-sm text-flint">
                      <p>{startDate} - {endDate}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flint/70">{getTripTimelineLabel(trip.start_date, trip.end_date)}</p>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(null);
                        setOpenMenuId((current) => (current === trip.id ? null : trip.id));
                      }}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-smoke bg-parchment/60 text-flint hover:text-espresso hover:bg-parchment transition-colors cursor-pointer"
                      aria-expanded={openMenuId === trip.id}
                      aria-label={`Trip actions for ${trip.title}`}
                    >
                      <span className="text-lg leading-none">...</span>
                    </button>

                    <AnimatePresence>
                      {openMenuId === trip.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.16 }}
                          className="absolute right-0 top-12 z-10 min-w-[180px] rounded-2xl border border-smoke bg-white shadow-lg p-2"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTrip(trip);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-espresso hover:bg-parchment transition-colors cursor-pointer"
                          >
                            Edit trip
                          </button>
                          {confirmDeleteId === trip.id ? (
                            <div className="px-3 py-2 space-y-2">
                              <p className="text-xs font-semibold text-danger">Delete this trip?</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(trip.id)}
                                  className="px-3 py-1.5 rounded-full bg-danger/10 border border-danger/25 text-xs font-semibold text-danger hover:bg-danger/15 transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1.5 rounded-full bg-parchment text-xs font-semibold text-flint hover:bg-smoke transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(trip.id)}
                              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                            >
                              Delete trip
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="rounded-2xl border border-smoke bg-parchment/50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-flint/75">Next thing to handle</p>
                  <p className="text-base font-bold text-espresso mt-1">{nextAction.label}</p>
                  <p className="text-sm text-flint mt-1 max-w-3xl">{nextAction.hint}</p>
                  {trip.notes && (() => {
                    const prefs = parsePreferences(trip.notes);
                    if (prefs) return (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {prefs.budget && (
                          <span className="px-2 py-0.5 rounded-full bg-amber/15 text-amber text-xs font-semibold border border-amber/20">
                            {prefs.budget}
                          </span>
                        )}
                        {prefs.pace && (
                          <span className="px-2 py-0.5 rounded-full bg-espresso/10 text-espresso text-xs font-semibold border border-espresso/15">
                            {prefs.pace}
                          </span>
                        )}
                        {prefs.interests?.map((interest) => (
                          <span key={interest} className="px-2 py-0.5 rounded-full bg-parchment text-flint text-xs font-medium border border-smoke">
                            {interest}
                          </span>
                        ))}
                      </div>
                    );
                    return <p className="text-xs text-flint/70 italic mt-3">{trip.notes}</p>;
                  })()}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    <PillButton variant="ocean" onClick={() => setActiveTab(trip.id, nextAction.tab)}>
                      Continue Planning
                    </PillButton>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-clay/25 bg-clay/10 text-xs font-semibold text-clay">
                      {reservationSummary?.total ?? 0} booking{(reservationSummary?.total ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span
                      className={[
                        'inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold',
                        prepSummary?.overdue
                          ? 'border-danger/25 bg-danger/10 text-danger'
                          : 'border-olive/20 bg-olive/10 text-olive',
                      ].join(' ')}
                    >
                      {prepSnapshotLabel(prepSummary)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-smoke bg-parchment/70 text-xs font-semibold text-flint">
                      {packingSnapshotLabel(packingSummary)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 bg-parchment rounded-2xl p-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {TAB_LABELS.map((tab) => {
                    const disabled = tab.id === 'map' && !savedItinerary;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => !disabled && setActiveTab(trip.id, tab.id)}
                        disabled={disabled}
                        className={[
                          'flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors duration-150',
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

                <div className="px-1">
                  <p className="text-sm font-semibold text-espresso">{activeTabMeta.label}</p>
                  <p className="text-sm text-flint mt-1">{activeTabMeta.helper}</p>
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
                          <>
                            <span className="w-px h-5 bg-smoke self-center flex-shrink-0" aria-hidden="true" />
                            <PillButton variant="ghost" onClick={() => toggleView(trip.id)}>
                              {isViewing ? 'Hide Saved' : 'View Saved'}
                            </PillButton>
                            <PillButton variant="ghost" onClick={() => handleLoadSavedAsDraft(trip.id, savedItinerary)}>
                              Edit as Draft
                            </PillButton>
                          </>
                        )}
                      </div>
                    )}

                    {!isStreaming && pendingItinerary && controls ? (
                      <EditableItineraryPanel
                        itinerary={pendingItinerary}
                        onApply={() => handleApply(trip.id)}
                        applying={isApplying}
                        regenerating={isRegenerating}
                        lockedItemIds={lockedItemIds[trip.id] ?? []}
                        favoriteItemIds={favoriteItemIds[trip.id] ?? []}
                        regenerateDayNumber={controls.dayNumber}
                        regenerateTimeBlock={controls.timeBlock}
                        regenerateVariant={controls.variant}
                        onMoveItem={(sourceDayNumber, sourceIndex, targetDayNumber, targetIndex) =>
                          handleMoveDraftItem(trip.id, sourceDayNumber, sourceIndex, targetDayNumber, targetIndex)
                        }
                        onToggleLock={(itemId) => toggleDraftSelection(trip.id, itemId, setLockedItemIds)}
                        onToggleFavorite={(itemId) => toggleDraftSelection(trip.id, itemId, setFavoriteItemIds)}
                        onRegenerateDayChange={(dayNumber) =>
                          setRegenerationControls((prev) => ({
                            ...prev,
                            [trip.id]: { ...(prev[trip.id] ?? controls), dayNumber },
                          }))
                        }
                        onRegenerateTimeBlockChange={(timeBlock) =>
                          setRegenerationControls((prev) => ({
                            ...prev,
                            [trip.id]: { ...(prev[trip.id] ?? controls), timeBlock },
                          }))
                        }
                        onRegenerateVariantChange={(variant) =>
                          setRegenerationControls((prev) => ({
                            ...prev,
                            [trip.id]: { ...(prev[trip.id] ?? controls), variant },
                          }))
                        }
                        onRegenerate={() => handleRegenerateDraft(trip.id)}
                      />
                    ) : (
                      isViewing && savedItinerary && <ItineraryPanel itinerary={savedItinerary} />
                    )}

                    {!pendingItinerary && !isViewing && !isStreaming && !savedItinerary && (
                      <div className="rounded-2xl border border-dashed border-smoke bg-parchment/40 px-5 py-8 text-center">
                        <p className="text-sm font-semibold text-espresso">No itinerary yet</p>
                        <p className="text-sm text-flint mt-1 mb-4">Generate an AI plan to start building this trip.</p>
                        <div className="flex justify-center gap-2 flex-wrap">
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
                            {isGeneratingSmart ? 'Working…' : 'Smart Plan'}
                          </PillButton>
                        </div>
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
                {activeTab === 'reservations' && (
                  <ReservationsPanel
                    token={token}
                    tripId={trip.id}
                  />
                )}
                {activeTab === 'prep' && (
                  <PrepPanel
                    token={token}
                    tripId={trip.id}
                    destination={trip.destination}
                    startDate={trip.start_date}
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
