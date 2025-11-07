
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Court } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { ICONS } from '../constants';

const CourtCard: React.FC<{ court: Court }> = ({ court }) => (
    <Card className="flex flex-col">
        <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-primary">{court.sport === 'Pádel' ? ICONS.PADEL : ICONS.TENNIS}</span>
                <h3 className="text-lg font-bold">{court.name}</h3>
            </div>
            <p className="text-sm text-muted mb-3">{court.sport}</p>
            <div className="flex flex-wrap gap-2">
                {court.features.map(feature => (
                    <span key={feature} className="text-xs bg-teal-100 text-primary font-semibold px-2 py-1 rounded-full">{feature}</span>
                ))}
            </div>
        </div>
        <div className="mt-4 pt-4 border-t flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast.error('Función no implementada.')}>Editar</Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => toast.error('Función no implementada.')}>Eliminar</Button>
        </div>
    </Card>
);

const AdminCourtsPage: React.FC = () => {
    const { user } = useAuth();
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if(user?.clubId) {
            apiService.getCourtsByClub(user.clubId)
                .then(setCourts)
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Pistas</h1>
                <Button onClick={() => setIsModalOpen(true)}>Añadir Pista</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map(court => (
                    <CourtCard key={court.id} court={court} />
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir Nueva Pista">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.error("Función no implementada."); setIsModalOpen(false); }}>
                    <Input label="Nombre de la Pista" placeholder="Ej: Pista Central" required/>
                    <Input label="Deporte" placeholder="Ej: Pádel" required/>
                    <Input label="Características" placeholder="Ej: Cubierta, LED (separado por comas)"/>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Pista</Button>
                    </div>
                </form>
            </Modal>

        </motion.div>
    );
};

export default AdminCourtsPage;
