import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthUser } from '../hooks/useAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 