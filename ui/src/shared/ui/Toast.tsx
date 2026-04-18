import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const Toast = ({ message, onDismiss }: ToastProps) => {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, 2000);
    return () => clearTimeout(id);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-espresso text-white text-sm font-semibold shadow-lg pointer-events-none"
          role="status"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
