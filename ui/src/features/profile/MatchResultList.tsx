import { motion, AnimatePresence } from 'framer-motion';

import { useMatchResults } from './useMatchResults';
import { MatchResultCard } from './MatchResultCard';


interface MatchResultListProps {
  requestId: number;
  token: string;
}


export const MatchResultList = ({ requestId, token }: MatchResultListProps) => {
  const { results, loading, error } = useMatchResults(token, requestId);

  if (loading) {
    return (
      <div className="px-4 py-4 rounded-2xl bg-parchment border border-smoke text-sm text-flint">
        Loading matches…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="px-4 py-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
      >
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-4 py-4 rounded-2xl bg-parchment border border-smoke text-sm text-flint">
        No matches yet for this request.
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-3"
    >
      <AnimatePresence initial={false}>
        {results.map((result, index) => (
          <motion.div
            key={`${result.matched_user.id}-${result.matched_trip.id}-${index}`}
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          >
            <MatchResultCard result={result} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
