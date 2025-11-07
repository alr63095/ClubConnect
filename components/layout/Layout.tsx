
import React from 'react';
import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-surface text-center py-4 border-t">
        <p className="text-sm text-muted">&copy; {new Date().getFullYear()} ClubConnect. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Layout;
