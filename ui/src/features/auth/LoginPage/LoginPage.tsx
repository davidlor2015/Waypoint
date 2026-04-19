import React, { useState } from 'react';
import { WaypointLogo } from '../../../shared/ui/WaypointLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register } from '../../../shared/api/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

type Mode = 'login' | 'register';

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
}

const Field = ({ id, label, type, value, onChange, placeholder, autoComplete }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-espresso">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-4 py-3 rounded-xl border border-smoke text-sm bg-white
                 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber
                 transition-all duration-150"
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, initialMode = 'login', onBack }) => {
  const [mode, setMode]                     = useState<Mode>(initialMode);
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const isDisabled =
    isLoading || !email || !password || (mode === 'register' && !confirmPassword);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') await register(email, password);
      const data = await login(email, password);
      localStorage.setItem('access_token', data.access_token);
      onLoginSuccess(data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* ── Full-page canvas with decorative colour blobs ── */
    <div className="min-h-screen relative overflow-hidden bg-ivory flex items-center justify-center p-6 font-sans">

      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[500px] h-[500px] rounded-full bg-clay/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-[420px] h-[420px] rounded-full bg-amber/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 w-[240px] h-[240px] rounded-full bg-amber/10 blur-2xl" />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.55 }}
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-smoke/60 p-8"
      >
        {/* Back link */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-flint hover:text-espresso transition-colors cursor-pointer mb-5"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-7">
          <WaypointLogo variant="mark" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-espresso font-display">
            Way<span className="text-clay">point</span>
          </h1>
          <p className="text-sm text-flint mt-1.5">
            {mode === 'login' ? 'Sign in to manage your trips' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {/* Confirm password — animates in/out on mode switch */}
          <AnimatePresence initial={false}>
            {mode === 'register' && (
              <motion.div
                key="confirm-password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <Field
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                role="alert"
                className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isDisabled ? { scale: 0.97 } : undefined}
            className="mt-1 w-full py-3 rounded-full bg-amber text-white font-bold text-sm
                       shadow-lg shadow-amber/25 hover:bg-amber-dark transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Log in' : 'Sign up'}
          </motion.button>

          {/* Mode toggle */}
          <p className="text-center text-sm text-flint">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-amber font-semibold hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-amber font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </>
            )}
          </p>

        </form>
      </motion.div>
    </div>
  );
};
