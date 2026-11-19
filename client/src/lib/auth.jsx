import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    api('/auth/me').then((d) => setUser(d.user), () => setUser(null));
  }, []);

  const value = {
    user,
    // Any auth endpoint that answers with { user } and sets the session cookie.
    signIn: async (path, body) => setUser((await api(path, { method: 'POST', body })).user),
    logout: async () => {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
    },
  };
  return <AuthContext value={value}>{children}</AuthContext>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ admin, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <div className="min-h-[60vh]" aria-busy="true" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
