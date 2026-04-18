import { motion } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

export type AppView = 'dashboard' | 'trips' | 'explore' | 'matching' | 'profile';

interface NavTab {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

interface AppShellProps {
  view: AppView;
  onViewChange: (v: AppView, tripId?: number) => void;
  userEmail: string;
  onLogout: () => void;
  children: React.ReactNode;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

interface IconProps { className?: string; }

const PlaneIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

const TripsIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ExploreIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
  </svg>
);

const CompanionsIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM13.5 10a2 2 0 100-4 2 2 0 000 4z" />
    <path d="M2.5 15.5a4 4 0 018 0v.5h-8v-.5zM10.5 16v-.5a3.5 3.5 0 014.915-3.196A3.5 3.5 0 0117.5 15.5v.5h-7z" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: <DashboardIcon />  },
  { id: 'trips',     label: 'My Trips',   icon: <TripsIcon />      },
  { id: 'explore',   label: 'Explore',    icon: <ExploreIcon />    },
  { id: 'matching',  label: 'Companions', icon: <CompanionsIcon /> },
  { id: 'profile',   label: 'Profile',    icon: <ProfileIcon />    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const AppShell = ({
  view,
  onViewChange,
  userEmail,
  onLogout,
  children,
}: AppShellProps) => (
  <div className="min-h-screen bg-ivory font-sans">

    {/* ── Top Navbar ── */}
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-smoke">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo — group enables coordinated hover across icon + wordmark */}
        <div className="group flex items-center gap-2 select-none flex-shrink-0 cursor-default">
          <PlaneIcon className="w-4 h-4 text-clay group-hover:text-amber transition-colors duration-300" />
          <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.03em] font-display text-espresso group-hover:text-amber transition-colors duration-300">
            Way<span className="text-clay group-hover:text-amber transition-colors duration-300">point</span>
          </span>
        </div>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-1 bg-parchment rounded-full p-1">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className="relative px-2.5 sm:px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 cursor-pointer"
            >
              {/* Animated sliding pill */}
              {view === tab.id && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 bg-espresso rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${
                  view === tab.id ? 'text-white' : 'text-flint hover:text-espresso'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* User + Sign out */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span
            className="hidden sm:block text-sm text-muted font-normal truncate max-w-[180px]"
            title={userEmail}
          >
            {userEmail}
          </span>
          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-flint border border-smoke
                       hover:border-espresso hover:text-espresso transition-colors duration-200 cursor-pointer"
          >
            Sign out
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
