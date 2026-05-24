import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const initialState = {
  user: null, token: null, loading: true,
};

/**
 * Deliberately simple reducer — no error field here.
 * Auth errors are returned directly from login/register as { success, message }
 * so the caller (AuthPage) owns the error display state. Storing errors in
 * context caused extra re-renders that wiped the local error state in AuthPage.
 */
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':    return { user: action.user, token: action.token, loading: false };
    case 'CLEAR_AUTH':  return { user: null, token: null, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...action.payload } };
    default: return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user');
    if (token && user) {
      try { dispatch({ type: 'SET_AUTH', user: JSON.parse(user), token }); }
      catch { dispatch({ type: 'CLEAR_AUTH' }); }
    } else {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  // Forced logout from axios 401 interceptor
  useEffect(() => {
    const handler = () => dispatch({ type: 'CLEAR_AUTH' });
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  /**
   * login — returns { success: true } or { success: false, message: string }.
   * Does NOT dispatch loading state — AuthPage manages its own loading spinner
   * to avoid extra re-renders that would wipe the error message.
   */
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'SET_AUTH', user: data.user, token: data.token });
      return { success: true };
    } catch (err) {
      // Extract the most specific error message available
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Invalid email or password. Please try again.';
      return { success: false, message: msg };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'SET_AUTH', user: data.user, token: data.token });
      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.';
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async (onLogout) => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    dispatch({ type: 'CLEAR_AUTH' });
  }, []);

  const updateUser = useCallback((payload) => {
    dispatch({ type: 'UPDATE_USER', payload });
    const stored = localStorage.getItem('user');
    if (stored) {
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), ...payload }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
