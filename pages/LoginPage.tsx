
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserRole } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido de vuelta!');
      
      // We need to get the user from the state AFTER login,
      // Since the context update is async, we'll check the email.
      if (email === 'admin@test.com') {
          navigate('/admin/dashboard');
      } else {
          navigate('/');
      }
      
    } catch (error) {
      toast.error('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const setAdminCredentials = () => {
    setEmail('admin@test.com');
    setPassword('admin123');
  }

  const setPlayerCredentials = () => {
    setEmail('player@test.com');
    setPassword('player123');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center"
    >
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
          <Input
            label="Contraseña"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Acceder
          </Button>
        </form>
         <div className="mt-4 text-sm text-center text-muted">
            <p>Datos de prueba:</p>
            <div className="flex justify-center gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={setAdminCredentials}>Usar Admin</Button>
                <Button variant="ghost" size="sm" onClick={setPlayerCredentials}>Usar Jugador</Button>
            </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LoginPage;
