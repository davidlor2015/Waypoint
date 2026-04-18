import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

import {
  upsertProfile,
  type BudgetRange,
  type TravelProfile,
  type TravelProfilePayload,
  type TravelStyle,
} from '../../shared/api/matching';
import { FormField } from '../../shared/ui/FormField';
import { inputCls } from '../../shared/ui/inputCls';
import { getProfileCompleteness } from './matchingInsights';


const TRAVEL_STYLE_OPTIONS: { value: TravelStyle; label: string }[] = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'party', label: 'Party' },
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid_range', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
];

const INTEREST_OPTIONS = [
  'Food',
  'Nature',
  'Museums',
  'Nightlife',
  'Shopping',
  'History',
  'Hiking',
  'Beaches',
] as const;

const travelProfileSchema = z
  .object({
    travel_style: z.enum(['adventure', 'relaxed', 'cultural', 'party']),
    budget_range: z.enum(['budget', 'mid_range', 'luxury']),
    interests: z.array(z.string()).min(1, 'Pick at least one interest'),
    group_size_min: z.coerce.number().int().min(1, 'Minimum group size must be at least 1'),
    group_size_max: z.coerce.number().int().min(1, 'Maximum group size must be at least 1'),
    is_discoverable: z.boolean(),
  })
  .refine((data) => data.group_size_max >= data.group_size_min, {
    message: 'Maximum group size must be greater than or equal to minimum',
    path: ['group_size_max'],
  });

type TravelProfileFormInput = z.input<typeof travelProfileSchema>;
type TravelProfileFormData = z.output<typeof travelProfileSchema>;

interface TravelProfileFormProps {
  token: string;
  profile?: TravelProfile | null;
  onSubmitProfile?: (data: TravelProfilePayload) => Promise<TravelProfile>;
  onSuccess?: (profile: TravelProfile) => void;
  onCancel?: () => void;
}

function pillCls(active: boolean): string {
  return [
    'px-3 py-2 rounded-full border text-sm font-semibold transition-colors duration-150 cursor-pointer',
    active
      ? 'bg-amber text-white border-amber shadow-sm shadow-amber/20'
      : 'bg-parchment text-espresso border-smoke hover:bg-smoke',
  ].join(' ');
}

function chipCls(active: boolean): string {
  return [
    'px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors duration-150 cursor-pointer',
    active
      ? 'bg-clay text-white border-clay shadow-sm shadow-clay/20'
      : 'bg-white text-flint border-smoke hover:border-clay/30 hover:text-espresso',
  ].join(' ');
}

