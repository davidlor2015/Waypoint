import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { updateTrip, type Trip } from '../../../shared/api/trips';
import { tripSchema, type TripFormData } from '../schemas/tripSchema';
import { FormField } from '../../../shared/ui/FormField';
import { inputCls } from '../../../shared/ui/inputCls';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditTripModalProps {
  token: string;
  trip: Trip;
  onSuccess: (updatedTrip: Trip) => void;
  onClose: () => void;
}

// ── Animation variants ────────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring' as const, bounce: 0.28, duration: 0.48 } },
  exit:   { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.18 } },
};

// ── Main Component ────────────────────────────────────────────────────────────

export const EditTripModal = ({ token, trip, onSuccess, onClose }: EditTripModalProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title:       trip.title,
      destination: trip.destination,
      start_date:  trip.start_date.slice(0, 10),
      end_date:    trip.end_date.slice(0, 10),
      notes:       trip.notes ?? '',
    },
  });

  const onSubmit = async (data: TripFormData) => {
    try {
      const updated = await updateTrip(token, trip.id, {
        title:       data.title,
        destination: data.destination,
        start_date:  data.start_date,
        end_date:    data.end_date,
        notes:       data.notes,
      });
      onSuccess(updated);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to update trip. Please try again.',
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="show"
      exit="hidden"
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Edit trip"
        variants={panelVariants}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-smoke/60 shadow-xl p-8"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-espresso tracking-tight">
              Edit Trip
            </h2>
            <p className="text-sm text-flint mt-1">Update the details for <span className="font-semibold text-espresso">{trip.title}</span>.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 text-flint hover:text-espresso transition-colors text-xl leading-none cursor-pointer mt-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

          {/* Title */}
          <FormField id="etm-title" label="Trip title" error={errors.title?.message}>
            <input
              id="etm-title"
              placeholder="e.g. Summer in Rome"
              className={inputCls(!!errors.title)}
              {...register('title')}
            />
          </FormField>

          {/* Destination */}
          <FormField id="etm-destination" label="Destination" error={errors.destination?.message}>
            <input
              id="etm-destination"
              placeholder="e.g. Rome, Italy"
              className={inputCls(!!errors.destination)}
              {...register('destination')}
            />
          </FormField>

          {/* Dates — side by side */}
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <FormField id="etm-start-date" label="Start date" error={errors.start_date?.message}>
              <input
                id="etm-start-date"
                type="date"
                className={inputCls(!!errors.start_date)}
                {...register('start_date')}
              />
            </FormField>

            <FormField id="etm-end-date" label="End date" error={errors.end_date?.message}>
              <input
                id="etm-end-date"
                type="date"
                className={inputCls(!!errors.end_date)}
                {...register('end_date')}
              />
            </FormField>
          </div>

          {/* Trip preferences (optional) */}
          <FormField id="etm-notes" label="Trip preferences" hint="Optional" error={errors.notes?.message}>
            <input
              id="etm-notes"
              placeholder="e.g. food, museums, low-cost activities"
              className={inputCls(!!errors.notes)}
              {...register('notes')}
            />
          </FormField>
          <p className="-mt-2 text-xs text-flint">
            These notes guide itinerary generation and trip planning, such as interests, pace, or budget preferences.
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
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </motion.button>

            <motion.button
              type="button"
              onClick={onClose}
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
    </motion.div>
  );
};
