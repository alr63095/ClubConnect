
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiService } from '../services/apiService';
import { ICONS } from '../constants';

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [allSports, setAllSports] = useState<string[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [sportPreferences, setSportPreferences] = useState<{ sport: string; skillLevel: number }[]>([]);
  const [newSportToAdd, setNewSportToAdd] = useState('');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (user) {
          setName(user.name);
          setAvatar(user.avatar || '');
          setSportPreferences(user.sportPreferences || []);
      }
      apiService.getAllSports().then(setAllSports);
  }, [user]);

  const availableSports = useMemo(() => {
      const currentSports = sportPreferences.map(p => p.sport);
      return allSports.filter(s => !currentSports.includes(s));
  }, [allSports, sportPreferences]);

  if (!user) {
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setAvatar(base64String);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveAvatar = () => {
      setAvatar('');
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleAddSport = () => {
      if (!newSportToAdd) return;
      setSportPreferences(prev => [...prev, { sport: newSportToAdd, skillLevel: 1 }]);
      setNewSportToAdd('');
  };

  const handleRemoveSport = (sportToRemove: string) => {
      setSportPreferences(prev => prev.filter(p => p.sport !== sportToRemove));
  };

  const handleSkillChange = (sport: string, newLevel: number) => {
      setSportPreferences(prev => prev.map(p => 
          p.sport === sport ? { ...p, skillLevel: newLevel } : p
      ));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        if (newPassword && newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            setIsLoading(false);
            return;
        }
        
        const updatedUser = {
            ...user,
            name,
            sportPreferences,
            avatar, // Save the base64 string
        };

        await apiService.updateUser(updatedUser);
        updateUserProfile(updatedUser); // Update context
        
        if (newPassword) {
            toast.success('Perfil y contraseña actualizados.');
        } else {
            toast.success('Perfil actualizado.');
        }
        setNewPassword('');
        setConfirmPassword('');
    } catch (error) {
        toast.error('Error al actualizar el perfil.');
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-6">Editar Perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Avatar Section */}
        <Card>
            <h2 className="text-xl font-bold mb-4">Tu Imagen</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col space-y-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Subir Foto
                    </Button>
                    {avatar && (
                        <Button type="button" variant="danger" size="sm" onClick={handleRemoveAvatar}>
                            Eliminar Foto
                        </Button>
                    )}
                    <p className="text-xs text-muted">Formatos soportados: JPG, PNG. Se recomienda una imagen cuadrada.</p>
                </div>
            </div>
        </Card>

        {/* Personal Info */}
        <Card>
            <h2 className="text-xl font-bold mb-4">Información Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Nombre Completo" 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                />
                <Input 
                    label="Email" 
                    id="email" 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="bg-gray-100 cursor-not-allowed"
                />
                <div className="md:col-span-2">
                    <p className="text-sm text-muted mt-2">
                        Rol: <span className="font-semibold uppercase">{user.role}</span>
                    </p>
                </div>
            </div>
        </Card>

        {/* Sports & Skills */}
        <Card>
            <h2 className="text-xl font-bold mb-4">Mis Deportes y Nivel</h2>
            <p className="text-sm text-muted mb-4">Define tu nivel del 1 al 5 para encontrar partidas adecuadas a tu habilidad.</p>
            
            <div className="space-y-3 mb-6">
                <AnimatePresence>
                    {sportPreferences.map((pref) => (
                        <motion.div 
                            key={pref.sport}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded-md border"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{pref.sport}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <span className="text-xs text-muted uppercase font-bold">Nivel:</span>
                                    <select 
                                        value={pref.skillLevel}
                                        onChange={(e) => handleSkillChange(pref.sport, Number(e.target.value))}
                                        className="px-2 py-1 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="1">1 - Principiante</option>
                                        <option value="2">2 - Ocasional</option>
                                        <option value="3">3 - Intermedio</option>
                                        <option value="4">4 - Avanzado</option>
                                        <option value="5">5 - Competición</option>
                                    </select>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveSport(pref.sport)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                    title="Eliminar deporte"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {sportPreferences.length === 0 && (
                    <p className="text-center text-muted italic py-4">No has añadido ningún deporte favorito aún.</p>
                )}
            </div>

            {availableSports.length > 0 && (
                <div className="flex gap-2 items-end border-t pt-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-muted mb-1">Añadir Deporte</label>
                        <select 
                            value={newSportToAdd}
                            onChange={(e) => setNewSportToAdd(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text"
                        >
                            <option value="">Selecciona un deporte...</option>
                            {availableSports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <Button type="button" onClick={handleAddSport} disabled={!newSportToAdd}>
                        Añadir
                    </Button>
                </div>
            )}
        </Card>

        {/* Password Change */}
        <Card>
            <h2 className="text-xl font-bold mb-4">Seguridad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Nueva Contraseña" 
                    id="new_password" 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Dejar en blanco para mantener"
                />
                <Input 
                    label="Confirmar Contraseña" 
                    id="confirm_password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                />
            </div>
        </Card>

        <div className="flex justify-end gap-4 sticky bottom-4 z-10">
             <Button type="submit" size="lg" isLoading={isLoading} className="shadow-xl">
                Guardar Cambios
            </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProfilePage;
