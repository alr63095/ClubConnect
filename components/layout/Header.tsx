
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ICONS } from '../../constants';
import { UserRole } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { to: "/login", label: "Iniciar Sesión" }
      ];
    }
    if (user.role === UserRole.Admin) {
      return [
        { to: "/admin/dashboard", label: "Dashboard", icon: ICONS.DASHBOARD },
        { to: "/admin/courts", label: "Pistas", icon: ICONS.COURTS },
      ];
    }
    if (user.role === UserRole.Player) {
      return [
        { to: "/", label: "Buscar Pista" },
        { to: "/bookings", label: "Mis Reservas", icon: ICONS.BOOKINGS },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-surface shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-primary">ClubConnect</Link>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive ? 'bg-teal-50 text-primary' : 'text-muted hover:bg-teal-50 hover:text-primary-dark'}`}>{link.icon}{link.label}</NavLink>
              ))}
            </div>
          </nav>
          <div className="hidden md:block">
            {user ? (
              <div className="ml-4 flex items-center md:ml-6 relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 bg-surface rounded-full text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <span className="sr-only">Open user menu</span>
                  {ICONS.PROFILE}
                </button>
                <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="origin-top-right absolute right-0 mt-2 top-full w-48 rounded-md shadow-lg py-1 bg-surface ring-1 ring-black ring-opacity-5"
                  >
                    <div className="px-4 py-2 text-sm text-text border-b">{user.name}</div>
                    <Link to="/profile" onClick={()=>setMenuOpen(false)} className="block px-4 py-2 text-sm text-muted hover:bg-gray-100 w-full text-left flex items-center gap-2">{ICONS.PROFILE} Mi Perfil</Link>
                    <button onClick={handleLogout} className="block px-4 py-2 text-sm text-muted hover:bg-gray-100 w-full text-left flex items-center gap-2">{ICONS.LOGOUT} Cerrar Sesión</button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : (
                <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-dark">Iniciar Sesión</Link>
            )}
          </div>
          <div className="md:hidden">
            {/* Mobile menu button will go here */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
