import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Booking, Club, Court } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

const BookingItem: React.FC<{booking: Booking & { court: Court, club: Club }, onCancel: (bookingId: string) => void}> = ({booking, onCancel}) => {
    const isPast = new Date(booking.startTime) < new Date();
    const canCancel = !isPast && booking.status === 'CONFIRMED';
    const cancellationPending = booking.status === 'PENDING_CANCELLATION';
    const isCancelled = booking.status === 'CANCELLED';

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
            className={`p-4 rounded-lg flex items-start gap-4 ${isPast || isCancelled ? 'bg-slate-50' : 'bg-teal-50'}`}
        >
            <div className={`p-3 rounded-full ${isPast || isCancelled ? 'bg-slate-200 text-slate-600' : 'bg-primary-light text-primary-dark'}`}>
                {isPast || isCancelled ? '✓' : '◷'}
            </div>
            <div className="flex-grow">
                <p className={`font-bold ${isPast || isCancelled ? 'text-muted' : 'text-text'}`}>{booking.court.name} - {booking.court.sport}</p>
                <p className="text-sm text-muted">{booking.club.name}</p>
                <p className="text-sm text-muted">{format(new Date(booking.startTime), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                <p className="text-sm text-muted">{format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}</p>
                <div className="flex items-center gap-2 mt-1">{getStatusChip()}</div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${isPast || isCancelled ? 'text-muted' : 'text-primary'}`}>{booking.totalPrice}€</p>
                {canCancel && <Button variant="ghost" size="sm" className="mt-1 text-red-600 hover:bg-red-50" onClick={() => onCancel(booking.id)}>Cancelar</Button>}
            </div>
        </motion.div>
    )
}

const PlayerBookingsPage: React.FC = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<(Booking & { court: Court, club: Club })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState<(Booking & { court: Court, club: Club }) | null>(null);

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
        setIsCancelling(true);
        try {
            const { message } = await apiService.requestCancelBooking(bookingToCancel.id);
            toast.success(message);
            fetchBookings(); // Re-fetch bookings to update the UI
        } catch (error: any) {
            toast.error(error.message || 'No se pudo procesar la cancelación.');
        } finally {
            setIsCancelling(false);
            setBookingToCancel(null);
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
                            {upcomingBookings.map(b => <BookingItem key={b.id} booking={b} onCancel={handleCancelRequest} />)}
                        </div>
                    ) : (
                        <p className="text-muted">No tienes ninguna reserva próxima.</p>
                    )}
                </Card>
                <Card>
                    <h2 className="text-xl font-bold mb-4">Historial de Reservas</h2>
                     {pastBookings.length > 0 ? (
                        <div className="space-y-4">
                            {pastBookings.map(b => <BookingItem key={b.id} booking={b} onCancel={handleCancelRequest} />)}
                        </div>
                    ) : (
                        <p className="text-muted">Aún no has completado ninguna reserva.</p>
                    )}
                </Card>
            </div>

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
                            <Button className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={confirmCancellation} isLoading={isCancelling}>
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