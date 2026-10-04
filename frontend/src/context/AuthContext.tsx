import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, timezone?: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<number>;
  verifyPhoneOtp: (phone: string, otp: string, name?: string, email?: string, password?: string) => Promise<any>;
  loginWithGoogle: (credential: string) => Promise<void>;
  linkGoogle: (credential: string) => Promise<void>;
  linkPhone: (phone: string, otp: string) => Promise<void>;
  unlinkProvider: (provider: string) => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string; timezone?: string }) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;
  removeAvatar: () => Promise<User>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPass: string) => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('habitflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('habitflow_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      localStorage.setItem('habitflow_user', JSON.stringify(currentUser));
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await refreshUser();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const saveAuthSession = (accessToken: string, authUser: User) => {
    setToken(accessToken);
    setUser(authUser);
    localStorage.setItem('habitflow_token', accessToken);
    localStorage.setItem('habitflow_user', JSON.stringify(authUser));
  };

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    saveAuthSession(data.access_token, data.user);
  };

  const register = async (name: string, email: string, pass: string, timezone?: string) => {
    const data = await authService.register(name, email, pass, timezone);
    saveAuthSession(data.access_token, data.user);
  };

  const sendPhoneOtp = async (phone: string): Promise<number> => {
    const data = await authService.sendPhoneOtp(phone);
    return data.expires_in;
  };

  const verifyPhoneOtp = async (phone: string, otp: string, name?: string, email?: string, password?: string) => {
    const data = await authService.verifyPhoneOtp(phone, otp, name, email, password);
    if (data.access_token && data.user) {
      saveAuthSession(data.access_token, data.user);
    }
    return data;
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await authService.loginWithGoogle(credential);
    saveAuthSession(data.access_token, data.user);
  };

  const linkGoogle = async (credential: string) => {
    const updatedUser = await authService.linkGoogle(credential);
    setUser(updatedUser);
    localStorage.setItem('habitflow_user', JSON.stringify(updatedUser));
  };

  const linkPhone = async (phone: string, otp: string) => {
    const updatedUser = await authService.linkPhone(phone, otp);
    setUser(updatedUser);
    localStorage.setItem('habitflow_user', JSON.stringify(updatedUser));
  };

  const unlinkProvider = async (provider: string) => {
    const res = await authService.unlinkProvider(provider);
    setUser(res.user);
    localStorage.setItem('habitflow_user', JSON.stringify(res.user));
  };

  const updateProfile = async (data: { name?: string; avatar?: string; timezone?: string }): Promise<User> => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    localStorage.setItem('habitflow_user', JSON.stringify(updated));
    return updated;
  };

  const uploadAvatar = async (file: File): Promise<User> => {
    const updated = await authService.uploadAvatar(file);
    setUser(updated);
    localStorage.setItem('habitflow_user', JSON.stringify(updated));
    return updated;
  };

  const removeAvatar = async (): Promise<User> => {
    const updated = await authService.deleteAvatar();
    setUser(updated);
    localStorage.setItem('habitflow_user', JSON.stringify(updated));
    return updated;
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    await authService.changePassword(currentPass, newPass);
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await authService.forgotPassword(email);
    return res.message;
  };

  const resetPassword = async (email: string, otp: string, newPass: string) => {
    await authService.resetPassword(email, otp, newPass);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('habitflow_token');
    localStorage.removeItem('habitflow_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithGoogle,
        linkGoogle,
        linkPhone,
        unlinkProvider,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        changePassword,
        forgotPassword,
        resetPassword,
        setUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
