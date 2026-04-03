import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  imageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        setUser(response.data.user);
        localStorage.setItem('l8-auth-token', response.data.token);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('l8-auth-token');
    localStorage.removeItem('l8-platform-choice');
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('l8-auth-token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiService.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
