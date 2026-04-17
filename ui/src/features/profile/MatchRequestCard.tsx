import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { closeRequest as closeMatchRequest, type MatchRequest } from '../../shared/api/matching';
import type { Trip } from '../../shared/api/trips';
import { MatchResultList } from './MatchResultList';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}


interface MatchRequestCardProps {
  token: string;
  request: MatchRequest;
  trip?: Trip;
  onClosed?: (requestId: number) => void;
}


export const MatchRequestCard = ({ token, request, trip, onClosed }: MatchRequestCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const handleClose = async () => {
    if (closing || request.status === 'closed') {
      return;
    }

    setClosing(true);
    setCloseError(null);

    try {
      await closeMatchRequest(token, request.id);
      onClosed?.(request.id);
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Failed to close request');
    } finally {
      setClosing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.24, duration: 0.4 }}
      className="bg-white rounded-2xl border border-smoke/60 shadow-sm p-4 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-bold text-espresso truncate">
            {trip?.destination ?? 'Unknown destination'}
          </p>
          {trip ? (
            <p className="text-sm text-flint mt-1">
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </p>
          ) : (
            <p className="text-sm text-flint mt-1">Trip #{request.trip_id}</p>
          )}
        </div>

        <span
          className={[
            'inline-flex px-2.5 py-1 rounded-full border text-xs font-bold flex-shrink-0',
            request.status === 'open'
              ? 'bg-olive/10 text-olive border-olive/20'
              : 'bg-parchment text-flint border-smoke',
          ].join(' ')}
        >
          {request.status === 'open' ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="flex gap-3 max-sm:flex-col">
        <motion.button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 py-2.5 rounded-full bg-parchment text-espresso text-sm font-semibold
                     hover:bg-smoke transition-colors duration-150 cursor-pointer"
        >
          {expanded ? 'Hide Matches' : 'View Matches'}
        </motion.button>

        <motion.button
          type="button"
          onClick={handleClose}
          disabled={closing || request.status === 'closed'}
          whileHover={request.status === 'open' && !closing ? { scale: 1.03 } : undefined}
          whileTap={request.status === 'open' && !closing ? { scale: 0.97 } : undefined}
          className="flex-1 py-2.5 rounded-full bg-danger/10 text-danger text-sm font-semibold border border-danger/25
                     hover:bg-danger/15 transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {closing ? 'Closing…' : 'Close Request'}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {closeError ? (
          <motion.div
            key="close-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
          >
            {closeError}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="matches"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <MatchResultList requestId={request.id} token={token} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
