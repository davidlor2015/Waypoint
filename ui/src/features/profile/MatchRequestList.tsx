import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { openRequest as openMatchRequest, type MatchRequest } from '../../shared/api/matching';
import type { Trip } from '../../shared/api/trips';
import { MatchRequestCard } from './MatchRequestCard';


interface MatchRequestListProps {
  token: string;
  trips: Trip[];
  requests: MatchRequest[];
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const MatchRequestList = ({ token, trips, requests }: MatchRequestListProps) => {
  const [selectedTripId, setSelectedTripId] = useState<number | ''>('');
  const [items, setItems] = useState<MatchRequest[]>(requests);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(requests);
  }, [requests]);

  const selectableTrips = useMemo(
    () => trips.filter((trip) => !items.some((request) => request.trip_id === trip.id && request.status === 'open')),
    [trips, items],
  );

  useEffect(() => {
    if (selectedTripId === '' || selectableTrips.some((trip) => trip.id === selectedTripId)) {
      return;
    }
    setSelectedTripId('');
  }, [selectableTrips, selectedTripId]);

  const handleOpenRequest = async () => {
    if (!selectedTripId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await openMatchRequest(token, selectedTripId);
      setItems((current) => [response.request, ...current.filter((item) => item.id !== response.request.id)]);
      setSelectedTripId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open match request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-smoke/60 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-espresso">Open a request</h3>
          <p className="text-sm text-flint mt-1">
            Pick one of your trips and we’ll start looking for compatible travel companions.
          </p>
        </div>

        <div className="flex gap-3 max-sm:flex-col">
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 px-4 py-3 rounded-full border border-smoke bg-white text-sm text-espresso
                       focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber
                       transition-all duration-150"
          >
            <option value="">Select a trip</option>
            {selectableTrips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title} · {trip.destination}
              </option>
            ))}
          </select>

          <motion.button
            type="button"
            onClick={handleOpenRequest}
            disabled={selectedTripId === '' || submitting}
            whileHover={selectedTripId !== '' && !submitting ? { scale: 1.03 } : undefined}
            whileTap={selectedTripId !== '' && !submitting ? { scale: 0.97 } : undefined}
            className="px-5 py-3 rounded-full bg-amber text-white text-sm font-bold
                       shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? 'Finding…' : 'Find Travel Companions'}
          </motion.button>
        </div>

        {error ? (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-espresso">Your match requests</h3>
          <span className="text-xs font-medium text-flint">
            {items.length} {items.length === 1 ? 'request' : 'requests'}
          </span>
        </div>

        {items.length > 0 ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence initial={false}>
              {items.map((request) => (
                <MatchRequestCard
                  key={request.id}
                  token={token}
                  request={request}
                  trip={trips.find((trip) => trip.id === request.trip_id)}
                  onClosed={(requestId) =>
                    setItems((current) =>
                      current.map((item) =>
                        item.id === requestId ? { ...item, status: 'closed' } : item,
                      ),
                    )
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="px-5 py-10 rounded-2xl border-2 border-dashed border-smoke bg-parchment/40 text-center">
            <p className="text-sm font-semibold text-espresso">No match requests yet</p>
            <p className="text-sm text-flint mt-1">
              Open a trip request to start seeing compatible travellers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
