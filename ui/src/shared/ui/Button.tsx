import { motion } from 'framer-motion';


type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onClick?:   () => void;
  disabled?:  boolean;
  /** Disables the button and signals async activity to assistive tech. */
  busy?:      boolean;
  variant?:   Variant;
  size?:      Size;
  type?:      'button' | 'submit' | 'reset';
  className?: string;
  children:   React.ReactNode;
}


const variantCls: Record<Variant, string> = {
  primary:   'bg-amber text-white shadow-sm shadow-amber/20 hover:bg-amber-dark',
  secondary: 'bg-clay text-white shadow-sm shadow-clay/15 hover:bg-clay-dark',
  ghost:     'border border-smoke text-flint hover:border-espresso hover:text-espresso',
  danger:    'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15',
};

const sizeCls: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-sm',
};


export const Button = ({
  onClick,
  disabled,
  busy,
  variant   = 'primary',
  size      = 'md',
  type      = 'button',
  className = '',
  children,
}: ButtonProps) => {
  const isInert = disabled || busy;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isInert}
      aria-busy={busy}
      whileHover={!isInert ? { scale: 1.03 } : undefined}
      whileTap={!isInert ? { scale: 0.97 } : undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        'transition-colors duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        className,
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
};
