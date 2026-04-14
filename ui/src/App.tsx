// src/App.tsx
import { useState, useEffect } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { getMe, type UserProfile } from "./shared/api/auth";
import { TripList } from "./features/trips/TripList";
import { CreateTripForm } from "./features/trips/CreateTripForm";
import { Dashboard } from "./features/dashboard";
import { ProfilePage } from "./features/profile";
import { ExplorePage } from "./features/explore";
import { getTrips, type Trip } from "./shared/api/trips";
import { AppShell, type AppView } from "./app/AppShell";

type View = AppView;

function App() {
  const [view, setView] = useState<View>("trips");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token"),
  );
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [prefillDestination, setPrefillDestination] = useState<string | null>(null);

  const fetchUser = async (accessToken: string) => {
    setLoading(true);
    try {
      const userData = await getMe(accessToken);
      setUser(userData);
    } catch (error) {
      console.error("Token invalid or expired", error);
      localStorage.removeItem("access_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !user) fetchUser(token);
  }, [token, user]);

  useEffect(() => {
    if (token && user) {
      getTrips(token).then(setTrips).catch(console.error);
    }
  }, [token, user]);

  const handleLoginSuccess = (newToken: string) => setToken(newToken);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  const switchView = (v: View) => {
    setView(v);
    setShowCreateForm(false);
    setPrefillDestination(null);
  };

  const handlePlanTrip = (destination: string) => {
    setPrefillDestination(destination);
    setView('trips');
    setShowCreateForm(true);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans text-gray text-sm">
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
        {view === "dashboard" && <Dashboard trips={trips} />}
        {view === "explore"   && <ExplorePage token={token!} onPlanTrip={handlePlanTrip} />}
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
      </AppShell>
    );
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export default App;
