import React, { useState, useEffect } from 'react';
import { Club, User } from '../../types';
import { apiService } from '../../services/apiService';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface ClubFormProps {
    club?: Club | null;
    admins: User[];
    currentAdminId?: string;
    onSave: () => void;
    onClose: () => void;
}

const ClubForm: React.FC<ClubFormProps> = ({ club, admins, currentAdminId, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [sports, setSports] = useState('');
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (club) {
            setName(club.name);
            setSports(club.sports.join(', '));
            setSelectedAdminId(currentAdminId || '');
        } else {
            setName('');
            setSports('');
            setSelectedAdminId('');
        }
    }, [club, currentAdminId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const sportsArray = sports.split(',').map(s => s.trim()).filter(Boolean);
            const clubData = { name, sports: sportsArray };
            
            if (club) {
                await apiService.updateClub({ ...clubData, id: club.id }, selectedAdminId);
                toast.success("Club actualizado correctamente.");
            } else {
                await apiService.createClub(clubData, selectedAdminId);
                toast.success("Club creado correctamente.");
            }
            onSave();
        } catch (error) {
            toast.error("No se pudo guardar el club.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Nombre del Club"
                value={name}
                onChange={e => setName(e.target.value)}
                required
            />
            <Input
                label="Deportes (separados por comas)"
                value={sports}
                onChange={e => setSports(e.target.value)}
                required
            />
            <div>
                <label htmlFor="admin" className="block text-sm font-medium text-muted mb-1">Administrador del Club</label>
                <select
                    id="admin"
                    value={selectedAdminId}
                    onChange={e => setSelectedAdminId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text"
                >
                    <option value="">Sin asignar</option>
                    {admins.map(admin => (
                        <option key={admin.id} value={admin.id}>
                            {admin.name} ({admin.email})
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                <Button type="submit" isLoading={isSaving}>{club ? 'Guardar Cambios' : 'Crear Club'}</Button>
            </div>
        </form>
    );
};

export default ClubForm;