

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
// Fix: Correctly import useAuth from its own module in hooks/useAuth.ts.
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCourtsPage from './pages/AdminCourtsPage';
import PlayerBookingsPage from './pages/PlayerBookingsPage';
import ProfilePage from './pages/ProfilePage';
import { UserRole } from './types';
import { AnimatePresence } from 'framer-motion';

const PrivateRoute: React.FC<{ children: React.ReactNode; roles: UserRole[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a loading spinner
  return user && roles.includes(user.role) ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
    return (
        <Layout>
            <AnimatePresence mode="wait">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/bookings" element={
                        <PrivateRoute roles={[UserRole.Player]}>
                            <PlayerBookingsPage />
                        </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute roles={[UserRole.Player, UserRole.Admin]}>
                            <ProfilePage />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/dashboard" element={
                        <PrivateRoute roles={[UserRole.Admin]}>
                            <AdminDashboardPage />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/courts" element={
                        <PrivateRoute roles={[UserRole.Admin]}>
                            <AdminCourtsPage />
                        </PrivateRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AnimatePresence>
        </Layout>
    );
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
      <Toaster position="top-right" toastOptions={{
          className: 'bg-surface text-text shadow-lg rounded-lg',
          success: {
              className: 'border border-green-500',
              iconTheme: {
                  primary: '#22C55E',
                  secondary: 'white',
              },
          },
          error: {
              className: 'border border-red-500',
              iconTheme: {
                  primary: '#EF4444',
                  secondary: 'white',
              },
          },
      }}/>
    </AuthProvider>
  );
}

export default App;