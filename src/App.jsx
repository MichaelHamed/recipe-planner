import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Planner from './pages/Planner';
import Login from './pages/Login';
import Profile from './pages/Profile';

function ProtectedLayout({ user, profile, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data || null);
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🍽️</div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedLayout user={user} profile={profile} onProfileUpdate={setProfile}>
              <Home user={user} profile={profile} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedLayout user={user} profile={profile} onProfileUpdate={setProfile}>
              <Browse user={user} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/planner"
          element={
            <ProtectedLayout user={user} profile={profile} onProfileUpdate={setProfile}>
              <Planner user={user} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedLayout user={user} profile={profile} onProfileUpdate={setProfile}>
              <Profile user={user} profile={profile} onProfileUpdate={setProfile} />
            </ProtectedLayout>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
