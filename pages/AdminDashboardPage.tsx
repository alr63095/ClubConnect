import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { ICONS } from '../constants';
import { Booking, Court, User } from '../types';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminCalendarView from '../components/AdminCalendarView';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const incomeData = [
  { name: 'Lun', ingresos: 120 },
  { name: 'Mar', ingresos: 190 },
  { name: 'Mié', ingresos: 210 },
  { name: 'Jue', ingresos: 250 },
  { name: 'Vie', ingresos: 350 },
  { name: 'Sáb', ingresos: 480 },
  { name: 'Dom', ingresos: 450 },
];

const occupancyData = [
  { name: 'Pista 1', ocupacion: 80 },
  { name: 'Pista 2', ocupacion: 65 },
  { name: 'Tenis 1', ocupacion: 40 },
];


const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [courts, setCourts] = useState<Court[]>([]);
    const [allBookings, setAllBookings] = useState<(Booking & { court: Court; user: User; })[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchData = useCallback(async () => {
        if (user?.clubId) {
            setLoading(true);
            try {
                const courtsData = await apiService.getCourtsByClub(user.clubId);
                setCourts(courtsData);
                const bookingsData = await apiService.getAllClubBookings(user.clubId);
                setAllBookings(bookingsData);
            } catch(e) {
                toast.error("No se pudieron cargar los datos del panel.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

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
    
    if (loading) return <Spinner/>

    const todayBookings = allBookings.filter(b => isToday(new Date(b.startTime)) && b.status !== 'CANCELLED');
    const pendingCancellations = allBookings.filter(b => b.status === 'PENDING_CANCELLATION');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administrador</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <h3 className="text-sm font-medium text-muted">Ingresos Hoy</h3>
            <p className="text-3xl font-bold text-primary mt-1">210€</p>
        </Card>
        <Card>
            <h3 className="text-sm font-medium text-muted">Reservas Hoy</h3>
            <p className="text-3xl font-bold text-primary mt-1">{todayBookings.length}</p>
        </Card>
        <Card>
            <h3 className="text-sm font-medium text-muted">Ocupación Media</h3>
            <p className="text-3xl font-bold text-primary mt-1">62%</p>
        </Card>
         <Card>
            <h3 className="text-sm font-medium text-muted">Nuevos Usuarios (Mes)</h3>
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
                              <p className="text-sm text-muted">{booking.court.name} - {format(new Date(booking.startTime), "eee, dd/MM/yy HH:mm", { locale: es })}</p>
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
          <h2 className="text-xl font-bold mb-4">Ingresos Semanales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ingresos" stroke="#0D9488" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-4">Ocupación por Pista</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
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