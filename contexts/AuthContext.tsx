
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  selectedClubId: string | null;
  selectClub: (clubId: string) => void;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string, sportPreferences: { sport: string; skillLevel: number; }[]) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
        try {
            const storedUser = sessionStorage.getItem('user');
            // Proactively check for the literal string "undefined" which is invalid JSON and causes a crash.
            if (storedUser && storedUser !== 'undefined') {
                const sessionUser = JSON.parse(storedUser);
                setUser(sessionUser);
                const storedClubId = sessionStorage.getItem('selectedClubId');
                if (storedClubId) {
                    setSelectedClubId(storedClubId);
                } else if (sessionUser.role === 'ADMIN' && sessionUser.clubIds && sessionUser.clubIds.length > 0) {
                    const defaultClubId = sessionUser.clubIds[0];
                    setSelectedClubId(defaultClubId);
                    sessionStorage.setItem('selectedClubId', defaultClubId);
                }
            } else {
                // If storedUser is null or the invalid string "undefined", ensure session is clean.
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('selectedClubId');
            }
        } catch (error) {
            console.error('Failed to parse user from session storage. Clearing session.', error);
            // Clear corrupted data and reset state
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('selectedClubId');
            setUser(null);
            setSelectedClubId(null);
        } finally {
            setLoading(false);
        }
    };
    checkSession();
  }, []);
  
  const selectClub = useCallback((clubId: string) => {
    setSelectedClubId(clubId);
    sessionStorage.setItem('selectedClubId', clubId);
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<User> => {
    const loggedInUser = await apiService.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      sessionStorage.setItem('user', JSON.stringify(loggedInUser));

      if (loggedInUser.role === 'ADMIN' && loggedInUser.clubIds && loggedInUser.clubIds.length > 0) {
        // Auto-select first club for any admin upon login
        selectClub(loggedInUser.clubIds[0]);
      } else {
        setSelectedClubId(null);
        sessionStorage.removeItem('selectedClubId');
      }
      return loggedInUser;
    } else {
        throw new Error('Credenciales incorrectas');
    }
  }, [selectClub]);

  const register = useCallback(async (name: string, email: string, pass: string, sportPreferences: { sport: string; skillLevel: number; }[]) => {
    const newUser = await apiService.register(name, email, pass, sportPreferences);
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSelectedClubId(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('selectedClubId');
  }, []);

  const updateUserProfile = useCallback((updatedUser: User) => {
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, selectedClubId, selectClub, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
