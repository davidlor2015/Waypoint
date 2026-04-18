import { useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { createTrip, type Trip } from '../../../shared/api/trips';
import {
  tripSchema,
  serializePreferences,
  type TripFormData,
  BUDGET_OPTIONS,
  PACE_OPTIONS,
  INTEREST_OPTIONS,
} from '../schemas/tripSchema';
import { FormField } from '../../../shared/ui/FormField';
import { inputCls } from '../../../shared/ui/inputCls';

interface CreateTripFormProps {
  token: string;
  onSuccess: (newTrip: Trip) => void;
  onCancel: () => void;
  defaultDestination?: string;
}

export const CreateTripForm = ({ token, onSuccess, onCancel, defaultDestination }: CreateTripFormProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      destination: defaultDestination ?? '',
      interests: [],
    },
  });

  const startDate = useWatch({ control, name: 'start_date' });

  const toggleInterest = (interest: string, onChange: (v: string[]) => void) => {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(next);
    onChange(next);
  };

  const onSubmit = async (data: TripFormData) => {
    try {
      const notes = serializePreferences(data);
      const newTrip = await createTrip(token, {
        title:       data.title,
        destination: data.destination,
        start_date:  data.start_date,
        end_date:    data.end_date,
        notes:       notes || undefined,
      });
      onSuccess(newTrip);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to create trip. Please try again.',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.28, duration: 0.52 }}
      className="w-full max-w-lg bg-white rounded-2xl border border-smoke/60 shadow-sm p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-espresso tracking-tight">Create Trip</h2>
        <p className="text-sm text-flint mt-1">
          Add the core trip details now. You can generate and refine the itinerary after the trip is created.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

        {/* Title */}
        <FormField id="ctf-title" label="Trip title" error={errors.title?.message}>
          <input
            id="ctf-title"
            placeholder="e.g. Summer in Rome"
            className={inputCls(!!errors.title)}
            {...register('title')}
          />
        </FormField>

        {/* Destination */}
        <FormField id="ctf-destination" label="Destination" error={errors.destination?.message}>
          <input
            id="ctf-destination"
            placeholder="e.g. Rome, Italy"
            className={inputCls(!!errors.destination)}
            {...register('destination')}
          />
        </FormField>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <FormField id="ctf-start-date" label="Start date" error={errors.start_date?.message}>
            <input id="ctf-start-date" type="date" className={inputCls(!!errors.start_date)} {...register('start_date')} />
          </FormField>
          <FormField id="ctf-end-date" label="End date" error={errors.end_date?.message}>
            <input id="ctf-end-date" type="date" min={startDate || undefined} className={inputCls(!!errors.end_date)} {...register('end_date')} />
          </FormField>
        </div>

        {/* Budget + Pace */}
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <FormField id="ctf-budget" label="Budget" hint="Optional" error={errors.budget?.message}>
            <select id="ctf-budget" className={inputCls(!!errors.budget)} {...register('budget')}>
              <option value="">Select budget</option>
              {BUDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>

          <FormField id="ctf-pace" label="Pace" hint="Optional" error={errors.pace?.message}>
            <select id="ctf-pace" className={inputCls(!!errors.pace)} {...register('pace')}>
              <option value="">Select pace</option>
              {PACE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Interests */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-espresso">
            Interests <span className="text-flint font-normal">(Optional)</span>
          </span>
          <Controller
            name="interests"
            control={control}
            render={({ field: { onChange } }) => (
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest, onChange)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150 cursor-pointer ${
                        active
                          ? 'bg-espresso text-white border-espresso'
                          : 'bg-parchment text-flint border-smoke hover:border-espresso hover:text-espresso'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            )}
          />
          <p className="text-xs text-flint">These guide itinerary generation — budget, pace, and interests are passed to the AI.</p>
        </div>

        {/* Root error */}
        <AnimatePresence>
          {errors.root && (
            <motion.div
              key="root-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              role="alert"
              className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
            >
              {errors.root.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 pt-1 max-sm:flex-col">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.03 } : undefined}
            whileTap={!isSubmitting ? { scale: 0.97 } : undefined}
            className="flex-1 py-3 rounded-full bg-amber text-white text-sm font-bold
                       shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Creating…' : 'Create Trip'}
          </motion.button>
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-full bg-parchment text-espresso text-sm font-semibold
                       hover:bg-smoke transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </motion.button>
        </div>

      </form>
    </motion.div>
  );
};
