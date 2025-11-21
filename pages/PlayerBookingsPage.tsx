
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrichedBooking } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { differenceInHours } from 'date-fns';
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

    // Formateo seguro de fecha y hora usando Intl
    const dateObj = new Date(booking.startTime);
    const endDateObj = new Date(booking.endTime);
    
    const dateString = new Intl.DateTimeFormat('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }).format(dateObj);
    
    const startTimeString = new Intl.DateTimeFormat('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    }).format(dateObj);

    const endTimeString = new Intl.DateTimeFormat('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    }).format(endDateObj);

    const getStatusChip = () => {
        if (cancellationPending) {
            return <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full">Cancelación Pendiente</span>;
        }
        if (isCancelled) {
            return <span className="text-xs font-bold bg-red-200 text-red-800 px-3 py-1 rounded-full">Cancelada</span>;
        }
        return null;
    }

    return (
        <Card className={`!p-0 overflow-hidden border transition-shadow hover:shadow-lg ${isPast || isCancelled ? 'opacity-90 bg-gray-50' : 'bg-white border-slate-200'}`}>
             {/* Header de la tarjeta con Fecha y Hora destacadas */}
            <div className={`px-6 py-4 border-b ${isPast ? 'bg-gray-200 text-gray-600' : 'bg-gradient-to-r from-teal-50 to-white'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <h3 className={`text-2xl font-extrabold capitalize ${isPast ? 'text-gray-600' : 'text-primary'}`}>
                            {startTimeString} - {endTimeString}
                        </h3>
                        <p className="text-lg font-medium capitalize text-slate-600">{dateString}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-800">{booking.totalPrice}€</span>
                    </div>
                </div>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div className="space-y-2 flex-grow">
                        <div className="flex items-center gap-2">
                             <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded uppercase">{booking.court.sport}</span>
                             {getStatusChip()}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">{booking.court.name}</h4>
                        <p className="text-muted flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {booking.club.name}
                        </p>
                        
                        {isPublished && (
                            <div className="mt-3 bg-blue-50 border border-blue-100 text-blue-800 px-3 py-2 rounded-md inline-block w-full md:w-auto">
                                <p className="text-sm font-bold">Partida Pública</p>
                                <p className="text-xs">Buscando {booking.playersNeeded! - (booking.joinedPlayerIds?.length || 0)} jugador(es) • Nivel {booking.skillLevel}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                         {canCancel && (
                            <Button variant="danger" size="sm" className="bg-white text-red-600 border-red-200 hover:bg-red-50" onClick={() => onCancel(booking.id)}>
                                Cancelar Reserva
                            </Button>
                        )}
                        {canPublish && (
                            <Button variant="secondary" size="sm" onClick={() => onPublish(booking)}>
                                Buscar Jugadores
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sección de Solicitudes (Foro) */}
                {isPublished && booking.pendingPlayers && booking.pendingPlayers.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-text mb-3">Solicitudes para unirse:</h4>
                        <div className="space-y-3">
                            {booking.pendingPlayers.map(player => (
                                <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        {player.avatar ? (
                                            <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            </div>
                                        )}
                                        <span className="font-medium text-sm">{player.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 text-xs" onClick={() => onReject(booking.id, player.id)}>
                                            Rechazar
                                        </Button>
                                        <Button size="sm" className="text-xs" onClick={() => onAccept(booking.id, player.id)}>
                                            Aceptar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

const PlayerBookingsPage: React.FC = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingToCancel, setBookingToCancel] = useState<EnrichedBooking | null>(null);
    const [bookingToPublish, setBookingToPublish] = useState<EnrichedBooking | null>(null);
    
    // State to toggle between "Upcoming" (default) and "History"
    const [showHistory, setShowHistory] = useState(false);

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

    // Ordenar próximas reservas: de la más cercana a la más lejana
    const upcomingBookings = bookings
        .filter(b => new Date(b.startTime) >= new Date() && b.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Ordenar historial: de la más reciente a la más antigua
    const pastBookings = bookings
        .filter(b => new Date(b.startTime) < new Date() || b.status === 'CANCELLED')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    {showHistory ? 'Historial de Reservas' : 'Mis Reservas'}
                </h1>
                <Button 
                    variant="secondary" 
                    onClick={() => setShowHistory(!showHistory)}
                    className="whitespace-nowrap"
                >
                    {showHistory ? 'Ver Próximas Reservas' : 'Ver Historial'}
                </Button>
            </div>

            <div className="space-y-6">
                {!showHistory ? (
                    // VISTA DE PRÓXIMAS RESERVAS
                    upcomingBookings.length > 0 ? (
                        <div className="space-y-6">
                            {upcomingBookings.map(b => (
                                <BookingItem 
                                    key={b.id} 
                                    booking={b} 
                                    onCancel={handleCancelRequest} 
                                    onPublish={setBookingToPublish} 
                                    onAccept={handleAcceptRequest} 
                                    onReject={handleRejectRequest} 
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-12 bg-teal-50 border border-teal-100">
                            <div className="flex flex-col items-center">
                                <div className="bg-teal-100 p-4 rounded-full mb-4 text-teal-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                </div>
                                <h3 className="text-xl font-bold text-primary mb-2">No tienes reservas activas</h3>
                                <p className="text-muted mb-6">¿A qué esperas para jugar? Encuentra tu pista ideal ahora.</p>
                            </div>
                        </Card>
                    )
                ) : (
                    // VISTA DE HISTORIAL
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {pastBookings.length > 0 ? (
                            <div className="space-y-6">
                                {pastBookings.map(b => (
                                    <BookingItem 
                                        key={b.id} 
                                        booking={b} 
                                        onCancel={handleCancelRequest} 
                                        onPublish={() => {}} 
                                        onAccept={() => {}} 
                                        onReject={() => {}} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center py-12">
                                <p className="text-muted italic">No hay historial disponible.</p>
                            </Card>
                        )}
                    </motion.div>
                )}
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
                        <p>¿Estás seguro de que quieres cancelar tu reserva para <strong>{bookingToCancel.court.name}</strong>?</p>
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
