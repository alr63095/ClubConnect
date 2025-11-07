import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ICONS } from '../../constants';
import Button from '../ui/Button';
import { Club } from '../../types';
import { apiService } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';

const ClubSwitcher: React.FC = () => {
    const { user, selectedClubId, selectClub } = useAuth();
    const [userClubs, setUserClubs] = useState<Club[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user?.role === 'ADMIN' && user.clubIds) {
            apiService.getClubsByIds(user.clubIds).then(setUserClubs);
        }
    }, [user]);
    
    const selectedClub = userClubs.find(c => c.id === selectedClubId);
    if (!user || user.role !== 'ADMIN' || !user.clubIds || user.clubIds.length <= 1) {
        return null;
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <span>{selectedClub?.name || 'Seleccionar Club'}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-surface rounded-md shadow-lg z-50 overflow-hidden border"
                    >
                        <ul>
                            {userClubs.map(club => (
                                <li key={club.id}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            selectClub(club.id);
                                            setIsOpen(false);
                                        }}
                                        className={`block px-4 py-2 text-sm ${selectedClubId === club.id ? 'font-bold text-primary bg-teal-50' : 'text-text hover:bg-gray-100'}`}
                                    >
                                        {club.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkClasses = "bg-teal-100 text-primary";
  const inactiveLinkClasses = "text-muted hover:bg-gray-100 hover:text-text";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  return (
    <header className="bg-surface shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-2xl font-bold text-primary">
                {ICONS.TENNIS}
                <span>ClubConnect</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
                <>
                    {user.role === 'PLAYER' && (
                        <>
                            <NavLink to="/home" className={getNavLinkClass}>
                                {ICONS.DASHBOARD} Reservar
                            </NavLink>
                            <NavLink to="/bookings" className={getNavLinkClass}>
                                {ICONS.BOOKINGS} Mis Reservas
                            </NavLink>
                        </>
                    )}
                    {user.role === 'ADMIN' && (
                        <>
                            <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                                {ICONS.DASHBOARD} Dashboard
                            </NavLink>
                            <NavLink to="/admin/courts" className={getNavLinkClass}>
                                {ICONS.COURTS} Pistas
                            </NavLink>
                        </>
                    )}
                     {user.role === 'SUPER_ADMIN' && (
                        <>
                            <NavLink to="/superadmin" className={getNavLinkClass}>
                                {ICONS.DASHBOARD} Panel SuperAdmin
                            </NavLink>
                        </>
                    )}
                    <div className="flex items-center gap-4 ml-4">
                        <ClubSwitcher />
                        <NavLink to="/profile" className={getNavLinkClass}>
                            {ICONS.PROFILE} Perfil
                        </NavLink>
                        <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:bg-red-50">
                            {ICONS.LOGOUT} Salir
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
                    <Button size="sm" onClick={() => navigate('/register')}>Registrarse</Button>
                </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
