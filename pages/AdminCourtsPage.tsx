import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Court } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { eachMinuteOfInterval, set, format } from 'date-fns';

const CourtForm: React.FC<{
    court?: Court | null;
    clubId: string;
    existingSports: string[];
    onSave: (newSport?: string) => void;
    onClose: () => void;
// Fix: Destructure `existingSports` from props.
}> = ({ court, clubId, existingSports, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: court?.name || '',
        sport: court?.sport || '',
        newSport: '',
        features: court?.features.join(', ') || '',
        openingTime: court?.openingTime || '09:00',
        closingTime: court?.closingTime || '23:00',
        defaultPrice: court?.defaultPrice || 10,
        slotPrices: court?.slotPrices || [],
    });
    const [isSaving, setIsSaving] = useState(false);

    const timeSlots = useMemo(() => {
        try {
            const [openH, openM] = formData.openingTime.split(':').map(Number);
            const [closeH, closeM] = formData.closingTime.split(':').map(Number);
            const today = new Date();
            const start = set(today, { hours: openH, minutes: openM, seconds: 0, milliseconds: 0 });
            const end = set(today, { hours: closeH, minutes: closeM, seconds: 0, milliseconds: 0 });
            
            if (start >= end) return [];

            const intervals = eachMinuteOfInterval({ start, end }, { step: 30 });
            if (intervals.length > 0) intervals.pop();

            return intervals.map(date => format(date, 'HH:mm'));
        } catch (error) {
            return [];
        }
    }, [formData.openingTime, formData.closingTime]);

    const handleSlotPriceChange = (time: string, priceStr: string) => {
        const price = parseFloat(priceStr);
        setFormData(prev => {
            const newSlotPrices = [...prev.slotPrices];
            const index = newSlotPrices.findIndex(p => p.time === time);

            if (isNaN(price) || price === prev.defaultPrice) {
                // Remove if price is invalid or same as default
                if (index !== -1) newSlotPrices.splice(index, 1);
            } else {
                // Add or update price
                if (index !== -1) {
                    newSlotPrices[index] = { time, price };
                } else {
                    newSlotPrices.push({ time, price });
                }
            }
            return { ...prev, slotPrices: newSlotPrices };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalSport = formData.sport === 'new' ? formData.newSport : formData.sport;
            if (!finalSport) {
                toast.error("Por favor, selecciona o añade un deporte.");
                setIsSaving(false);
                return;
            }

            const courtPayload = {
                clubId,
                name: formData.name,
                sport: finalSport,
                features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
                openingTime: formData.openingTime,
                closingTime: formData.closingTime,
                defaultPrice: Number(formData.defaultPrice),
                slotPrices: formData.slotPrices,
            };

            if (court) {
                await apiService.updateCourt({ ...courtPayload, id: court.id });
                toast.success('Pista actualizada correctamente.');
            } else {
                await apiService.createCourt(courtPayload);
                toast.success('Pista creada correctamente.');
            }
            onSave(formData.sport === 'new' ? formData.newSport : undefined);
        } catch (error) {
            toast.error('No se pudo guardar la pista.');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <Input label="Nombre de la pista" name="name" value={formData.name} onChange={handleChange} required />
            
            <div>
                <label htmlFor="sport" className="block text-sm font-medium text-muted mb-1">Deporte</label>
                <select name="sport" id="sport" value={formData.sport} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text">
                    <option value="">Selecciona un deporte</option>
                    {existingSports.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="new">Añadir nuevo deporte...</option>
                </select>
                {formData.sport === 'new' && (
                    <Input name="newSport" value={formData.newSport} onChange={handleChange} placeholder="Nombre del nuevo deporte" className="mt-2" required />
                )}
            </div>

            <Input label="Características (separadas por comas)" name="features" value={formData.features} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Hora de apertura" name="openingTime" type="time" value={formData.openingTime} onChange={handleChange} required step="1800" />
                <Input label="Hora de cierre" name="closingTime" type="time" value={formData.closingTime} onChange={handleChange} required step="1800"/>
            </div>
            <Input label="Precio por defecto (€/30min)" name="defaultPrice" type="number" value={formData.defaultPrice} onChange={handleChange} required min="0" step="0.5"/>
            
            <details className="pt-2">
                <summary className="cursor-pointer text-primary font-semibold">Precios por Franja Horaria (Opcional)</summary>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border p-4 rounded-md bg-slate-50">
                    {timeSlots.map(time => (
                         <div key={time} className="grid grid-cols-2 items-center gap-2">
                            <label htmlFor={`price-${time}`} className="text-sm text-muted">{time}</label>
                            <Input
                                id={`price-${time}`}
                                type="number"
                                placeholder={`${formData.defaultPrice}€`}
                                value={formData.slotPrices.find(p => p.time === time)?.price || ''}
                                onChange={(e) => handleSlotPriceChange(time, e.target.value)}
                                min="0" step="0.5"
                            />
                        </div>
                    ))}
                </div>
            </details>

            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-surface py-2">
                <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                <Button type="submit" isLoading={isSaving}>{court ? 'Guardar Cambios' : 'Crear Pista'}</Button>
            </div>
        </form>
    );
};


const AdminCourtsPage: React.FC = () => {
    const { selectedClubId } = useAuth();
    const [courts, setCourts] = useState<Court[]>([]);
    const [clubSports, setClubSports] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
    const [courtToDelete, setCourtToDelete] = useState<Court | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        if (selectedClubId) {
            setLoading(true);
            try {
                const clubData = await apiService.getClubById(selectedClubId);
                const courtsData = await apiService.getCourtsByClub(selectedClubId);
                setCourts(courtsData);
                setClubSports(clubData.sports);
            } catch (error) {
                toast.error('No se pudieron cargar los datos de las pistas.');
            } finally {
                setLoading(false);
            }
        }
    }, [selectedClubId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddCourt = () => {
        setSelectedCourt(null);
        setIsModalOpen(true);
    };

    const handleEditCourt = (court: Court) => {
        setSelectedCourt(court);
        setIsModalOpen(true);
    };
    
    const openDeleteModal = (court: Court) => {
        setCourtToDelete(court);
    }
    
    const confirmDelete = async () => {
        if(!courtToDelete) return;
        setIsDeleting(true);
        try {
            await apiService.deleteCourt(courtToDelete.id);
            toast.success('Pista eliminada correctamente.');
            fetchData();
        } catch(error) {
            toast.error('No se pudo eliminar la pista.');
        } finally {
            setIsDeleting(false);
            setCourtToDelete(null);
        }
    }

    const handleSave = (newSport?: string) => {
        setIsModalOpen(false);
        setSelectedCourt(null);
        if (newSport && !clubSports.includes(newSport)) {
            setClubSports(prev => [...prev, newSport]);
        }
        fetchData();
    };
    
    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Pistas</h1>
                <Button onClick={handleAddCourt}>Añadir Pista</Button>
            </div>
            {courts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courts.map(court => (
                        <Card key={court.id}>
                            <h2 className="text-xl font-bold">{court.name}</h2>
                            <p className="text-primary font-semibold">{court.sport}</p>
                            <p className="text-sm text-muted mt-2">{court.features.join(' • ')}</p>
                            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEditCourt(court)}>Editar</Button>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => openDeleteModal(court)}>Eliminar</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <p className="text-muted">No hay pistas creadas para este club.</p>
                </Card>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCourt ? 'Editar Pista' : 'Añadir Nueva Pista'}
            >
                {selectedClubId && (
                     <CourtForm
                        court={selectedCourt}
                        clubId={selectedClubId}
                        existingSports={clubSports}
                        onSave={handleSave}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </Modal>

            <Modal
                isOpen={!!courtToDelete}
                onClose={() => setCourtToDelete(null)}
                title="Confirmar Eliminación"
            >
                {courtToDelete && (
                    <div>
                        <p>¿Estás seguro de que quieres eliminar la pista <strong>{courtToDelete.name}</strong>?</p>
                        <p className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md mt-4">
                            <strong>Atención:</strong> Todas las reservas futuras para esta pista serán canceladas. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setCourtToDelete(null)}>Cancelar</Button>
                            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
                                Sí, Eliminar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

        </motion.div>
    );
};

export default AdminCourtsPage;