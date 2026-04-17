import { AnimatePresence, motion } from 'framer-motion';


interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}


export const FormField = ({ id, label, hint, error, children }: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium text-espresso">
      {label}
      {hint && <span className="ml-1.5 font-normal text-muted">{hint}</span>}
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
          className="text-xs font-medium text-danger"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);
