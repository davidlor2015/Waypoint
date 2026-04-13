// src/App.tsx
import { useState, useEffect } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { getMe, type UserProfile } from "./shared/api/auth";
import { TripList } from "./features/trips/TripList";
import { CreateTripForm } from "./features/trips/CreateTripForm";
import { Dashboard } from "./features/dashboard";
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

        {view === "trips" &&
          (showCreateForm ? (
            <CreateTripForm
              token={token!}
              onSuccess={(newTrip) => {
                setTrips((prev) => [...prev, newTrip]);
                setShowCreateForm(false);
              }}
              onCancel={() => setShowCreateForm(false)}
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
