
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for an existing session
    const checkSession = async () => {
        try {
            const storedUser = sessionStorage.getItem('user');
            if(storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to check session:', error);
        } finally {
            setLoading(false);
        }
    };
    checkSession();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const loggedInUser = await apiService.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      sessionStorage.setItem('user', JSON.stringify(loggedInUser));
    } else {
        throw new Error('Credenciales incorrectas');
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string) => {
    const newUser = await apiService.register(name, email, pass);
    // The service throws an error on failure, which is caught by the component.
    // On success, we get a user object.
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};