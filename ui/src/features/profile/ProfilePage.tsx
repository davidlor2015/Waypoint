import { motion } from 'framer-motion';
import type { Trip } from '../../shared/api/trips';
import { useProfileStats, type Badge, type JourneyEntry, type TravelStats } from './useProfileStats';



interface ProfilePageProps {
  trips: Trip[];
  userEmail: string;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.25, duration: 0.45 } },
};



interface StatConfig {
  label: string;
  getValue: (s: TravelStats) => number | string;
  accentCls: string;
  icon: React.ReactNode;
}

const PlaneIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
);

const SparkIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
    <path d="M10.8 2.3a.75.75 0 00-1.6 0l-.7 3a1 1 0 01-.75.75l-3 .7a.75.75 0 000 1.5l3 .7a1 1 0 01.75.75l.7 3a.75.75 0 001.6 0l.7-3a1 1 0 01.75-.75l3-.7a.75.75 0 000-1.5l-3-.7a1 1 0 01-.75-.75l-.7-3z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11a.75.75 0 00-1.5 0v3.5c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06l-2.03-2.03V7z" clipRule="evenodd" />
  </svg>
);

const STAT_CONFIGS: StatConfig[] = [
  {
    label: 'Total Trips',
    getValue: (s) => s.totalTrips,
    accentCls: 'text-amber bg-amber/10',
    icon: <PlaneIcon />,
  },
  {
    label: 'Destinations',
    getValue: (s) => s.uniqueDestinations.length,
    accentCls: 'text-clay bg-clay/10',
    icon: <PinIcon />,
  },
  {
    label: 'Days Planned',
    getValue: (s) => s.totalDays,
    accentCls: 'text-espresso bg-parchment',
    icon: <CalendarIcon />,
  },
  {
    label: 'Itineraries',
    getValue: (s) => s.tripsWithItinerary,
    accentCls: 'text-olive bg-olive/10',
    icon: <ListIcon />,
  },
];


const StatCard = ({ config, stats }: { config: StatConfig; stats: TravelStats }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-2xl border border-smoke/60 shadow-sm p-5 flex items-center gap-4"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.accentCls}`}>
      {config.icon}
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-extrabold text-espresso leading-none">{config.getValue(stats)}</p>
      <p className="text-xs text-flint mt-1 font-medium">{config.label}</p>
    </div>
  </motion.div>
);

const BadgeCard = ({ badge }: { badge: Badge }) => (
  <motion.div
    variants={itemVariants}
    className={[
      'rounded-2xl border px-4 py-4 flex flex-col gap-1.5 transition-opacity duration-150',
      badge.earned ? badge.earnedCls : `${badge.unearnedCls} opacity-60`,
    ].join(' ')}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-extrabold leading-tight">{badge.name}</span>
      {!badge.earned && (
        <span className="flex-shrink-0 opacity-50">
          <LockIcon />
        </span>
      )}
    </div>
    <p className={`text-xs leading-snug ${badge.earned ? 'opacity-80' : 'text-flint'}`}>
      {badge.description}
    </p>
    <div className="mt-1 space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className={badge.earned ? 'opacity-80' : 'text-flint'}>{badge.earned ? 'Unlocked' : 'Progress'}</span>
        <span className={badge.earned ? 'opacity-80' : 'text-flint'}>{badge.progressLabel}</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${badge.earned ? 'bg-white/25' : 'bg-smoke/70'}`}>
        <div
          className={`h-full rounded-full ${badge.earned ? 'bg-white/90' : 'bg-amber'}`}
          style={{ width: `${(badge.progressCurrent / badge.progressTarget) * 100}%` }}
        />
      </div>
    </div>
  </motion.div>
);

const formatDateRange = (trip: JourneyEntry) => {
  const start = new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${start} - ${end}`;
};

const statusStyles: Record<JourneyEntry['status'], string> = {
  upcoming: 'bg-amber/10 text-amber border-amber/20',
  active: 'bg-olive/10 text-olive border-olive/20',
  completed: 'bg-parchment text-flint border-smoke',
};

const statusLabel: Record<JourneyEntry['status'], string> = {
  upcoming: 'Upcoming',
  active: 'In Progress',
  completed: 'Completed',
};

