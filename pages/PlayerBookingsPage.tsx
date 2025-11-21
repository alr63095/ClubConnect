
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { EnrichedBooking } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

const PublishBookingModal: React.FC<{
    booking: EnrichedBooking | null;
    onClose: () => void;
    onPublished: () => void;
}> = ({ booking, onClose, onPublished }) => {
    const [playersNeeded, setPlayersNeeded] = useState(1);
    const [skillLevel, setSkillLevel] = useState(3);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        // Reset form when a new booking is selected
        if (booking) {
            setPlayersNeeded(1);
            setSkillLevel(3);
        }
    }, [booking]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking) return;

        setIsPublishing(true);
        try {
            await apiService.publishBookingToForum(booking.id, playersNeeded, skillLevel);
            toast.success('¡Partida publicada en el foro!');
            onPublished();
        } catch (error) {
            toast.error('No se pudo publicar la partida.');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!booking) return null;

    return (
        <Modal isOpen={!!booking} onClose={onClose} title="Publicar Partida en el Foro">
            <p className="text-muted mb-4">Completa los detalles para encontrar jugadores.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="playersNeeded" className="block text-sm font-medium text-muted mb-1">Jugadores que buscas</label>
                    <select id="playersNeeded" value={playersNeeded} onChange={e => setPlayersNeeded(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="skillLevel" className="block text-sm font-medium text-muted mb-1">Nivel de habilidad buscado (1-5)</label>
                    <select id="skillLevel" value={skillLevel} onChange={e => setSkillLevel(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text">
                        <option value="1">1 (Principiante)</option>
                        <option value="2">2 (Ocasional)</option>
                        <option value="3">3 (Intermedio)</option>
                        <option value="4">4 (Avanzado)</option>
                        <option value="5">5 (Competición)</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={isPublishing}>Publicar</Button>
                </div>
            </form>
        </Modal>
    );
};


const BookingItem: React.FC<{
    booking: EnrichedBooking, 
    onCancel: (bookingId: string) => void,
    onPublish: (booking: EnrichedBooking) => void,
    onAccept: (bookingId: string, userId: string) => void,
    onReject: (bookingId: string, userId: string) => void,
}> = ({booking, onCancel, onPublish, onAccept, onReject}) => {
    const isPast = new Date(booking.startTime) < new Date();
    const canCancel = !isPast && booking.status === 'CONFIRMED';
    const cancellationPending = booking.status === 'PENDING_CANCELLATION';
    const isCancelled = booking.status === 'CANCELLED';
    const canPublish = !isPast && booking.status === 'CONFIRMED' && !booking.playersNeeded;
    const isPublished = !isPast && booking.status === 'CONFIRMED' && booking.playersNeeded;


    const getStatusChip = () => {
        if (cancellationPending) {
            return <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Cancelación Pendiente</span>;
        }
        if (isCancelled) {
            return <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full">Cancelada</span>;
        }
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-lg flex flex-col gap-4 ${isPast || isCancelled ? 'bg-slate-50' : 'bg-teal-50'}`}
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 p-3 rounded-full ${isPast || isCancelled ? 'bg-slate-200 text-slate-600' : 'bg-primary-light text-primary-dark'}`}>
                    {isPast || isCancelled ? '✓' : '◷'}
                </div>
                <div className="flex-grow">
                    <p className={`font-bold ${isPast || isCancelled ? 'text-muted' : 'text-text'}`}>{booking.court.name} - {booking.court.sport}</p>
                    <p className="text-sm text-muted">{booking.club.name}</p>
                    <p className="text-sm text-muted">{format(new Date(booking.startTime), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                    <p className="text-sm text-muted">{format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}</p>
                    <div className="flex items-center gap-2 mt-1">{getStatusChip()}</div>
                    {isPublished && (
                        <div className="mt-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md inline-block font-medium">
                            Publicada en foro: Buscando {booking.playersNeeded! - (booking.joinedPlayerIds?.length || 0)} jugador(es) (Nivel {booking.skillLevel})
                        </div>
                    )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <p className={`font-bold text-lg ${isPast || isCancelled ? 'text-muted' : 'text-primary'}`}>{booking.totalPrice}€</p>
                    {canCancel && <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onCancel(booking.id)}>Cancelar</Button>}
                    {canPublish && <Button variant="secondary" size="sm" onClick={() => onPublish(booking)}>Buscar Jugadores</Button>}
                </div>
            </div>
             {isPublished && booking.pendingPlayers && booking.pendingPlayers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-teal-200">
                    <h4 className="text-sm font-semibold text-text mb-2">Solicitudes para unirse:</h4>
                    <div className="space-y-2">
                        {booking.pendingPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
                                <div className="flex items-center gap-2">
                                    {player.avatar ? (
                                        <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                    )}
                                    <span className="text-sm">{player.name}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="!px-2 !py-1 text-red-600 hover:bg-red-50" onClick={() => onReject(booking.id, player.id)}>
                                        Rechazar
                                    </Button>
                                    <Button size="sm" className="!px-2 !py-1" onClick={() => onAccept(booking.id, player.id)}>
                                        Aceptar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

const PlayerBookingsPage: React.FC = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingToCancel, setBookingToCancel] = useState<EnrichedBooking | null>(null);
    const [bookingToPublish, setBookingToPublish] = useState<EnrichedBooking | null>(null);

    const fetchBookings = useCallback(() => {
        if (user) {
            setLoading(true);
            apiService.getUserBookings(user.id)
                .then(setBookings)
                .catch(err => toast.error('No se pudieron cargar las reservas.'))
                .finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleCancelRequest = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            setBookingToCancel(booking);
        }
    };

    const confirmCancellation = async () => {
        if (!bookingToCancel) return;
        try {
            const { message } = await apiService.requestCancelBooking(bookingToCancel.id);
            toast.success(message);
            fetchBookings();
        } catch (error: any) {
            toast.error(error.message || 'No se pudo procesar la cancelación.');
        } finally {
            setBookingToCancel(null);
        }
    };

    const handleAcceptRequest = async (bookingId: string, userId: string) => {
        try {
            await apiService.acceptJoinRequest(bookingId, userId);
            toast.success("Jugador aceptado.");
            fetchBookings();
        } catch (error: any) {
            toast.error(error.message || "No se pudo aceptar la solicitud.");
        }
    };

    const handleRejectRequest = async (bookingId: string, userId: string) => {
        try {
            await apiService.rejectJoinRequest(bookingId, userId);
            toast.success("Solicitud rechazada.");
            fetchBookings();
        } catch (error: any) {
            toast.error(error.message || "No se pudo rechazar la solicitud.");
        }
    };


    const isLateCancellation = bookingToCancel ? differenceInHours(new Date(bookingToCancel.startTime), new Date()) <= 24 : false;

    const upcomingBookings = bookings.filter(b => new Date(b.startTime) >= new Date() && b.status !== 'CANCELLED');
    const pastBookings = bookings.filter(b => new Date(b.startTime) < new Date() || b.status === 'CANCELLED');

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-bold mb-4">Próximas Reservas</h2>
                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingBookings.map(b => <BookingItem key={b.id} booking={b} onCancel={handleCancelRequest} onPublish={setBookingToPublish} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />)}
                        </div>
                    ) : (
                        <p className="text-muted">No tienes ninguna reserva próxima.</p>
                    )}
                </Card>
                <Card>
                    <h2 className="text-xl font-bold mb-4">Historial de Reservas</h2>
                     {pastBookings.length > 0 ? (
                        <div className="space-y-4">
                            {pastBookings.map(b => <BookingItem key={b.id} booking={b} onCancel={handleCancelRequest} onPublish={() => {}} onAccept={() => {}} onReject={() => {}} />)}
                        </div>
                    ) : (
                        <p className="text-muted">Aún no has completado ninguna reserva.</p>
                    )}
                </Card>
            </div>

            <PublishBookingModal
                booking={bookingToPublish}
                onClose={() => setBookingToPublish(null)}
                onPublished={() => {
                    setBookingToPublish(null);
                    fetchBookings();
                }}
            />

            <Modal isOpen={!!bookingToCancel} onClose={() => setBookingToCancel(null)} title="Confirmar Cancelación">
                {bookingToCancel && (
                    <div>
                        <p>¿Estás seguro de que quieres cancelar tu reserva para <strong>{bookingToCancel.court.name}</strong> el <strong>{format(new Date(bookingToCancel.startTime), "d 'de' MMMM 'a las' HH:mm", { locale: es })}</strong>?</p>
                        {isLateCancellation && (
                            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-md">
                                <p className="font-bold">Aviso</p>
                                <p>Quedan menos de 24 horas para tu reserva. Tu solicitud de cancelación deberá ser aprobada por el club.</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setBookingToCancel(null)}>Volver</Button>
                            <Button className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={confirmCancellation}>
                                Sí, Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
};

export default PlayerBookingsPage;
