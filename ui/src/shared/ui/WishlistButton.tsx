import { motion } from 'framer-motion';

interface WishlistButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  className?: string;
}

export const WishlistButton = ({ isSaved, onToggle, className = '' }: WishlistButtonProps) => (
  <motion.button
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    whileHover={{ scale: 1.12 }}
    whileTap={{ scale: 0.85 }}
    aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
    className={`p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm cursor-pointer transition-colors duration-200 ${
      isSaved ? 'text-amber' : 'text-flint hover:text-espresso'
    } ${className}`}
  >
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill={isSaved ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  </motion.button>
);
