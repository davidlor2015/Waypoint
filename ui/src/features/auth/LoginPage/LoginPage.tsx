import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register } from '../../../shared/api/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
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
    <label htmlFor={id} className="text-sm font-semibold text-navy">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white
                 focus:outline-none focus:ring-2 focus:ring-ocean/40 focus:border-ocean
                 transition-all duration-150"
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode]                     = useState<Mode>('login');
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
    <div className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center p-6 font-sans">

      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[500px] h-[500px] rounded-full bg-ocean/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-[420px] h-[420px] rounded-full bg-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 w-[240px] h-[240px] rounded-full bg-sunny/20 blur-2xl" />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.55 }}
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ocean/10 mb-3">
            <svg viewBox="0 0 20 20" className="w-6 h-6 text-ocean" fill="currentColor" aria-hidden="true">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">
            Travel<span className="text-coral">Planner</span>
          </h1>
          <p className="text-sm text-gray mt-1.5">
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
                className="px-4 py-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-sm font-medium"
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
            className="mt-1 w-full py-3 rounded-full bg-ocean text-white font-bold text-sm
                       shadow-lg shadow-ocean/25 hover:bg-ocean-dark transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Log in' : 'Sign up'}
          </motion.button>

          {/* Mode toggle */}
          <p className="text-center text-sm text-gray">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-ocean font-semibold hover:underline cursor-pointer"
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
                  className="text-ocean font-semibold hover:underline cursor-pointer"
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