const JourneyCard = ({ trip }: { trip: JourneyEntry }) => (
  <motion.div
    variants={itemVariants}
    className="rounded-2xl border border-smoke/60 bg-white p-4 shadow-sm space-y-3"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-espresso truncate">{trip.title}</p>
        <p className="text-xs text-flint mt-0.5">{trip.destination}</p>
      </div>
      <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${statusStyles[trip.status]}`}>
        {statusLabel[trip.status]}
      </span>
    </div>

    <div className="flex flex-wrap gap-2 text-xs text-flint">
      <span className="inline-flex items-center gap-1 rounded-full bg-parchment px-2.5 py-1">
        <ClockIcon />
        {trip.durationDays} {trip.durationDays === 1 ? 'day' : 'days'}
      </span>
      <span className="inline-flex items-center rounded-full bg-parchment px-2.5 py-1">
        {formatDateRange(trip)}
      </span>
      {trip.hasItinerary && (
        <span className="inline-flex items-center rounded-full bg-olive/10 text-olive px-2.5 py-1">
          Itinerary saved
        </span>
      )}
    </div>
  </motion.div>
);


export const ProfilePage = ({ trips, userEmail }: ProfilePageProps) => {
  const { stats, badges, title, nextBadge, recentTrips } = useProfileStats(trips);

  const initial       = userEmail[0].toUpperCase();
  const earnedCount   = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-8">

      {/* ── Profile header ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row items-center sm:items-end gap-5"
      >
        {/* Avatar */}
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 rounded-full bg-espresso flex items-center justify-center shadow-lg shadow-espresso/20 flex-shrink-0"
        >
          <span className="text-2xl sm:text-3xl font-extrabold text-ivory select-none">{initial}</span>
        </motion.div>

        {/* Identity */}
        <motion.div variants={itemVariants} className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-espresso leading-tight">{userEmail}</h2>
          <p className="text-sm font-semibold text-amber mt-0.5">{title}</p>
          <p className="text-xs text-flint mt-1">
            {earnedCount} of {badges.length} badges earned
          </p>
        </motion.div>
      </motion.div>

      {/* ── Stats grid ── */}
      <section>
        <h3 className="text-base font-bold text-espresso mb-3">Travel Stats</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {STAT_CONFIGS.map((config) => (
            <StatCard key={config.label} config={config} stats={stats} />
          ))}
        </motion.div>
      </section>

      {/* ── Momentum ── */}
      <section>
        <h3 className="text-base font-bold text-espresso mb-3">Momentum</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-[1.3fr_1fr] gap-4"
        >
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-smoke/60 bg-parchment/70 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber/10 text-amber flex items-center justify-center">
                <SparkIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber">Next Unlock</p>
                <h4 className="text-lg font-bold text-espresso leading-tight">{nextBadge?.name ?? 'All badges earned'}</h4>
              </div>
            </div>

            <p className="text-sm text-flint">
              {nextBadge?.description ?? 'You have already unlocked every current badge in the profile.'}
            </p>

            {nextBadge && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-flint">
                  <span>Progress</span>
                  <span>{nextBadge.progressLabel}</span>
                </div>
                <div className="h-2 rounded-full bg-white border border-smoke overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber"
                    style={{ width: `${(nextBadge.progressCurrent / nextBadge.progressTarget) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-smoke/60 bg-white p-5 shadow-sm"
          >
            <h4 className="text-sm font-bold text-espresso">Journey Snapshot</h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-flint">Completed trips</span>
                <span className="font-bold text-espresso">{stats.completedTrips}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-flint">Upcoming trips</span>
                <span className="font-bold text-espresso">{stats.upcomingTrips}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-flint">Active right now</span>
                <span className="font-bold text-espresso">{stats.activeTrips}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-flint">Longest trip</span>
                <span className="font-bold text-espresso">{stats.longestTripDays} days</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Badges ── */}
      <section>
        <h3 className="text-base font-bold text-espresso mb-3">Badges</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </motion.div>
      </section>

      {/* ── Journey Log ── */}
      {recentTrips.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-espresso mb-3">Recent Journey Log</h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {recentTrips.map((trip) => (
              <JourneyCard key={trip.id} trip={trip} />
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Destinations ── */}
      {stats.uniqueDestinations.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-espresso mb-3">Destinations</h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-2"
          >
            {stats.uniqueDestinations.map((dest) => (
              <motion.span
                key={dest}
                variants={itemVariants}
                className="px-3 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-amber text-sm font-semibold"
              >
                {dest}
              </motion.span>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Empty state ── */}
      {trips.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 border-2 border-dashed border-smoke rounded-2xl text-center">
          <h3 className="text-lg font-bold text-espresso">No adventures yet</h3>
          <p className="text-sm text-flint">Create your first trip to start earning badges and stats.</p>
        </div>
      )}

    </div>
  );
};
