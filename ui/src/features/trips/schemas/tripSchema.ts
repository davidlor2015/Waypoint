import { z } from "zod";

/**
 * Client-side schema that mirrors the backend TripCreate Pydantic model.
 *
 * Rules kept in sync with app/schemas/trip.py:
 *   - title / destination: required, max 255 chars
 *   - start_date / end_date: required ISO date strings
 *   - end_date >= start_date (same cross-field validator as the backend)
 *   - notes (trip preferences): optional free text
 */
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
    end_date: z.string().min(1, "End date is required"),
    notes: z.string().optional(),
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
