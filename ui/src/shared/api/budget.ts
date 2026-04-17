import { API_URL } from '../../app/config';

export interface BudgetExpense {
  id: number;
  trip_id: number;
  label: string;
  amount: number;
  category: string;
  created_at: string;
}

export interface BudgetData {
  limit: number | null;
  expenses: BudgetExpense[];
}

const base = (tripId: number) => `${API_URL}/v1/trips/${tripId}/budget`;

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export async function getBudget(token: string, tripId: number): Promise<BudgetData> {
  const res = await fetch(`${base(tripId)}/`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Failed to load budget (${res.status})`);
  return res.json();
}

export async function updateBudgetLimit(token: string, tripId: number, limit: number | null): Promise<BudgetData> {
  const res = await fetch(`${base(tripId)}/limit`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ limit }),
  });
  if (!res.ok) throw new Error(`Failed to update budget limit (${res.status})`);
  return res.json();
}

export async function createExpense(
  token: string,
  tripId: number,
  expense: { label: string; amount: number; category: string },
): Promise<BudgetExpense> {
  const res = await fetch(`${base(tripId)}/expenses`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error(`Failed to add expense (${res.status})`);
  return res.json();
}

export async function updateExpense(
  token: string,
  tripId: number,
  expenseId: number,
  patch: { label?: string; amount?: number; category?: string },
): Promise<BudgetExpense> {
  const res = await fetch(`${base(tripId)}/expenses/${expenseId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update expense (${res.status})`);
  return res.json();
}

export async function deleteExpense(token: string, tripId: number, expenseId: number): Promise<void> {
  const res = await fetch(`${base(tripId)}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete expense (${res.status})`);
}
