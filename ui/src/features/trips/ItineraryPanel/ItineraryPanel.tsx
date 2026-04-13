import { motion } from 'framer-motion';
import type { Itinerary } from '../../../shared/api/ai';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItineraryPanelProps {
  itinerary: Itinerary;
  onApply?: () => void;
  applying?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ItineraryPanel = ({ itinerary, onApply, applying }: ItineraryPanelProps) => (
  <div className="mt-2 rounded-2xl border border-ocean/20 bg-ocean/5 overflow-hidden">

    {/* Header */}
    <div className="px-5 pt-5 pb-4 border-b border-ocean/10">
      <h4 className="text-base font-extrabold text-navy leading-tight">{itinerary.title}</h4>
      <p className="text-sm text-gray mt-1 leading-relaxed">{itinerary.summary}</p>
    </div>

    {/* Days */}
    <div className="divide-y divide-ocean/10">
      {itinerary.days.map((day) => (
        <div key={day.day_number} className="px-5 py-4 space-y-3">

          {/* Day header */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ocean text-white text-xs font-extrabold flex-shrink-0">
              {day.day_number}
            </span>
            <span className="text-sm font-bold text-navy">
              Day {day.day_number}
              {day.date && (
                <span className="ml-1.5 text-gray font-normal">{day.date}</span>
              )}
            </span>
          </div>

          {/* Events */}
          <div className="space-y-2.5 pl-9">
            {day.items.map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 rounded-xl bg-white border border-gray-100 px-4 py-3 shadow-sm"
              >
                {/* Left */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.time && (
                      <span className="px-2 py-0.5 rounded-full bg-sunny/30 text-sunny-dark text-xs font-bold flex-shrink-0">
                        {item.time}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-navy truncate">{item.title}</span>
                  </div>
                  {item.location && (
                    <span className="text-xs text-gray flex items-center gap-1 mt-0.5">
                      <span aria-hidden="true">📍</span>{item.location}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-xs text-gray italic mt-0.5 leading-relaxed">{item.notes}</span>
                  )}
                </div>

                {/* Cost */}
                {item.cost_estimate && (
                  <span className="flex-shrink-0 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full self-start">
                    {item.cost_estimate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Apply button */}
    {onApply && (
      <div className="px-5 py-4 border-t border-ocean/10">
        <motion.button
          onClick={onApply}
          disabled={applying}
          whileHover={!applying ? { scale: 1.02 } : undefined}
          whileTap={!applying ? { scale: 0.97 } : undefined}
          className="w-full py-3 rounded-full bg-ocean text-white text-sm font-bold
                     shadow-sm shadow-ocean/25 hover:bg-ocean-dark transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {applying ? 'Saving…' : '💾 Apply Itinerary to Trip'}
        </motion.button>
      </div>
    )}
  </div>
);
