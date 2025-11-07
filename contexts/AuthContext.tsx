
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  selectedClubId: string | null;
  selectClub: (clubId: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
        try {
            const storedUser = sessionStorage.getItem('user');
            if(storedUser) {
                const sessionUser = JSON.parse(storedUser);
                setUser(sessionUser);
                const storedClubId = sessionStorage.getItem('selectedClubId');
                if (storedClubId) {
                    setSelectedClubId(storedClubId);
                } else if (sessionUser.role === 'ADMIN' && sessionUser.clubIds?.length === 1) {
                    // Auto-select if admin only has one club
                    setSelectedClubId(sessionUser.clubIds[0]);
                    sessionStorage.setItem('selectedClubId', sessionUser.clubIds[0]);
                }
            }
        } catch (error) {
            console.error('Failed to check session:', error);
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

  const login = useCallback(async (email: string, pass: string) => {
    const loggedInUser = await apiService.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      sessionStorage.setItem('user', JSON.stringify(loggedInUser));

      if (loggedInUser.role === 'ADMIN' && loggedInUser.clubIds?.length === 1) {
        selectClub(loggedInUser.clubIds[0]);
      } else {
        // Will require user to select a club if they have more than one
        setSelectedClubId(null);
        sessionStorage.removeItem('selectedClubId');
      }
    } else {
        throw new Error('Credenciales incorrectas');
    }
  }, [selectClub]);

  const register = useCallback(async (name: string, email: string, pass: string) => {
    const newUser = await apiService.register(name, email, pass);
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSelectedClubId(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('selectedClubId');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, selectedClubId, selectClub, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
