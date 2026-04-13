import { motion } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

export type AppView = 'dashboard' | 'trips';

interface NavTab {
  id: AppView;
  label: string;
  emoji: string;
}

interface AppShellProps {
  view: AppView;
  onViewChange: (v: AppView) => void;
  userEmail: string;
  onLogout: () => void;
  children: React.ReactNode;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'trips',     label: 'My Trips',  emoji: '🗺️' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const AppShell = ({
  view,
  onViewChange,
  userEmail,
  onLogout,
  children,
}: AppShellProps) => (
  <div className="min-h-screen bg-white font-sans">
    {/* ── Top Navbar ── */}
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 select-none flex-shrink-0">
          <span className="text-2xl leading-none">✈️</span>
          <span className="text-lg font-extrabold text-navy tracking-tight">
            Travel<span className="text-coral">Planner</span>
          </span>
        </div>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-1 bg-silver rounded-full p-1">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 cursor-pointer"
            >
              {/* Animated sliding pill */}
              {view === tab.id && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 bg-ocean rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${
                  view === tab.id ? 'text-white' : 'text-gray-500 hover:text-navy'
                }`}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="hidden sm:block text-sm text-gray font-medium truncate max-w-[180px]"
            title={userEmail}
          >
            {userEmail}
          </span>
          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-silver text-navy hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Logout
          </motion.button>
        </div>

      </div>
    </header>

    {/* ── Page Content ── */}
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {children}
    </main>
  </div>
);
