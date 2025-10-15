// ============================================
// components/providers/AuthProvider.tsx
// Provider สำหรับจัดการ Authentication State
// ============================================

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/lib/api';
import { getToken, setToken as saveToken, removeToken } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getToken();
      if (savedToken) {
        try {
          const userData = await api.getCurrentUser(savedToken);
          setUser(userData);
          setTokenState(savedToken);
        } catch (err) {
          removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (authToken: string) => {
    saveToken(authToken);
    const userData = await api.getCurrentUser(authToken);
    setUser(userData);
    setTokenState(authToken);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}