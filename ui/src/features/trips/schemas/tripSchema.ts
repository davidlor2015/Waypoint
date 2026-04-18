import { z } from "zod";

export const BUDGET_OPTIONS = [
  { value: "budget",   label: "Budget"   },
  { value: "moderate", label: "Moderate" },
  { value: "luxury",   label: "Luxury"   },
] as const;

export const PACE_OPTIONS = [
  { value: "relaxed",  label: "Relaxed"    },
  { value: "balanced", label: "Balanced"   },
  { value: "fast",     label: "Fast-paced" },
] as const;

export const INTEREST_OPTIONS = [
  "food", "history", "walking", "culture", "city exploration",
  "nightlife", "shopping", "landmarks", "photography", "nature",
  "art", "architecture",
] as const;

export type BudgetValue   = typeof BUDGET_OPTIONS[number]["value"];
export type PaceValue     = typeof PACE_OPTIONS[number]["value"];
export type InterestValue = typeof INTEREST_OPTIONS[number];

export const tripSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be 255 characters or less"),
    destination: z
      .string()
      .min(1, "Destination is required")
      .max(255, "Destination must be 255 characters or less"),
    start_date: z.string().min(1, "Start date is required"),
    end_date:   z.string().min(1, "End date is required"),
    budget:     z.enum(["budget", "moderate", "luxury"]).optional(),
    pace:       z.enum(["relaxed", "balanced", "fast"]).optional(),
    interests:  z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      !data.start_date || !data.end_date || data.end_date >= data.start_date,
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type TripFormData = z.infer<typeof tripSchema>;

export function serializePreferences(data: Pick<TripFormData, "budget" | "pace" | "interests">): string {
  return [
    data.budget    ? `Budget: ${data.budget}`                   : null,
    data.pace      ? `Pace: ${data.pace}`                       : null,
    data.interests?.length ? `Interests: ${data.interests.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}
