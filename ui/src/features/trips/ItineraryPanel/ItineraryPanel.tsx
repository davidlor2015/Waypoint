import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Itinerary, ItineraryItem } from '../../../shared/api/ai';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItineraryPanelProps {
  itinerary: Itinerary;
  onApply?: () => void;
  applying?: boolean;
}

// ── Cost helpers ──────────────────────────────────────────────────────────────

function parseCostRange(cost: string | null): { min: number; max: number } | null {
  if (!cost) return null;
  const lower = cost.toLowerCase().trim();
  if (lower === 'free' || lower === '$0') return { min: 0, max: 0 };
  const rangeMatch = cost.match(/\$?(\d+)\s*[-–]\s*\$?(\d+)/);
  if (rangeMatch) return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };
  const singleMatch = cost.match(/\$?(\d+)/);
  if (singleMatch) { const v = Number(singleMatch[1]); return { min: v, max: v }; }
  return null;
}

function dayTotal(items: ItineraryItem[]): string | null {
  let min = 0, max = 0, found = false;
  for (const item of items) {
    const r = parseCostRange(item.cost_estimate);
    if (r) { min += r.min; max += r.max; found = true; }
  }
  if (!found) return null;
  if (min === 0 && max === 0) return 'Free';
  return min === max ? `~$${min}` : `~$${min}–$${max}`;
}

// ── Export helpers ────────────────────────────────────────────────────────────

function formatAsText(itinerary: Itinerary): string {
  const lines: string[] = [itinerary.title, itinerary.summary, ''];
  for (const day of itinerary.days) {
    lines.push(`Day ${day.day_number}${day.date ? ` (${day.date})` : ''}`);
    for (const item of day.items) {
      const time = item.time ? `[${item.time}] ` : '';
      const loc  = item.location ? ` @ ${item.location}` : '';
      const cost = item.cost_estimate ? ` (${item.cost_estimate})` : '';
      lines.push(`  ${time}${item.title}${loc}${cost}`);
      if (item.notes) lines.push(`    ${item.notes}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ItineraryPanel = ({ itinerary, onApply, applying }: ItineraryPanelProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatAsText(itinerary));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 rounded-2xl border border-amber/20 bg-amber/5 overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-amber/10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-bold text-espresso leading-tight">{itinerary.title}</h4>
          <p className="text-sm text-flint mt-1 leading-relaxed">{itinerary.summary}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-smoke bg-white text-xs font-semibold text-flint hover:text-espresso hover:border-espresso transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-olive" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-5.121-5.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Days */}
      <div className="divide-y divide-amber/10">
        {itinerary.days.map((day) => {
          const total = dayTotal(day.items);
          return (
            <div key={day.day_number} className="px-5 py-4 space-y-3">

              {/* Day header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-espresso text-ivory text-xs font-extrabold flex-shrink-0">
                    {day.day_number}
                  </span>
                  <span className="text-sm font-bold text-espresso">
                    Day {day.day_number}
                    {day.date && (
                      <span className="ml-1.5 text-flint font-normal">{day.date}</span>
                    )}
                  </span>
                </div>
                {total && (
                  <span className="text-xs font-semibold text-flint bg-white border border-smoke/60 px-2.5 py-1 rounded-full">
                    {total}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-2.5 pl-9">
                {day.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 rounded-xl bg-white border border-smoke/60 px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.time && (
                          <span className="px-2 py-0.5 rounded-full bg-amber/20 text-amber text-xs font-bold flex-shrink-0">
                            {item.time}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-espresso truncate">{item.title}</span>
                      </div>
                      {item.location && (
                        <span className="text-xs text-flint flex items-center gap-1 mt-0.5">
                          <svg viewBox="0 0 20 20" className="w-3 h-3 flex-shrink-0 text-flint" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {item.location}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-xs text-flint italic mt-0.5 leading-relaxed">{item.notes}</span>
                      )}
                    </div>
                    {item.cost_estimate && (
                      <span className="flex-shrink-0 text-xs font-bold text-olive bg-olive/10 px-2.5 py-1 rounded-full self-start">
                        {item.cost_estimate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply button */}
      {onApply && (
        <div className="px-5 py-4 border-t border-amber/10">
          <motion.button
            onClick={onApply}
            disabled={applying}
            whileHover={!applying ? { scale: 1.02 } : undefined}
            whileTap={!applying ? { scale: 0.97 } : undefined}
            className="w-full py-3 rounded-full bg-amber text-white text-sm font-bold
                       shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {applying ? 'Saving…' : 'Apply Itinerary to Trip'}
          </motion.button>
        </div>
      )}
    </div>
  );
};
