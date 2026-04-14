import { AnimatePresence, motion } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const inputCls = (hasError?: boolean) =>
  [
    'w-full px-4 py-3 rounded-xl border text-sm bg-white',
    'focus:outline-none focus:ring-2 focus:ring-ocean/40 focus:border-ocean',
    'transition-all duration-150',
    hasError ? 'border-coral focus:ring-coral/30 focus:border-coral' : 'border-gray-200',
  ].join(' ');

// ── Component ─────────────────────────────────────────────────────────────────

export const FormField = ({ id, label, hint, error, children }: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-navy">
      {label}
      {hint && <span className="ml-1.5 font-normal text-gray">{hint}</span>}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          key={error}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="alert"
          className="text-xs font-medium text-coral"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);
