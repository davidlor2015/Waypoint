// src/features/dashboard/Dashboard.tsx
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Trip } from "../../shared/api/trips";
import "./Dashboard.css";

interface Props {
  trips: Trip[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8"];

function tripDuration(start: string, end: string): number {
  return Math.max(
    1,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}

function parseBudgetValue(val: string): number {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function Dashboard({ trips }: Props) {
  const stats = useMemo(
    () => ({
      totalDays: trips.reduce(
        (s, t) => s + tripDuration(t.start_date, t.end_date),
        0,
      ),
      destinations: new Set(trips.map((t) => t.destination.toLowerCase())).size,
      withItinerary: trips.filter((t) => t.description).length,
    }),
    [trips],
  );

  const durationData = useMemo(
    () =>
      trips.map((t) => ({
        name: t.title.length > 14 ? t.title.slice(0, 14) + "---" : t.title,
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
        if (bd && typeof bd == "object") {
          for (const [key, val] of Object.entries(bd)) {
            totals[key] = (totals[key] ?? 0) + parseBudgetValue(String(val));
          }
        }
      } catch {
        // skip trips with invalid itinerary JSON
      }
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [trips]);

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        {[
          { value: trips.length, label: "Total Trips" },
          { value: stats.totalDays, label: "Days Traveling" },
          { value: stats.destinations, label: "Destinations" },
          { value: stats.withItinerary, label: "Saved Itineraries" },
        ].map(({ value, label }) => (
          <div key={label} className="stat-card">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Trip Duration (days)</h3>
          {durationData.length === 0 ? (
            <p className="chart-empty">No trips yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={durationData}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  {durationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Budget Breakdown ($)</h3>
          {budgetData.length === 0 ? (
            <p className="chart-empty">
              Apply an itinerary to see budget data.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={budgetData}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v}`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {budgetData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
