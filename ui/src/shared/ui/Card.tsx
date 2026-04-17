

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children:   React.ReactNode;
  padding?:   Padding;
  className?: string;
}


const paddingCls: Record<Padding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

/**
 * The base card surface used across all feature views.
 * White background, single-pixel smoke border, no shadow — intentionally flat
 * per the Desert Editorial design direction (whitespace + restraint over depth).
 */
export const Card = ({ children, padding = 'md', className = '' }: CardProps) => (
  <div className={`bg-white rounded-2xl border border-smoke ${paddingCls[padding]} ${className}`}>
    {children}
  </div>
);
