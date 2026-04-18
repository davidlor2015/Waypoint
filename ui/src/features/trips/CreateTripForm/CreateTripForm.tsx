import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { createTrip, type Trip } from '../../../shared/api/trips';
import { tripSchema, type TripFormData } from '../schemas/tripSchema';
import { FormField } from '../../../shared/ui/FormField';
import { inputCls } from '../../../shared/ui/inputCls';


interface CreateTripFormProps {
  token: string;
  onSuccess: (newTrip: Trip) => void;
  onCancel: () => void;
  defaultDestination?: string;
}

export const CreateTripForm = ({ token, onSuccess, onCancel, defaultDestination }: CreateTripFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: defaultDestination ? { destination: defaultDestination } : undefined,
  });

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
      className="w-full max-w-lg bg-white rounded-2xl border border-smoke/60 shadow-sm p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-espresso tracking-tight">
          Create Trip
        </h2>
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

        {/* Trip preferences (optional) */}
        <FormField
          id="ctf-notes"
          label="Trip preferences"
          hint="Optional"
          error={errors.notes?.message}
        >
          <input
            id="ctf-notes"
            placeholder="e.g. food, museums, low-cost activities"
            className={inputCls(!!errors.notes)}
            {...register('notes')}
          />
        </FormField>
        <p className="-mt-2 text-xs text-flint">
          These notes help guide itinerary generation later, such as interests, pace, or budget preferences.
        </p>

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
