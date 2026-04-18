import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackingList } from './usePackingList';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PackingListProps {
  token: string;
  tripId: number;
  onSummaryChange?: (summary: { total: number; checked: number; progressPct: number; loading: boolean }) => void;
}

// ── Animation variants ────────────────────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, bounce: 0.3, duration: 0.4 } },
  exit:   { opacity: 0, x: 12, transition: { duration: 0.18 } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export const PackingList = ({ token, tripId, onSummaryChange }: PackingListProps) => {
  const { items, loading, addItem, toggleItem, removeItem, clearChecked } = usePackingList(token, tripId);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const checkedCount = items.filter((i) => i.checked).length;
  const total        = items.length;
  const progressPct  = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

  useEffect(() => {
    onSummaryChange?.({ total, checked: checkedCount, progressPct, loading });
  }, [checkedCount, loading, onSummaryChange, progressPct, total]);

  const handleAdd = useCallback(() => {
    addItem(draft);
    setDraft('');
    inputRef.current?.focus();
  }, [addItem, draft]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  }, [handleAdd]);

  return (
    <div className="mt-2 rounded-2xl border border-clay/20 bg-clay/5 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-clay/10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h4 className="text-base font-bold text-espresso">Packing List</h4>
            <p className="text-xs text-flint mt-0.5">
              {loading ? 'Loading…' : total === 0 ? 'Nothing added yet.' : `${checkedCount} of ${total} packed`}
            </p>
          </div>

          {checkedCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={clearChecked}
              className="text-xs font-semibold text-clay hover:text-clay-dark transition-colors cursor-pointer"
            >
              Clear packed
            </motion.button>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-clay/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-clay"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* ── Item list ── */}
      <ul className="divide-y divide-clay/10 list-none p-0 m-0">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              className="flex items-center gap-3 px-5 py-3"
            >
              {/* Checkbox */}
              <motion.button
                onClick={() => toggleItem(item.id)}
                whileTap={{ scale: 0.85 }}
                aria-label={item.checked ? 'Mark unpacked' : 'Mark packed'}
                className={[
                  'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors duration-150 cursor-pointer',
                  item.checked
                    ? 'bg-clay border-clay'
                    : 'bg-white border-smoke hover:border-clay',
                ].join(' ')}
              >
                {item.checked && (
                  <svg viewBox="0 0 10 10" className="w-full h-full text-white" fill="none">
                    <path
                      d="M2 5.5l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </motion.button>

              {/* Label */}
              <span
                className={[
                  'flex-1 text-sm transition-colors duration-150',
                  item.checked ? 'line-through text-flint' : 'text-espresso font-medium',
                ].join(' ')}
              >
                {item.label}
              </span>

              {/* Remove */}
              <motion.button
                onClick={() => removeItem(item.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Remove item"
                className="flex-shrink-0 text-flint hover:text-clay transition-colors duration-150 cursor-pointer"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* ── Add item row ── */}
      <div className="px-5 py-4 border-t border-clay/10 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an item..."
          className={[
            'flex-1 px-4 py-2 rounded-full border border-smoke bg-white text-sm text-espresso',
            'placeholder:text-flint focus:outline-none focus:ring-2 focus:ring-clay/35 focus:border-clay',
            'transition-all duration-150',
          ].join(' ')}
        />
        <motion.button
          onClick={handleAdd}
          disabled={!draft.trim()}
          whileHover={draft.trim() ? { scale: 1.04 } : undefined}
          whileTap={draft.trim() ? { scale: 0.96 } : undefined}
          className="px-4 py-2 rounded-full bg-clay text-white text-sm font-bold shadow-sm shadow-clay/20
                     hover:bg-clay-dark transition-colors duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Add
        </motion.button>
      </div>
    </div>
  );
};
