
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
import ClubSelectionPage from './pages/ClubSelectionPage';
import ForumPage from './pages/ForumPage';
import NotificationManager from './components/NotificationManager';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading, selectedClubId } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'ADMIN' && user.clubIds && user.clubIds.length > 1 && !selectedClubId) {
      return <Navigate to="/select-club" replace />;
  }
  
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'PLAYER') return <Navigate to="/" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
    const { user, loading, selectedClubId } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    const getInitialRedirect = () => {
        if (!user) return <HomePage />;

        switch(user.role) {
            case 'ADMIN':
                if (user.clubIds && user.clubIds.length > 1 && !selectedClubId) {
                    return <Navigate to="/select-club" />;
                }
                return <Navigate to="/admin/dashboard" />;
            case 'SUPER_ADMIN':
                return <Navigate to="/superadmin" />;
            case 'PLAYER':
            default:
                return <HomePage />;
        }
    }

    return (
        <Layout>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />

                {/* Main Route */}
                <Route path="/" element={getInitialRedirect()} />
                
                {/* Player Routes */}
                <Route path="/home" element={<ProtectedRoute roles={['PLAYER']}><HomePage /></ProtectedRoute>} />
                <Route path="/bookings" element={<ProtectedRoute roles={['PLAYER']}><PlayerBookingsPage /></ProtectedRoute>} />
                <Route path="/forum" element={<ProtectedRoute roles={['PLAYER']}><ForumPage /></ProtectedRoute>} />

                {/* Common Protected Routes */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/select-club" element={<ProtectedRoute roles={['ADMIN']}><ClubSelectionPage /></ProtectedRoute>} />
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
            <NotificationManager />
            <AppRoutes />
            <Toaster position="bottom-right" />
        </Router>
    </AuthProvider>
  );
};

export default App;
