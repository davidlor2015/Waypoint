import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudgetTracker, type ExpenseCategory } from './useBudgetTracker';
import { Toast } from '../../../shared/ui/Toast';


interface BudgetTrackerProps {
  token: string;
  tripId: number;
  onSummaryChange?: (summary: {
    limit: number | null;
    totalSpent: number;
    remaining: number | null;
    isOverBudget: boolean;
    expenseCount: number;
    loading: boolean;
  }) => void;
}


const CATEGORIES: { value: ExpenseCategory; label: string; activeCls: string; pillCls: string }[] = [
  { value: 'food',       label: 'Food',       activeCls: 'bg-amber text-white border-amber',                    pillCls: 'bg-amber/15 text-amber border-amber/30' },
  { value: 'transport',  label: 'Transport',  activeCls: 'bg-espresso text-white border-espresso',              pillCls: 'bg-espresso/10 text-espresso border-espresso/20' },
  { value: 'stay',       label: 'Stay',       activeCls: 'bg-clay text-white border-clay',                      pillCls: 'bg-clay/10 text-clay border-clay/25' },
  { value: 'activities', label: 'Activities', activeCls: 'bg-olive text-white border-olive',                    pillCls: 'bg-olive/10 text-olive border-olive/25' },
  { value: 'other',      label: 'Other',      activeCls: 'bg-espresso/80 text-white border-espresso/60',        pillCls: 'bg-parchment text-flint border-smoke' },
];


const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, bounce: 0.3, duration: 0.4 } },
  exit:   { opacity: 0, x: 12, transition: { duration: 0.18 } },
};


function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function progressBarCls(pct: number): string {
  if (pct >= 100) return 'bg-danger';
  if (pct >= 75)  return 'bg-amber';
  return 'bg-olive';
}


