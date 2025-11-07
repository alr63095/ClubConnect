import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await auth.register(name, email, password);
            toast.success('¡Registro completado! Bienvenido a ClubConnect.');
            // La navegación ahora es gestionada por App.tsx, que redirigirá al usuario
            // a la página principal al detectar el nuevo estado de 'user'.
        } catch (error: any) {
            toast.error(error.message || 'Error en el registro. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center py-12"
        >
            <Card className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Crear una Cuenta</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <Input 
                        label="Nombre completo" 
                        id="name" 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Juan Pérez"
                    />
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
                        Registrarse
                    </Button>
                </form>
                <p className="text-center text-sm text-muted mt-6">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                        Inicia sesión aquí
                    </Link>
                </p>
            </Card>
        </motion.div>
    );
};

export default RegisterPage;