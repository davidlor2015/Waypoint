import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { AppView } from '../../app/AppShell';
import { getRequests, type MatchRequest } from '../../shared/api/matching';
import { getTripSummaries, type Trip, type TripSummary } from '../../shared/api/trips';

interface DashboardProps {
  token: string;
  trips: Trip[];
  onNavigate: (view: AppView, tripId?: number) => void;
}

type TripStatus = 'upcoming' | 'active' | 'past';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  targetView: AppView;
  tripId?: number;
  tone: 'amber' | 'clay' | 'olive' | 'espresso';
}

interface DashboardCardProps {
  title: string;
  value: string;
  detail: string;
  tone: 'amber' | 'clay' | 'olive' | 'espresso';
}

const TONE_STYLES: Record<DashboardCardProps['tone'], string> = {
  amber: 'border-amber/20 bg-amber/5 text-amber',
  clay: 'border-clay/20 bg-clay/5 text-clay',
  olive: 'border-olive/20 bg-olive/5 text-olive',
  espresso: 'border-smoke bg-parchment text-espresso',
};

function parseSavedItinerary(description: string | null): { days?: unknown[] } | null {
  if (!description) return null;
  try {
    return JSON.parse(description);
  } catch {
    const marker = 'DETAILS (JSON): ';
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
}

function getTripStatus(startIso: string, endIso: string): TripStatus {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'active';
}

function getTimelineLabel(startIso: string, endIso: string): string {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const daysUntilStart = Math.ceil((start - now) / 86_400_000);
  const daysUntilEnd = Math.ceil((end - now) / 86_400_000);

  if (daysUntilStart > 1) return `${daysUntilStart} days until departure`;
  if (daysUntilStart === 1) return 'Departs tomorrow';
  if (daysUntilStart === 0) return 'Departs today';
  if (daysUntilEnd >= 0) return 'Currently traveling';
  if (daysUntilEnd === -1) return 'Returned yesterday';
  return `Completed ${Math.abs(daysUntilEnd)} days ago`;
}

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = new Date(endIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} - ${end}`;
}

function pickPriorityTrip(trips: Trip[]): Trip | null {
  if (trips.length === 0) return null;

  const activeTrips = trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'active');
  if (activeTrips.length > 0) {
    return activeTrips.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0];
  }

  const upcomingTrips = trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'upcoming');
  if (upcomingTrips.length > 0) {
    return upcomingTrips.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  }

  return [...trips].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
}

const DashboardCard = ({ title, value, detail, tone }: DashboardCardProps) => (
  <div className={`rounded-2xl border px-5 py-4 ${TONE_STYLES[tone]}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">{title}</p>
    <p className="mt-1 text-2xl font-bold leading-none">{value}</p>
    <p className="mt-2 text-sm text-flint">{detail}</p>
  </div>
);

