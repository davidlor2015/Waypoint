// src/App.tsx

import { useState, useEffect } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { getMe, type UserProfile } from "./shared/api/auth";
import { TripList } from "./features/trips/TripList";
import { CreateTripForm } from "./features/trips/CreateTripForm";
import "./App.css";

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token"),
  );
  const [loading, setLoading] = useState(false);

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
    if (token && !user) {
      fetchUser(token);
    }
  }, [token, user]);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  // loading state
  if (loading) {
    return <div className="app-loading">Loading user profile...</div>;
  }

  if (user) {
    return (
      <div className="app-layout">
        <header className="app-header">
          <span>{user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </header>

        {showCreateForm ? (
          <CreateTripForm
            token={token!}
            onSuccess={() => {
              setShowCreateForm(false);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <TripList
            token={token!}
            onCreateClick={() => setShowCreateForm(true)}
          />
        )}
      </div>
    );
  }

  // logged out state
  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export default App;
