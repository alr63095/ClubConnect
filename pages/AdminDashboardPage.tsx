import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { Booking, Club, Court, User } from '../types';
import { format, isToday, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminCalendarView from '../components/AdminCalendarView';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const AdminDashboardPage: React.FC = () => {
    const { selectedClubId } = useAuth();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [courts, setCourts] = useState<Court[]>([]);
    const [allBookings, setAllBookings] = useState<(Booking & { court: Court; user: User; })[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchData = useCallback(async () => {
        if (selectedClubId) {
            setLoading(true);
            try {
                const [clubData, courtsData, bookingsData] = await Promise.all([
                    apiService.getClubById(selectedClubId),
                    apiService.getCourtsByClub(selectedClubId),
                    apiService.getAllClubBookings(selectedClubId)
                ]);

                // FIX: Convert string dates from API simulation back to Date objects
                const bookingsWithDates = bookingsData.map(b => ({
                    ...b,
                    startTime: new Date(b.startTime),
                    endTime: new Date(b.endTime),
                }));

                setClub(clubData);
                setCourts(courtsData);
                setAllBookings(bookingsWithDates);
            } catch(e) {
                toast.error("No se pudieron cargar los datos del panel.");
            } finally {
                setLoading(false);
            }
        }
    }, [selectedClubId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (bookingId: string) => {
        try {
            await apiService.approveCancellation(bookingId);
            toast.success("Cancelación aprobada.");
            fetchData();
        } catch (e) {
            toast.error("Error al aprobar la cancelación.");
        }
    }

    const handleReject = async (bookingId: string) => {
        try {
            await apiService.rejectCancellation(bookingId);
            toast.success("Cancelación rechazada.");
            fetchData();
        } catch (e) {
            toast.error("Error al rechazar la cancelación.");
        }
    }
    
    // --- Dynamic Data Calculation ---

    const todayBookings = useMemo(() => 
        allBookings.filter(b => isToday(b.startTime) && b.status !== 'CANCELLED')
    , [allBookings]);
    
    const todayIncome = useMemo(() => 
        allBookings
            .filter(b => isToday(b.startTime) && b.status === 'CONFIRMED')
            .reduce((sum, b) => sum + b.totalPrice, 0)
    , [allBookings]);

    const { occupancyByCourt, averageOccupancy } = useMemo(() => {
        if (!courts.length) return { occupancyByCourt: [], averageOccupancy: 0 };

        const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours + minutes / 60;
        };

        const courtOccupancyData = courts.map(court => {
            const totalAvailableHours = parseTime(court.closingTime) - parseTime(court.openingTime);
            if (totalAvailableHours <= 0) return { name: court.name, ocupacion: 0 };

            const todayBookedHours = allBookings
                .filter(b => b.courtId === court.id && isToday(b.startTime) && b.status === 'CONFIRMED')
                .reduce((total, booking) => {
                    const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
                    return total + durationMs / (1000 * 60 * 60);
                }, 0);
            
            const ocupacion = Math.round((todayBookedHours / totalAvailableHours) * 100);
            return { name: court.name, ocupacion };
        });

        const totalOccupancySum = courtOccupancyData.reduce((sum, data) => sum + data.ocupacion, 0);
        const avg = courtOccupancyData.length > 0 ? Math.round(totalOccupancySum / courtOccupancyData.length) : 0;

        return { occupancyByCourt: courtOccupancyData, averageOccupancy: avg };
    }, [allBookings, courts]);

    const weeklyIncomeData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();

        return last7Days.map(day => {
            const dayIncome = allBookings
                .filter(b => b.status === 'CONFIRMED' && format(b.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .reduce((sum, b) => sum + b.totalPrice, 0);
            
            return {
                name: format(day, 'eee', { locale: es }),
                ingresos: dayIncome,
            };
        });
    }, [allBookings]);

    const pendingCancellations = useMemo(() =>
        allBookings.filter(b => b.status === 'PENDING_CANCELLATION')
    , [allBookings]);

    if (loading) return <Spinner/>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-3xl font-bold">Panel de Administrador</h1>
            <p className="text-muted -mt-4">Mostrando datos para: <strong>{club?.name}</strong></p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <h3 className="text-sm font-medium text-muted">Ingresos Hoy</h3>
                    <p className="text-3xl font-bold text-primary mt-1">{todayIncome}€</p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-muted">Reservas Hoy</h3>
                    <p className="text-3xl font-bold text-primary mt-1">{todayBookings.length}</p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-muted">Ocupación Media</h3>
                    <p className="text-3xl font-bold text-primary mt-1">{averageOccupancy}%</p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-muted">Nuevos Usuarios (Mes)</h3>
                    {/* Nota: Este dato es estático ya que no almacenamos la fecha de registro de usuarios */}
                    <p className="text-3xl font-bold text-primary mt-1">14</p>
                </Card>
            </div>

            {pendingCancellations.length > 0 && (
                <Card>
                    <h2 className="text-xl font-bold mb-4">Solicitudes de Cancelación Pendientes</h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {pendingCancellations.map(booking => (
                            <div key={booking.id} className="p-3 bg-yellow-50 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div>
                                    <p className="font-semibold">{booking.user.name}</p>
                                    <p className="text-sm text-muted">{booking.court.name} - {format(booking.startTime, "eee, dd/MM/yy HH:mm", { locale: es })}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-100" onClick={() => handleReject(booking.id)}>Rechazar</Button>
                                    <Button size="sm" onClick={() => handleApprove(booking.id)}>Aprobar</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-bold mb-4">Ingresos (Últimos 7 días)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyIncomeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis unit="€" />
                            <Tooltip formatter={(value: number) => `${value}€`} />
                            <Legend />
                            <Line type="monotone" dataKey="ingresos" stroke="#0D9488" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold mb-4">Ocupación por Pista (Hoy)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={occupancyByCourt}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis unit="%" />
                            <Tooltip formatter={(value: number) => `${value}%`} />
                            <Legend />
                            <Bar dataKey="ocupacion" fill="#F97316" name="Ocupación (%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Ocupación de Hoy</h2>
                    <div className="text-lg font-semibold">{format(selectedDate, "eeee, d 'de' MMMM", {locale: es})}</div>
                </div>
                {courts.length > 0 ? (
                    <AdminCalendarView courts={courts} bookings={allBookings.filter(b => b.status !== 'CANCELLED')} date={selectedDate} />
                ) : <p>No hay pistas o reservas para mostrar.</p>}
            </Card>
        </motion.div>
    );
};

export default AdminDashboardPage;