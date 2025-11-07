
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading spinner
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Perfil actualizado (simulación).');
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
                <img src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-24 h-24 rounded-full" />
                <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-muted">{user.role}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre Completo" id="name" defaultValue={user.name} />
                <Input label="Email" id="email" type="email" defaultValue={user.email} />
            </div>

            <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Cambiar Contraseña</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nueva Contraseña" id="new_password" type="password" placeholder="••••••••"/>
                    <Input label="Confirmar Contraseña" id="confirm_password" type="password" placeholder="••••••••"/>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit">Guardar Cambios</Button>
            </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default ProfilePage;
