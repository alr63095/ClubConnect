import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ICONS } from '../../constants';
import Button from '../ui/Button';

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
                            <NavLink to="/" className={getNavLinkClass}>
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
