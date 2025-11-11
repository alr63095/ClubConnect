import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface UserFormProps {
    user?: User | null;
    onSave: () => void;
    onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'PLAYER' as UserRole,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            setFormData({ name: '', email: '', role: 'PLAYER' });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (user) {
                await apiService.updateUser({ ...user, ...formData });
                toast.success("Usuario actualizado correctamente.");
            } else {
                // Password is hardcoded to '1234' for new users in this simulation
                await apiService.createUser(formData);
                toast.success("Usuario creado correctamente. La contraseña es '1234'.");
            }
            onSave();
        } catch (error: any) {
            toast.error(error.message || "No se pudo guardar el usuario.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Nombre Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
            />
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-muted mb-1">Rol de Usuario</label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text"
                >
                    <option value="PLAYER">Jugador (PLAYER)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
            </div>
            {!user && <p className="text-sm text-muted">La contraseña inicial para nuevos usuarios es "1234".</p>}
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                <Button type="submit" isLoading={isSaving}>{user ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
            </div>
        </form>
    );
};

export default UserForm;