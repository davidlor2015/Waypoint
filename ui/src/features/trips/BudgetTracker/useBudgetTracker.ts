import { useState, useEffect, useCallback } from 'react';
import {
  getBudget,
  updateBudgetLimit,
  createExpense,
  deleteExpense,
  type BudgetExpense,
} from '../../../shared/api/budget';

export type ExpenseCategory = 'food' | 'transport' | 'stay' | 'activities' | 'other';

export type { BudgetExpense as Expense };

export interface UseBudgetTrackerReturn {
  limit: number | null;
  expenses: BudgetExpense[];
  totalSpent: number;
  remaining: number | null;
  isOverBudget: boolean;
  loading: boolean;
  error: string | null;
  setLimit: (amount: number | null) => Promise<void>;
  addExpense: (label: string, amount: number, category: ExpenseCategory) => Promise<void>;
  removeExpense: (id: number) => Promise<void>;
}

export function useBudgetTracker(token: string, tripId: number): UseBudgetTrackerReturn {
  const [limit, setLimitState] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getBudget(token, tripId)
      .then((data) => {
        if (!cancelled) {
          setLimitState(data.limit);
          setExpenses(data.expenses);
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, tripId]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining  = limit !== null ? limit - totalSpent : null;
  const isOverBudget = remaining !== null && remaining < 0;

  const setLimit = useCallback(async (amount: number | null) => {
    const data = await updateBudgetLimit(token, tripId, amount);
    setLimitState(data.limit);
    setExpenses(data.expenses);
  }, [token, tripId]);

  const addExpense = useCallback(async (label: string, amount: number, category: ExpenseCategory) => {
    const trimmed = label.trim();
    if (!trimmed || amount <= 0) return;
    const expense = await createExpense(token, tripId, { label: trimmed, amount, category });
    setExpenses((prev) => [...prev, expense]);
  }, [token, tripId]);

  const removeExpense = useCallback(async (id: number) => {
    await deleteExpense(token, tripId, id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [token, tripId]);

  return { limit, expenses, totalSpent, remaining, isOverBudget, loading, error, setLimit, addExpense, removeExpense };
}
