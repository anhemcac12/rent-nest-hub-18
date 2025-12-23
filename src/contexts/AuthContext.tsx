import React, { createContext, useContext, useState } from 'react';
import { Tenant } from '@/types/tenant';
import { mockTenant } from '@/data/mockTenant';

interface AuthContextType {
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Mock auth state - always logged in for dashboard demo
  const [tenant, setTenant] = useState<Tenant | null>(mockTenant);

  const login = () => {
    setTenant(mockTenant);
  };

  const logout = () => {
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        tenant,
        isAuthenticated: !!tenant,
        login,
        logout,
      }}
    >
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
