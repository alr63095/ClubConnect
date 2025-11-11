import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Modal from '../components/ui/Modal';
import { apiService } from '../services/apiService';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('juan@test.com');
    const [password, setPassword] = useState('1234');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSendingReset, setIsSendingReset] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await auth.login(email, password);
            toast.success('¡Bienvenido de nuevo!');
            
            // Let the main router in App.tsx handle the redirect from the root path
            navigate('/', { replace: true });

        } catch (error) {
            toast.error('Credenciales incorrectas. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingReset(true);
        try {
            await apiService.requestPasswordReset(resetEmail);
            toast.success('Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña.');
            setIsForgotPasswordModalOpen(false);
            setResetEmail('');
        } catch (error) {
            toast.error('Ocurrió un error. Por favor, inténtalo de nuevo.');
        } finally {
            setIsSendingReset(false);
        }
    };


    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center py-12"
        >
            <Card className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
                <p className="text-center text-sm text-muted mb-4">Usa <strong>juan@test.com</strong> / <strong>1234</strong> para jugador, o <strong>ana@test.com</strong> / <strong>1234</strong> para admin.</p>
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
                    <div>
                        <Input 
                            label="Contraseña"
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                         <div className="text-right mt-2">
                            <button
                                type="button"
                                onClick={() => setIsForgotPasswordModalOpen(true)}
                                className="text-sm font-semibold text-primary hover:underline focus:outline-none"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full !mt-6" isLoading={isLoading}>
                        Entrar
                    </Button>
                </form>
                <p className="text-center text-sm text-muted mt-6">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="font-semibold text-primary hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </Card>

            <Modal
                isOpen={isForgotPasswordModalOpen}
                onClose={() => setIsForgotPasswordModalOpen(false)}
                title="Restablecer Contraseña"
            >
                <p className="text-muted text-sm mb-4">
                    Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña.
                </p>
                <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                    <Input
                        label="Email de la cuenta"
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="tu@email.com"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setIsForgotPasswordModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isSendingReset}>
                            Enviar Instrucciones
                        </Button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default LoginPage;