export function Dashboard({ token, trips, onNavigate }: DashboardProps) {
  const [summaries, setSummaries] = useState<Record<number, TripSummary>>({});
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardMeta = async () => {
      setLoadingMeta(true);
      try {
        const [summaryRows, requestRows] = await Promise.all([
          getTripSummaries(token),
          getRequests(token),
        ]);

        if (cancelled) return;

        setSummaries(Object.fromEntries(summaryRows.map((summary) => [summary.trip_id, summary])));
        setRequests(requestRows);
      } catch {
        if (!cancelled) {
          setSummaries({});
          setRequests([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      }
    };

    void loadDashboardMeta();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const priorityTrip = useMemo(() => pickPriorityTrip(trips), [trips]);

  const dashboardStats = useMemo(() => {
    const savedTrips = trips.filter((trip) => parseSavedItinerary(trip.description) !== null);
    const totalPackingProgress = Object.values(summaries).reduce((sum, summary) => sum + summary.packing_progress_pct, 0);
    const summaryCount = Object.keys(summaries).length;
    const openRequests = requests.filter((request) => request.status === 'open');
    const overBudgetTrips = Object.values(summaries).filter((summary) => summary.budget_is_over).length;

    return {
      itineraryCoverage: trips.length > 0 ? Math.round((savedTrips.length / trips.length) * 100) : 0,
      averagePackingProgress: summaryCount > 0 ? Math.round(totalPackingProgress / summaryCount) : 0,
      openCompanionRequests: openRequests.length,
      overBudgetTrips,
    };
  }, [requests, summaries, trips]);

  const nextActions = useMemo<ActionItem[]>(() => {
    const actions: ActionItem[] = [];

    if (priorityTrip) {
      const prioritySummary = summaries[priorityTrip.id];
      const savedItinerary = parseSavedItinerary(priorityTrip.description);

      if (!savedItinerary) {
        actions.push({
          id: `itinerary-${priorityTrip.id}`,
          title: `Build the itinerary for ${priorityTrip.destination}`,
          description: 'Your next trip still needs a saved itinerary before map, packing, and budget planning become useful.',
          ctaLabel: 'Open My Trips',
          targetView: 'trips',
          tripId: priorityTrip.id,
          tone: 'amber',
        });
      }

      if (prioritySummary && prioritySummary.packing_total === 0) {
        actions.push({
          id: `packing-${priorityTrip.id}`,
          title: `Start the packing list for ${priorityTrip.destination}`,
          description: 'Add the first essential items now so the trip is not missing pre-departure prep.',
          ctaLabel: 'Review Packing',
          targetView: 'trips',
          tripId: priorityTrip.id,
          tone: 'clay',
        });
      }

      if (prioritySummary && prioritySummary.budget_limit === null) {
        actions.push({
          id: `budget-${priorityTrip.id}`,
          title: `Set a budget guardrail for ${priorityTrip.destination}`,
          description: 'A trip budget makes the itinerary and spending summaries much more actionable.',
          ctaLabel: 'Open Budget',
          targetView: 'trips',
          tripId: priorityTrip.id,
          tone: 'olive',
        });
      }
    }

    if (requests.filter((request) => request.status === 'open').length === 0 && trips.length > 0) {
      actions.push({
        id: 'companions',
        title: 'Open a companion request for an upcoming trip',
        description: 'You have no active companion requests right now, so the matching workflow is idle.',
        ctaLabel: 'Go to Companions',
        targetView: 'matching',
        tone: 'espresso',
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: 'explore',
        title: 'Explore a new destination idea',
        description: 'Your main planning basics are in place. The best next move is building future demand in Explore.',
        ctaLabel: 'Open Explore',
        targetView: 'explore',
        tone: 'espresso',
      });
    }

    return actions.slice(0, 4);
  }, [priorityTrip, requests, summaries, trips.length]);

  const recentTrips = useMemo(
    () =>
      [...trips]
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .slice(0, 4),
    [trips],
  );

  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-smoke bg-white px-8 py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-espresso">Dashboard</h2>
        <p className="mt-2 text-sm text-flint">Create your first trip to unlock planning health, active trip tracking, and next-step recommendations.</p>
        <button
          type="button"
          onClick={() => onNavigate('trips')}
          className="mt-6 inline-flex items-center rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors cursor-pointer"
        >
          Open My Trips
        </button>
      </div>
    );
  }

  const prioritySummary = priorityTrip ? summaries[priorityTrip.id] : undefined;
  const hasSavedItinerary = priorityTrip ? parseSavedItinerary(priorityTrip.description) !== null : false;
  const tripStatus = priorityTrip ? getTripStatus(priorityTrip.start_date, priorityTrip.end_date) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-espresso">Dashboard</h2>
        <p className="text-sm text-flint mt-0.5">A travel planning workspace centered on what matters right now.</p>
      </div>

      {priorityTrip && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-smoke/70 bg-white shadow-sm overflow-hidden"
        >
          <div className="grid gap-0 lg:grid-cols-[1.4fr,0.9fr]">
            <div className="px-6 py-6 bg-parchment/50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                  tripStatus === 'active'
                    ? 'bg-olive/10 text-olive'
                    : tripStatus === 'upcoming'
                      ? 'bg-amber/15 text-amber'
                      : 'bg-smoke text-flint'
                }`}>
                  {tripStatus === 'active' ? 'Current trip' : tripStatus === 'upcoming' ? 'Next trip' : 'Most recent trip'}
                </span>
                <span className="text-xs font-semibold text-flint">{getTimelineLabel(priorityTrip.start_date, priorityTrip.end_date)}</span>
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-espresso leading-tight">{priorityTrip.title}</h3>
              <p className="mt-1 text-base font-medium text-clay">{priorityTrip.destination}</p>
              <p className="mt-2 text-sm text-flint">{formatDateRange(priorityTrip.start_date, priorityTrip.end_date)}</p>
              {priorityTrip.notes && (
                <p className="mt-4 max-w-2xl text-sm text-flint leading-relaxed">{priorityTrip.notes}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('trips', priorityTrip.id)}
                  className="inline-flex items-center rounded-full bg-amber px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors cursor-pointer"
                >
                  Continue Planning
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(hasSavedItinerary ? 'trips' : 'explore', hasSavedItinerary ? priorityTrip.id : undefined)}
                  className="inline-flex items-center rounded-full border border-smoke bg-white px-4 py-2 text-sm font-semibold text-espresso hover:bg-parchment transition-colors cursor-pointer"
                >
                  {hasSavedItinerary ? 'Review Itinerary' : 'Find Inspiration'}
                </button>
              </div>
            </div>

            <div className="px-6 py-6 border-t border-smoke/70 lg:border-t-0 lg:border-l bg-white">
              <p className="text-sm font-semibold text-espresso">Planning snapshot</p>
              {loadingMeta && !prioritySummary ? (
                <div className="mt-4 space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-smoke bg-parchment/40 px-4 py-3">
                      <div className="h-2.5 bg-smoke/60 rounded-full w-14 mb-2" />
                      <div className="h-4 bg-smoke rounded-full w-36" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-smoke bg-parchment/40 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Itinerary</p>
                    <p className="mt-1 text-sm font-bold text-espresso">{hasSavedItinerary ? 'Saved and ready to use' : 'Still needs a saved plan'}</p>
                  </div>
                  <div className="rounded-xl border border-smoke bg-parchment/40 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Packing</p>
                    <p className="mt-1 text-sm font-bold text-espresso">
                      {prioritySummary ? `${prioritySummary.packing_checked}/${prioritySummary.packing_total} items packed` : 'No packing data yet'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-smoke bg-parchment/40 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Budget</p>
                    <p className="mt-1 text-sm font-bold text-espresso">
                      {prioritySummary
                        ? prioritySummary.budget_limit === null
                          ? 'No budget limit set'
                          : prioritySummary.budget_is_over
                            ? `Over budget by $${Math.abs(prioritySummary.budget_remaining ?? 0).toFixed(0)}`
                            : `$${Math.max(prioritySummary.budget_remaining ?? 0, 0).toFixed(0)} remaining`
                        : 'No budget data yet'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Itinerary Coverage"
          value={`${dashboardStats.itineraryCoverage}%`}
          detail={`${trips.filter((trip) => parseSavedItinerary(trip.description) !== null).length} of ${trips.length} trips have saved itineraries`}
          tone="amber"
        />
        <DashboardCard
          title="Packing Progress"
          value={`${dashboardStats.averagePackingProgress}%`}
          detail={loadingMeta ? 'Loading trip packing snapshots' : 'Average progress across trips with planning data'}
          tone="clay"
        />
        <DashboardCard
          title="Companion Requests"
          value={String(dashboardStats.openCompanionRequests)}
          detail={dashboardStats.openCompanionRequests > 0 ? 'Active requests are open in Companions' : 'No active requests at the moment'}
          tone="olive"
        />
        <DashboardCard
          title="Budget Watch"
          value={String(dashboardStats.overBudgetTrips)}
          detail={dashboardStats.overBudgetTrips > 0 ? 'Trips are currently running over budget' : 'No trips are flagged as over budget'}
          tone="espresso"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-2xl border border-smoke/60 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-espresso">Next Actions</h3>
              <p className="mt-1 text-sm text-flint">The highest-leverage planning steps based on your current trips and workflow state.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('trips')}
              className="text-sm font-semibold text-amber hover:text-amber-dark transition-colors cursor-pointer"
            >
              Open My Trips
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {nextActions.map((action) => (
              <div key={action.id} className="rounded-2xl border border-smoke bg-parchment/35 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-espresso">{action.title}</p>
                    <p className="mt-1 text-sm text-flint leading-relaxed">{action.description}</p>
                  </div>
                  <span className={`mt-0.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE_STYLES[action.tone]}`}>
                    Recommended
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(action.targetView, action.tripId)}
                  className="mt-4 inline-flex items-center rounded-full border border-smoke bg-white px-3.5 py-2 text-sm font-semibold text-espresso hover:bg-parchment transition-colors cursor-pointer"
                >
                  {action.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-smoke/60 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-espresso">Recent Trips</h3>
              <p className="mt-1 text-sm text-flint">A quick read on the trips already in your workspace.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('trips')}
              className="text-sm font-semibold text-amber hover:text-amber-dark transition-colors cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {recentTrips.map((trip) => {
              const summary = summaries[trip.id];
              const status = getTripStatus(trip.start_date, trip.end_date);
              const savedItinerary = parseSavedItinerary(trip.description) !== null;

              return (
                <div key={trip.id} className="rounded-2xl border border-smoke bg-parchment/30 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-espresso">{trip.title}</p>
                      <p className="mt-1 text-sm text-clay">{trip.destination}</p>
                      <p className="mt-1 text-xs text-flint">{formatDateRange(trip.start_date, trip.end_date)}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      status === 'active'
                        ? 'bg-olive/10 text-olive'
                        : status === 'upcoming'
                          ? 'bg-amber/15 text-amber'
                          : 'bg-smoke text-flint'
                    }`}>
                      {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Past'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white px-3 py-2 border border-smoke/70">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Itinerary</p>
                      <p className="mt-1 text-xs font-bold text-espresso">{savedItinerary ? 'Saved' : 'Missing'}</p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-smoke/70">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Packing</p>
                      <p className="mt-1 text-xs font-bold text-espresso">
                        {summary ? `${summary.packing_progress_pct}%` : 'Pending'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-smoke/70">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-flint">Budget</p>
                      <p className="mt-1 text-xs font-bold text-espresso">
                        {summary ? (summary.budget_limit === null ? 'Unset' : summary.budget_is_over ? 'Over' : 'On track') : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
