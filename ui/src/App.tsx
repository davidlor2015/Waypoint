// src/App.tsx
import { useState, useEffect, lazy, Suspense } from "react";
import { LandingPage } from "./features/landing";
import { LoginPage } from "./features/auth/LoginPage";
import { getMe, type UserProfile } from "./shared/api/auth";
import { getTrips, type Trip } from "./shared/api/trips";
import { track } from "./shared/analytics";
import { AppShell, type AppView } from "./app/AppShell";

const TripList = lazy(() => import('./features/trips/TripList').then((m) => ({ default: m.TripList })));
const CreateTripForm = lazy(() => import('./features/trips/CreateTripForm').then((m) => ({ default: m.CreateTripForm })));
const Dashboard = lazy(() => import('./features/dashboard').then((m) => ({ default: m.Dashboard })));
const MatchingPage = lazy(() => import('./features/profile').then((m) => ({ default: m.MatchingPage })));
const ProfilePage = lazy(() => import('./features/profile').then((m) => ({ default: m.ProfilePage })));
const ExplorePage = lazy(() => import('./features/explore').then((m) => ({ default: m.ExplorePage })));

// ── Auth storage ──────────────────────────────────────────────────────────────

const TOKEN_KEY = "access_token";
const USER_KEY  = "waypoint_user";

function isUserProfile(value: unknown): value is UserProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).email === "string"
  );
}

function readStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isUserProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}


type View = AppView;

function App() {
  const [view, setView]           = useState<View>("trips");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [prefillDestination, setPrefillDestination] = useState<string | null>(null);
  const [authMode, setAuthMode]   = useState<"login" | "register" | null>(null);
  const [trips, setTrips]         = useState<Trip[]>([]);

  // Restored synchronously from localStorage — no loading flash for returning users.
  const [user,  setUser]  = useState<UserProfile | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  // Derived: true when we have a token but no user yet (first login, cleared cache).
  // Avoids calling setState synchronously inside an effect.
  const loading = Boolean(token && !user);


  useEffect(() => {
    if (!token) return;

    if (user) {
      // Optimistic: app is already visible. Silently revalidate in the background
      // and refresh the cached profile. If the token is no longer valid, log out.
      getMe(token)
        .then((fresh) => {
          setUser(fresh);
          localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        });
      return;
    }

    // No cached user — must fetch before rendering (post-login or cleared cache).
    // `loading` is already true (derived above) so no setState call needed here.
    getMe(token)
      .then((userData) => {
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      });

  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omits `user`: this effect should only re-run when the token
  // changes (login / logout), not each time the background refresh updates user.

  useEffect(() => {
    if (token && user) {
      getTrips(token).then(setTrips).catch(console.error);
    }
  }, [token, user]);

  const handleLoginSuccess = (newToken: string) => setToken(newToken);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const switchView = (v: View) => {
    track({ name: "view_changed", props: { from: view, to: v } });
    setView(v);
    setShowCreateForm(false);
    setPrefillDestination(null);
  };

  const handlePlanTrip = (destination: string) => {
    track({ name: "plan_trip_clicked", props: { source_view: view, destination } });
    setPrefillDestination(destination);
    setView("trips");
    setShowCreateForm(true);
  };


  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory font-sans text-flint text-sm">
        Loading…
      </div>
    );

  if (user) {
    return (
      <AppShell
        view={view}
        onViewChange={switchView}
        userEmail={user.email}
        onLogout={handleLogout}
      >
        <Suspense fallback={<div className="text-sm text-flint p-4">Loading section…</div>}>
          {view === "dashboard" && <Dashboard trips={trips} />}
          {view === "explore"   && <ExplorePage token={token!} onPlanTrip={handlePlanTrip} />}
          {view === "matching"  && <MatchingPage token={token!} trips={trips} />}
          {view === "profile"   && <ProfilePage trips={trips} userEmail={user.email} />}

          {view === "trips" &&
            (showCreateForm ? (
              <CreateTripForm
                token={token!}
                defaultDestination={prefillDestination ?? undefined}
                onSuccess={(newTrip) => {
                  setTrips((prev) => [...prev, newTrip]);
                  setShowCreateForm(false);
                  setPrefillDestination(null);
                }}
                onCancel={() => {
                  setShowCreateForm(false);
                  setPrefillDestination(null);
                }}
              />
            ) : (
              <TripList
                token={token!}
                onCreateClick={() => setShowCreateForm(true)}
              />
            ))}
        </Suspense>
      </AppShell>
    );
  }

  if (authMode !== null) {
    return (
      <LoginPage
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setAuthMode(null)}
      />
    );
  }

  return (
    <LandingPage
      onGetStarted={() => setAuthMode("register")}
      onSignIn={() => setAuthMode("login")}
    />
  );
}

export default App;