export const BudgetTracker = ({ token, tripId, onSummaryChange }: BudgetTrackerProps) => {
  const {
    limit, expenses, totalSpent, remaining, isOverBudget, loading,
    setLimit, addExpense, removeExpense,
  } = useBudgetTracker(token, tripId);

  const [draftLabel,    setDraftLabel]    = useState('');
  const [draftAmount,   setDraftAmount]   = useState('');
  const [draftCategory, setDraftCategory] = useState<ExpenseCategory>('other');
  const [draftLimit,    setDraftLimit]    = useState('');
  const [editingLimit,  setEditingLimit]  = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);


  const spentPct   = limit ? Math.min((totalSpent / limit) * 100, 100) : 0;
  const canAdd     = draftLabel.trim().length > 0 && Number(draftAmount) > 0;

  useEffect(() => {
    onSummaryChange?.({
      limit,
      totalSpent,
      remaining,
      isOverBudget,
      expenseCount: expenses.length,
      loading,
    });
  }, [expenses.length, isOverBudget, limit, loading, onSummaryChange, remaining, totalSpent]);

  const handleSaveLimit = useCallback(async () => {
    const parsed = parseFloat(draftLimit);
    if (!isNaN(parsed) && parsed > 0) {
      setFeedback(null);
      try {
        await setLimit(parsed);
        setEditingLimit(false);
        setFeedback('Budget updated.');
      } catch {
        return;
      }
    }
  }, [draftLimit, setLimit]);

  const handleLimitKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveLimit();
    if (e.key === 'Escape') setEditingLimit(false);
  }, [handleSaveLimit]);

  const handleAddExpense = useCallback(async () => {
    const amount = parseFloat(draftAmount);
    setFeedback(null);
    try {
      await addExpense(draftLabel, amount, draftCategory);
      setDraftLabel('');
      setDraftAmount('');
      setShowExpenseForm(false);
      setFeedback('Expense added.');
    } catch {
      return;
    }
  }, [addExpense, draftLabel, draftAmount, draftCategory]);

  const handleExpenseKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddExpense();
  }, [handleAddExpense]);

  const categoryMeta = (cat: ExpenseCategory) =>
    CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[4];

  return (
    <div className="mt-2 rounded-2xl border border-amber/25 bg-amber/5 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-amber/15">
        <div className="flex items-start justify-between gap-3 flex-wrap">

          {/* Title + budget status */}
          <div>
            <h4 className="text-base font-bold text-espresso">Money</h4>
            {loading ? (
              <p className="text-xs text-flint mt-0.5">Loading…</p>
            ) : limit !== null && !editingLimit && (
              <p className={[
                'text-xs font-semibold mt-0.5',
                isOverBudget ? 'text-danger' : 'text-flint',
              ].join(' ')}>
                {isOverBudget
                  ? `${formatCurrency(Math.abs(remaining!))} over budget`
                  : `${formatCurrency(remaining!)} remaining`}
              </p>
            )}
          </div>

          {/* Budget limit control */}
          {editingLimit ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-flint font-medium">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                onKeyDown={handleLimitKeyDown}
                placeholder="Set budget"
                className="w-28 px-3 py-1.5 rounded-full border border-amber/40 bg-white text-sm text-espresso
                           focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber
                           transition-all duration-150"
                autoFocus
              />
              <motion.button
                onClick={handleSaveLimit}
                disabled={!draftLimit || isNaN(parseFloat(draftLimit))}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 rounded-full bg-amber text-white text-xs font-bold
                           shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors duration-150
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Set
              </motion.button>
              {limit !== null && (
                <button
                  onClick={() => setEditingLimit(false)}
                  className="text-xs text-flint hover:text-espresso transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={() => { setDraftLimit(String(limit ?? '')); setEditingLimit(true); }}
                className="text-xs font-semibold text-amber hover:text-espresso transition-colors cursor-pointer"
              >
                {limit !== null ? `Budget: ${formatCurrency(limit)}` : 'Set budget'}
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowExpenseForm((prev) => !prev)}
                className="px-4 py-2 rounded-full bg-amber text-white text-sm font-bold shadow-sm shadow-amber/25"
              >
                {showExpenseForm ? 'Close expense form' : 'Add expense'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {limit !== null && !editingLimit && (
          <div className="mt-3 h-1.5 rounded-full bg-amber/15 overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-500 ${progressBarCls(spentPct)}`}
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          </div>
        )}

        {/* Totals row */}
        {expenses.length > 0 && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-flint">
              Spent: <span className="font-bold text-espresso">{formatCurrency(totalSpent)}</span>
            </span>
            {CATEGORIES.map(({ value, label, pillCls }) => {
              const catTotal = expenses
                .filter((e) => e.category === value)
                .reduce((s, e) => s + e.amount, 0);
              if (catTotal === 0) return null;
              return (
                <span
                  key={value}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pillCls}`}
                >
                  {label}: {formatCurrency(catTotal)}
                </span>
              );
            })}
          </div>
        )}

        <Toast message={feedback} onDismiss={() => setFeedback(null)} />
      </div>

      {/* ── Expense list ── */}
      {expenses.length > 0 && (
        <ul className="divide-y divide-amber/10 list-none p-0 m-0">
          <AnimatePresence initial={false}>
            {[...expenses].reverse().map((expense) => {
              const meta = categoryMeta(expense.category as ExpenseCategory);
              return (
                <motion.li
                  key={expense.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                  className="flex items-center gap-3 px-5 py-3"
                >
                  {/* Category pill */}
                  <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${meta.pillCls}`}>
                    {meta.label}
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-sm font-medium text-espresso truncate">
                    {expense.label}
                  </span>

                  {/* Amount */}
                  <span className="flex-shrink-0 text-sm font-bold text-espresso tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>

                  {/* Remove */}
                  <motion.button
                    onClick={async () => {
                      setFeedback(null);
                      try {
                        await removeExpense(expense.id);
                        setFeedback('Expense removed.');
                      } catch {
                        return;
                      }
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Remove expense"
                    className="flex-shrink-0 text-flint hover:text-danger transition-colors duration-150 cursor-pointer"
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
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* ── Add expense form ── */}
      <AnimatePresence initial={false}>
        {showExpenseForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t border-amber/15 space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(({ value, label, activeCls, pillCls }) => (
                  <motion.button
                    key={value}
                    onClick={() => setDraftCategory(value)}
                    whileTap={{ scale: 0.93 }}
                    className={[
                      'text-xs font-bold px-2.5 py-1 rounded-full border transition-colors duration-150 cursor-pointer',
                      draftCategory === value ? activeCls : pillCls,
                    ].join(' ')}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  onKeyDown={handleExpenseKeyDown}
                  placeholder="What did you spend on?"
                  className="flex-1 min-w-0 px-4 py-2 rounded-full border border-smoke bg-white text-sm text-espresso
                             placeholder:text-flint focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber
                             transition-all duration-150"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftAmount}
                  onChange={(e) => setDraftAmount(e.target.value)}
                  onKeyDown={handleExpenseKeyDown}
                  placeholder="$0"
                  className="w-20 px-3 py-2 rounded-full border border-smoke bg-white text-sm text-espresso text-right
                             placeholder:text-flint focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber
                             transition-all duration-150"
                />
                <motion.button
                  onClick={() => void handleAddExpense()}
                  disabled={!canAdd}
                  whileHover={canAdd ? { scale: 1.04 } : undefined}
                  whileTap={canAdd ? { scale: 0.96 } : undefined}
                  className="px-4 py-2 rounded-full bg-amber text-white text-sm font-bold shadow-sm shadow-amber/25
                             hover:bg-amber-dark transition-colors duration-150
                             disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Add
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
