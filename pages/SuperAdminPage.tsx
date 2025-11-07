import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';

const SuperAdminPage: React.FC = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-bold mb-6">Panel de Super Administrador</h1>
      <Card>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Gestión de Clubs y Administradores</h2>
          <p className="text-muted mt-2">Esta sección está en construcción.</p>
          {/* Future components for managing clubs, admins, etc. would go here */}
        </div>
      </Card>
    </motion.div>
  );
};

export default SuperAdminPage;
