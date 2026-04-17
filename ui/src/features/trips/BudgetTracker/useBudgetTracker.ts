import { useReducer, useEffect, useCallback } from 'react';
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

type BudgetState = { loading: boolean; error: string | null; limit: number | null; expenses: BudgetExpense[] };
type BudgetAction =
  | { type: 'fetch/start' }
  | { type: 'fetch/done'; limit: number | null; expenses: BudgetExpense[] }
  | { type: 'fetch/error'; message: string }
  | { type: 'limit/set'; limit: number | null; expenses: BudgetExpense[] }
  | { type: 'expense/add'; expense: BudgetExpense }
  | { type: 'expense/remove'; id: number };

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'fetch/start':    return { ...state, loading: true, error: null };
    case 'fetch/done':     return { loading: false, error: null, limit: action.limit, expenses: action.expenses };
    case 'fetch/error':    return { ...state, loading: false, error: action.message };
    case 'limit/set':      return { ...state, limit: action.limit, expenses: action.expenses };
    case 'expense/add':    return { ...state, expenses: [...state.expenses, action.expense] };
    case 'expense/remove': return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };
  }
}

export function useBudgetTracker(token: string, tripId: number): UseBudgetTrackerReturn {
  const [{ loading, error, limit, expenses }, dispatch] = useReducer(budgetReducer, {
    loading: true, error: null, limit: null, expenses: [],
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'fetch/start' });
    getBudget(token, tripId)
      .then((data) => {
        if (!cancelled) dispatch({ type: 'fetch/done', limit: data.limit, expenses: data.expenses });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: 'fetch/error', message: err instanceof Error ? err.message : 'Failed to load' });
      });
    return () => { cancelled = true; };
  }, [token, tripId]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining  = limit !== null ? limit - totalSpent : null;
  const isOverBudget = remaining !== null && remaining < 0;

  const setLimit = useCallback(async (amount: number | null) => {
    const data = await updateBudgetLimit(token, tripId, amount);
    dispatch({ type: 'limit/set', limit: data.limit, expenses: data.expenses });
  }, [token, tripId]);

  const addExpense = useCallback(async (label: string, amount: number, category: ExpenseCategory) => {
    const trimmed = label.trim();
    if (!trimmed || amount <= 0) return;
    const expense = await createExpense(token, tripId, { label: trimmed, amount, category });
    dispatch({ type: 'expense/add', expense });
  }, [token, tripId]);

  const removeExpense = useCallback(async (id: number) => {
    await deleteExpense(token, tripId, id);
    dispatch({ type: 'expense/remove', id });
  }, [token, tripId]);

  return { limit, expenses, totalSpent, remaining, isOverBudget, loading, error, setLimit, addExpense, removeExpense };
}
