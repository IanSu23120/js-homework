import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'travel-planner-auth-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;
    async function loadUser() {
      try {
        const profile = await apiRequest('/api/auth/me/', { token });
        if (active) {
          setUser(profile);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load current user', err);
          logout();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, [token]);

  function saveToken(nextToken) {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function login({ username, password }) {
    setError(null);
    try {
      const data = await apiRequest('/api/token/', {
        method: 'POST',
        body: { username, password },
      });
      saveToken(data.access);
      const profile = await apiRequest('/api/auth/me/', { token: data.access });
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.detail || '登入失敗');
      throw err;
    }
  }

  async function register({ username, email, password }) {
    setError(null);
    try {
      const data = await apiRequest('/api/auth/register/', {
        method: 'POST',
        body: { username, email, password },
      });
      return data;
    } catch (err) {
      setError(err.detail || '註冊失敗');
      throw err;
    }
  }

  function logout() {
    saveToken(null);
    setUser(null);
  }

  function authFetch(path, options = {}) {
    return apiRequest(path, { ...options, token });
  }

  const value = useMemo(
    () => ({ user, token, loading, error, login, logout, register, authFetch }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
