import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!api.getToken()) {
      setReady(true);
      return undefined;
    }
    api
      .me()
      .then((data) => {
        if (!ignore) setUser(data.user);
      })
      .catch(() => {
        api.setToken(null);
      })
      .finally(() => {
        if (!ignore) setReady(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(email, password) {
        const data = await api.login(email, password);
        api.setToken(data.token);
        setUser(data.user);
      },
      async register(payload) {
        const data = await api.register(payload);
        api.setToken(data.token);
        setUser(data.user);
      },
      logout() {
        api.setToken(null);
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải nằm trong AuthProvider.');
  }
  return context;
}
