import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types/user';
import { authApi, NormalizedUser, ApiError } from '@/lib/api/authApi';
import { userApi } from '@/lib/api/userApi';
import { USER_KEY } from '@/lib/api/config';

// Auth context for managing user authentication state

// Re-export the user type from authApi for consistency
export type AuthUser = NormalizedUser;

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedUser = authApi.getStoredUser();
    if (storedUser && authApi.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedUser = await authApi.login({ email, password });
      setUser(normalizedUser);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.register({ email, password, fullName, role });
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmNewPassword });
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.forgotPassword({ email });
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const profile = await userApi.getCurrentProfile();
      const updatedUser: AuthUser = {
        id: String(profile.id),
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        avatar: profile.avatarUrl,
        phone: profile.phoneNumber,
      };
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        changePassword,
        forgotPassword,
        refreshUser,
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
