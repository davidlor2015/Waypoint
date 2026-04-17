import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { MatchResult } from '../../shared/api/matching';
import { ScoreBar } from './ScoreBar';

function displayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}


interface MatchResultCardProps {
  result: MatchResult;
}


export const MatchResultCard = ({ result }: MatchResultCardProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring' as const, bounce: 0.2, duration: 0.38 },
        },
      }}
      className="rounded-2xl border border-smoke/60 bg-white p-4 shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-base font-bold text-espresso">{displayName(result.matched_user.email)}</p>
          <p className="text-xs text-flint/70 mt-0.5">{result.matched_user.email}</p>
          <p className="text-sm text-flint mt-1">{result.matched_trip.destination}</p>
          <p className="text-xs text-flint/80 mt-1">
            {result.matched_trip.start_date} to {result.matched_trip.end_date}
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-olive/10 border border-olive/20 text-olive text-sm font-bold">
          {Math.round(result.score * 100)}% match
        </span>
      </div>

      <ScoreBar label="Overall Compatibility" value={result.score} />

      <motion.button
        type="button"
        onClick={() => setShowBreakdown((value) => !value)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 rounded-full bg-parchment text-espresso text-sm font-semibold
                   hover:bg-smoke transition-colors duration-150 cursor-pointer"
      >
        {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
      </motion.button>

      <AnimatePresence initial={false}>
        {showBreakdown ? (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <ScoreBar label="Destination" value={result.breakdown.destination} />
              <ScoreBar label="Date Overlap" value={result.breakdown.date_overlap} />
              <ScoreBar label="Travel Style" value={result.breakdown.travel_style} />
              <ScoreBar label="Budget" value={result.breakdown.budget} />
              <ScoreBar label="Interests" value={result.breakdown.interests} />
              <ScoreBar label="Group Size" value={result.breakdown.group_size} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
