import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlayerBookingsPage from './pages/PlayerBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCourtsPage from './pages/AdminCourtsPage';
import ProfilePage from './pages/ProfilePage';
import SuperAdminPage from './pages/SuperAdminPage';
import Spinner from './components/ui/Spinner';

interface ProtectedRouteProps {
  // Fix: Changed `JSX.Element` to `React.ReactElement` to resolve "Cannot find namespace 'JSX'" error.
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && !roles.includes(user.role)) {
    // Redirect to a relevant page based on role if they try to access a wrong page
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'PLAYER') return <Navigate to="/" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    return (
        <Layout>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />

                {/* Player Routes */}
                <Route path="/" element={
                    user?.role === 'ADMIN' ? <Navigate to="/admin/dashboard" /> :
                    user?.role === 'SUPER_ADMIN' ? <Navigate to="/superadmin" /> :
                    <HomePage />
                } />
                <Route path="/bookings" element={<ProtectedRoute roles={['PLAYER']}><PlayerBookingsPage /></ProtectedRoute>} />

                {/* Common Protected Routes */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/courts" element={<ProtectedRoute roles={['ADMIN']}><AdminCourtsPage /></ProtectedRoute>} />

                 {/* Super Admin Routes */}
                 <Route path="/superadmin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminPage /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
}

const App = () => {
  return (
    <AuthProvider>
        <Router>
            <AppRoutes />
            <Toaster position="bottom-right" />
        </Router>
    </AuthProvider>
  );
};

export default App;