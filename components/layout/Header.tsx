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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkClasses = "bg-teal-100 text-primary";
  const inactiveLinkClasses = "text-muted hover:bg-gray-100 hover:text-text";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;
  
  const getMobileNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `block ${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  const closeMenu = () => setIsMobileMenuOpen(false);
  
  const handleLogout = () => {
    closeMenu();
    logout();
  }

  return (
    <header className="bg-surface shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex-shrink-0 flex items-center gap-2 text-2xl font-bold text-primary">
                {ICONS.TENNIS}
                <span>ClubConnect</span>
            </Link>
          </div>
          {/* Desktop Nav */}
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
                            <NavLink to="/forum" className={getNavLinkClass}>
                                {ICONS.USERS} Foro
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
          {/* Mobile Menu Button */}
          <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-text hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                  <span className="sr-only">Abrir menú principal</span>
                  {isMobileMenuOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"></line><line x1="3" x2="21" y1="6" y2="6"></line><line x1="3" x2="21" y1="18" y2="18"></line></svg>
                  )}
              </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div 
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t"
        >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
                <>
                    {user.role === 'PLAYER' && (
                        <>
                            <NavLink to="/home" className={getMobileNavLinkClass} onClick={closeMenu}>
                                {ICONS.DASHBOARD} Reservar
                            </NavLink>
                            <NavLink to="/bookings" className={getMobileNavLinkClass} onClick={closeMenu}>
                                {ICONS.BOOKINGS} Mis Reservas
                            </NavLink>
                            <NavLink to="/forum" className={getMobileNavLinkClass} onClick={closeMenu}>
                                {ICONS.USERS} Foro
                            </NavLink>
                        </>
                    )}
                    {user.role === 'ADMIN' && (
                        <>
                            <div className="px-3 pt-2 pb-1">
                                <ClubSwitcher />
                            </div>
                            <NavLink to="/admin/dashboard" className={getMobileNavLinkClass} onClick={closeMenu}>
                                {ICONS.DASHBOARD} Dashboard
                            </NavLink>
                            <NavLink to="/admin/courts" className={getMobileNavLinkClass} onClick={closeMenu}>
                                {ICONS.COURTS} Pistas
                            </NavLink>
                        </>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                        <NavLink to="/superadmin" className={getMobileNavLinkClass} onClick={closeMenu}>
                            {ICONS.DASHBOARD} Panel SuperAdmin
                        </NavLink>
                    )}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <NavLink to="/profile" className={getMobileNavLinkClass} onClick={closeMenu}>
                            {ICONS.PROFILE} Perfil
                        </NavLink>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleLogout} 
                            className="w-full justify-start text-red-600 hover:bg-red-50 mt-1"
                        >
                            {ICONS.LOGOUT} Salir
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center space-y-2 pt-2">
                    <Button variant="ghost" size="md" className="w-full" onClick={() => { navigate('/login'); closeMenu(); }}>Iniciar Sesión</Button>
                    <Button size="md" className="w-full" onClick={() => { navigate('/register'); closeMenu(); }}>Registrarse</Button>
                </div>
            )}
            </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
};

export default Header;