export const TravelProfileForm = ({
  token,
  profile,
  onSubmitProfile,
  onSuccess,
  onCancel,
}: TravelProfileFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TravelProfileFormInput, unknown, TravelProfileFormData>({
    resolver: zodResolver(travelProfileSchema),
    defaultValues: {
      travel_style: profile?.travel_style ?? 'relaxed',
      budget_range: profile?.budget_range ?? 'mid_range',
      interests: profile?.interests ?? [],
      group_size_min: profile?.group_size_min ?? 1,
      group_size_max: profile?.group_size_max ?? 4,
      is_discoverable: profile?.is_discoverable ?? true,
    },
  });

  const selectedStyle     = useWatch({ control, name: 'travel_style' });
  const selectedBudget    = useWatch({ control, name: 'budget_range' });
  const selectedInterests = useWatch({ control, name: 'interests' });
  const isDiscoverable    = useWatch({ control, name: 'is_discoverable' });
  const groupSizeMin      = useWatch({ control, name: 'group_size_min' });
  const groupSizeMax      = useWatch({ control, name: 'group_size_max' });
  const normalizedGroupSizeMin = typeof groupSizeMin === 'number' ? groupSizeMin : Number(groupSizeMin ?? profile?.group_size_min ?? 1);
  const normalizedGroupSizeMax = typeof groupSizeMax === 'number' ? groupSizeMax : Number(groupSizeMax ?? profile?.group_size_max ?? 4);

  const completeness = getProfileCompleteness({
    id: profile?.id ?? 0,
    user_id: profile?.user_id ?? 0,
    travel_style: selectedStyle,
    budget_range: selectedBudget,
    interests: selectedInterests,
    group_size_min: normalizedGroupSizeMin,
    group_size_max: normalizedGroupSizeMax,
    is_discoverable: isDiscoverable,
  });

  const toggleInterest = (interest: string) => {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];
    setValue('interests', next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit: SubmitHandler<TravelProfileFormData> = async (data) => {
    try {
      const saveProfile =
        onSubmitProfile ??
        ((payload: TravelProfilePayload) => upsertProfile(token, payload));
      const payload: TravelProfilePayload = {
        travel_style: data.travel_style,
        budget_range: data.budget_range,
        interests: data.interests,
        group_size_min: data.group_size_min,
        group_size_max: data.group_size_max,
        is_discoverable: data.is_discoverable,
      };
      const savedProfile = await saveProfile(payload);
      onSuccess?.(savedProfile);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to save profile. Please try again.',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.28, duration: 0.52 }}
      className="w-full max-w-2xl bg-white rounded-2xl border border-smoke/60 shadow-sm p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-espresso tracking-tight">
          Matching Profile
        </h2>
        <p className="text-sm text-flint mt-1">
          Tell us how you like to travel so we can find better trip matches.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-smoke bg-parchment/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-flint">Profile quality</p>
            <p className="text-base font-bold text-espresso mt-1">{completeness.score}% complete</p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-white border border-smoke text-xs font-bold text-flint">
            {completeness.completed}/{completeness.total} signals ready
          </span>
        </div>
        <div className="h-2 rounded-full bg-white border border-smoke overflow-hidden">
          <div className="h-full rounded-full bg-amber" style={{ width: `${completeness.score}%` }} />
        </div>
        {completeness.prompts.length > 0 && (
          <div className="space-y-2 text-sm text-flint">
            {completeness.prompts.map((prompt) => (
              <p key={prompt}>{prompt}</p>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <FormField id="tpf-travel-style" label="Travel style" error={errors.travel_style?.message}>
          <div id="tpf-travel-style" className="flex flex-wrap gap-2">
            {TRAVEL_STYLE_OPTIONS.map(({ value, label }) => (
              <label key={value} className={pillCls(selectedStyle === value)}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register('travel_style')}
                />
                {label}
              </label>
            ))}
          </div>
        </FormField>

        <FormField id="tpf-budget-range" label="Budget range" error={errors.budget_range?.message}>
          <div id="tpf-budget-range" className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map(({ value, label }) => (
              <label key={value} className={pillCls(selectedBudget === value)}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register('budget_range')}
                />
                {label}
              </label>
            ))}
          </div>
        </FormField>

        <FormField id="tpf-interests" label="Interests" error={errors.interests?.message}>
          <div id="tpf-interests" className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={chipCls(active)}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <FormField id="tpf-group-size-min" label="Minimum group size" error={errors.group_size_min?.message}>
            <input
              id="tpf-group-size-min"
              type="number"
              min="1"
              className={inputCls(!!errors.group_size_min)}
              {...register('group_size_min')}
            />
          </FormField>

          <FormField id="tpf-group-size-max" label="Maximum group size" error={errors.group_size_max?.message}>
            <input
              id="tpf-group-size-max"
              type="number"
              min="1"
              className={inputCls(!!errors.group_size_max)}
              {...register('group_size_max')}
            />
          </FormField>
        </div>

        <FormField
          id="tpf-discoverable"
          label="Discoverability"
          hint="Let other travellers find your trips"
          error={errors.is_discoverable?.message}
        >
          <button
            id="tpf-discoverable"
            type="button"
            role="switch"
            aria-checked={isDiscoverable}
            onClick={() =>
              setValue('is_discoverable', !isDiscoverable, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            className={[
              'w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors duration-150 cursor-pointer',
              isDiscoverable
                ? 'bg-olive/10 border-olive/30 text-espresso'
                : 'bg-parchment border-smoke text-flint',
            ].join(' ')}
          >
            <div className="text-left">
              <p className="text-sm font-semibold">
                {isDiscoverable ? 'Visible to matching' : 'Hidden from matching'}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {isDiscoverable
                  ? 'Your future trips can appear in candidate searches.'
                  : 'Your trips will be excluded from candidate searches.'}
              </p>
            </div>

            <span
              className={[
                'relative inline-flex h-7 w-12 rounded-full transition-colors duration-200',
                isDiscoverable ? 'bg-olive' : 'bg-smoke',
              ].join(' ')}
            >
              <motion.span
                layout
                className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm"
                animate={{ x: isDiscoverable ? 20 : 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            </span>
          </button>
        </FormField>

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
            {isSubmitting ? 'Saving…' : 'Save Profile'}
          </motion.button>

          {onCancel ? (
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
          ) : null}
        </div>
      </form>
    </motion.div>
  );
};
