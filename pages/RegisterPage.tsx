import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
// Fix: Import AnimatePresence to be used for animations.
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Spinner from '../components/ui/Spinner';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSports, setLoadingSports] = useState(true);
    const [allSports, setAllSports] = useState<string[]>([]);
    const [preferences, setPreferences] = useState<{ [key: string]: number }>({});

    const auth = useAuth();

    useEffect(() => {
        apiService.getAllSports()
            .then(setAllSports)
            .catch(() => toast.error('No se pudieron cargar los deportes.'))
            .finally(() => setLoadingSports(false));
    }, []);

    const handleSportSelection = (sport: string, isSelected: boolean) => {
        setPreferences(prev => {
            const newPrefs = { ...prev };
            if (isSelected) {
                newPrefs[sport] = 3; // Default skill level
            } else {
                delete newPrefs[sport];
            }
            return newPrefs;
        });
    };

    const handleSkillChange = (sport: string, skillLevel: number) => {
        setPreferences(prev => ({
            ...prev,
            [sport]: skillLevel,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const sportPreferences = Object.entries(preferences).map(([sport, skillLevel]) => ({ sport, skillLevel }));
            await auth.register(name, email, password, sportPreferences);
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

                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-2">Preferencias Deportivas (Opcional)</h3>
                        <p className="text-sm text-muted mb-3">Selecciona los deportes que practicas y tu nivel para recibir sugerencias personalizadas.</p>
                        {loadingSports ? <Spinner /> : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {allSports.map(sport => (
                                    <div key={sport}>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                onChange={(e) => handleSportSelection(sport, e.target.checked)}
                                            />
                                            <span className="font-medium text-text">{sport}</span>
                                        </label>
                                        <AnimatePresence>
                                        {preferences.hasOwnProperty(sport) && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                className="ml-7"
                                            >
                                                <label htmlFor={`skill-${sport}`} className="text-sm text-muted mb-1 block">Tu nivel en {sport}</label>
                                                <select
                                                    id={`skill-${sport}`}
                                                    value={preferences[sport]}
                                                    onChange={(e) => handleSkillChange(sport, parseInt(e.target.value))}
                                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm bg-white text-text text-sm"
                                                >
                                                    <option value="1">1 (Principiante)</option>
                                                    <option value="2">2 (Ocasional)</option>
                                                    <option value="3">3 (Intermedio)</option>
                                                    <option value="4">4 (Avanzado)</option>
                                                    <option value="5">5 (Competición)</option>
                                                </select>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                    <Button type="submit" className="w-full !mt-6" isLoading={isLoading}>
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