import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { Trip } from '../../shared/api/trips';
import { DestinationsMap } from './DestinationsMap';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardProps {
  trips: Trip[];
}

interface StatConfig {
  icon: React.ReactNode;
  value: number;
  label: string;
  valueColor: string;
  bgColor: string;
  borderColor: string;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const GlobeIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 20 20" className="w-8 h-8 text-gray-300" fill="currentColor" aria-hidden="true">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 20 20" className="w-10 h-10 text-gray-200" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M12 1.586l-4 4V17l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 4.293L14 .586V13.414l2.293 2.293A1 1 0 0018 15V5a1 1 0 00-.293-.707z" clipRule="evenodd" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#0077FF', '#FF6B6B', '#FFD166', '#10B981', '#005FCC'];

const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid #F3F4F6',
  boxShadow: '0 4px 16px rgba(30,41,59,0.08)',
  fontSize: '0.8125rem',
  fontFamily: 'Poppins, sans-serif',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const tripDuration = (start: string, end: string): number =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000));

const parseBudgetValue = (val: string): number => {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

// ── Animation variants ────────────────────────────────────────────────────────

const statsListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.3, duration: 0.5 } },
};

const chartVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.2, duration: 0.5 } },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ icon, value, label, valueColor, bgColor, borderColor }: StatConfig) => (
  <motion.div
    variants={statCardVariants}
    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-6 text-center ${bgColor} ${borderColor}`}
  >
    <span className={`${valueColor} opacity-70`}>{icon}</span>
    <span className={`text-3xl font-extrabold tabular-nums leading-none mt-2 ${valueColor}`}>
      {value}
    </span>
    <span className="text-sm text-gray font-medium mt-0.5">{label}</span>
  </motion.div>
);

interface ChartCardProps {
  title: string;
  empty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}

const ChartCard = ({ title, empty, emptyMessage, children }: ChartCardProps) => (
  <motion.div
    variants={chartVariants}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
  >
    <h3 className="text-sm font-bold text-navy mb-4">{title}</h3>
    {empty ? (
      <div className="flex flex-col items-center justify-center h-48 text-gray text-sm gap-2">
        <ChartIcon />
        {emptyMessage}
      </div>
    ) : (
      children
    )}
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export function Dashboard({ trips }: DashboardProps) {
  const stats = useMemo(() => ({
    totalDays:     trips.reduce((s, t) => s + tripDuration(t.start_date, t.end_date), 0),
    destinations:  new Set(trips.map((t) => t.destination.toLowerCase())).size,
    withItinerary: trips.filter((t) => t.description).length,
  }), [trips]);

  const durationData = useMemo(
    () => trips.map((t) => ({
      name: t.title.length > 14 ? `${t.title.slice(0, 14)}…` : t.title,
      days: tripDuration(t.start_date, t.end_date),
    })),
    [trips],
  );

  const budgetData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const trip of trips) {
      if (!trip.description) continue;
      try {
        const itinerary = JSON.parse(trip.description);
        const bd = itinerary?.budget_breakdown;
        if (bd && typeof bd === 'object') {
          for (const [key, val] of Object.entries(bd)) {
            totals[key] = (totals[key] ?? 0) + parseBudgetValue(String(val));
          }
        }
      } catch { /* skip invalid JSON */ }
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [trips]);

  const statCards: StatConfig[] = [
    { icon: <GlobeIcon />,    value: trips.length,        label: 'Total Trips',       valueColor: 'text-ocean',      bgColor: 'bg-ocean/5',   borderColor: 'border-ocean/15'   },
    { icon: <CalendarIcon />, value: stats.totalDays,     label: 'Days Traveling',    valueColor: 'text-coral',      bgColor: 'bg-coral/5',   borderColor: 'border-coral/15'   },
    { icon: <MapPinIcon />,   value: stats.destinations,  label: 'Destinations',      valueColor: 'text-sunny-dark', bgColor: 'bg-sunny/10',  borderColor: 'border-sunny/30'   },
    { icon: <CheckIcon />,    value: stats.withItinerary, label: 'Saved Itineraries', valueColor: 'text-success',    bgColor: 'bg-success/5', borderColor: 'border-success/15' },
  ];

  // Empty state — no trips at all
  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <MapIcon />
        <div>
          <h3 className="text-lg font-bold text-navy">No data yet</h3>
          <p className="text-sm text-gray mt-1">Create and plan trips to see your dashboard stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page title ── */}
      <div>
        <h2 className="text-2xl font-extrabold text-navy">Dashboard</h2>
        <p className="text-sm text-gray mt-0.5">An overview of all your adventures.</p>
      </div>

      {/* ── Stat cards ── */}
      <motion.div
        className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1"
        variants={statsListVariants}
        initial="hidden"
        animate="show"
      >
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </motion.div>

      {/* ── Charts ── */}
      <motion.div
        className="grid grid-cols-2 gap-4 max-md:grid-cols-1"
        variants={statsListVariants}
        initial="hidden"
        animate="show"
      >
        <ChartCard
          title="Trip Duration (days)"
          empty={durationData.length === 0}
          emptyMessage="No trips yet."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durationData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                {durationData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Budget Breakdown ($)"
          empty={budgetData.length === 0}
          emptyMessage="Apply an itinerary to see budget data."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `$${v}`} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {budgetData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* ── Destinations map ── */}
      <motion.div
        variants={chartVariants}
        initial="hidden"
        animate="show"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <h3 className="text-sm font-bold text-navy mb-4">Destinations</h3>
        <DestinationsMap trips={trips} />
      </motion.div>

    </div>
  );
}
