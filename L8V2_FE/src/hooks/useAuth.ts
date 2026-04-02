import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  user: AuthUser | null;
}

const decodeUserFromToken = (token: string | null): AuthUser | null => {
  if (!token) return null;
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    const payload = JSON.parse(atob(base64Payload));
    const firstName = payload.firstName || payload.given_name;
    const lastName = payload.lastName || payload.family_name;
    const derivedName = firstName || lastName
      ? [firstName, lastName].filter(Boolean).join(' ').trim()
      : payload.name || payload.email || undefined;

    return {
      id: payload.id,
      email: payload.email,
      firstName,
      lastName,
      name: derivedName,
    };
  } catch {
    return null;
  }
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    loading: true,
    user: null,
  });
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  
  // Update ref when navigate changes
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Check if token is valid (not expired)
  const isTokenValid = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }, []); // No dependencies needed for this function

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && isTokenValid(token)) {
      setAuthState({
        isAuthenticated: true,
        token,
        loading: false,
        user: decodeUserFromToken(token),
      });
    } else {
      // Clear invalid token
      if (token) {
        localStorage.removeItem('token');
      }
      setAuthState({
        isAuthenticated: false,
        token: null,
        loading: false,
        user: null,
      });
    }
  }, []); // Remove isTokenValid dependency since it's stable

  // Login function
  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    setAuthState({
      isAuthenticated: true,
      token,
      loading: false,
      user: decodeUserFromToken(token),
    });
  }, []);

  // Logout function - use ref to avoid dependency issues
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      token: null,
      loading: false,
      user: null,
    });
    navigateRef.current('/login');
  }, []); // No dependencies needed

  // Check authentication on route changes - use ref to avoid dependency issues
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      logout();
      return false;
    }

    if (!isTokenValid(token)) {
      logout();
      return false;
    }

    return true;
  }, [logout, isTokenValid]);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  };
} 