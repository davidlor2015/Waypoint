import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { createTrip, type Trip } from '../../../shared/api/trips';
import { tripSchema, type TripFormData } from '../schemas/tripSchema';
import { FormField, inputCls } from '../../../shared/ui/FormField';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateTripFormProps {
  token: string;
  onSuccess: (newTrip: Trip) => void;
  onCancel: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export const CreateTripForm = ({ token, onSuccess, onCancel }: CreateTripFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({ resolver: zodResolver(tripSchema) });

  const onSubmit = async (data: TripFormData) => {
    try {
      const newTrip = await createTrip(token, {
        title: data.title,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes,
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
      className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-navy tracking-tight">
          <span className="mr-2" aria-hidden="true">✈️</span>New Trip
        </h2>
        <p className="text-sm text-gray mt-1">Fill in the details and start planning your adventure.</p>
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

        {/* Dates — side by side */}
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <FormField id="ctf-start-date" label="Start date" error={errors.start_date?.message}>
            <input
              id="ctf-start-date"
              type="date"
              className={inputCls(!!errors.start_date)}
              {...register('start_date')}
            />
          </FormField>

          <FormField id="ctf-end-date" label="End date" error={errors.end_date?.message}>
            <input
              id="ctf-end-date"
              type="date"
              className={inputCls(!!errors.end_date)}
              {...register('end_date')}
            />
          </FormField>
        </div>

        {/* Interests (optional) */}
        <FormField
          id="ctf-notes"
          label="Interests"
          hint="(optional)"
          error={errors.notes?.message}
        >
          <input
            id="ctf-notes"
            placeholder="e.g. food, history, nature"
            className={inputCls(!!errors.notes)}
            {...register('notes')}
          />
        </FormField>

        {/* Root / server error */}
        <AnimatePresence>
          {errors.root && (
            <motion.div
              key="root-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              role="alert"
              className="px-4 py-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-sm font-medium"
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
            className="flex-1 py-3 rounded-full bg-ocean text-white text-sm font-bold
                       shadow-sm shadow-ocean/25 hover:bg-ocean-dark transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Creating…' : '🚀 Create Trip'}
          </motion.button>

          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-full bg-silver text-navy text-sm font-semibold
                       hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </motion.button>
        </div>

      </form>
    </motion.div>
  );
};
