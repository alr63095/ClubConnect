import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Club, Court, TimeSlot } from '../types';
import { apiService } from '../services/apiService';
import BookingGrid from '../components/BookingGrid';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<{ court: Court; slots: TimeSlot[] }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const clubsData = await apiService.getClubs();
        setClubs(clubsData);
      } catch (error) {
        console.error("Error fetching clubs", error);
        toast.error("No se pudieron cargar los clubs.");
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const fetchAvailability = async () => {
    if (!selectedClub || !selectedSport || !selectedDate) {
      toast.error('Por favor, completa todos los campos de búsqueda.');
      return;
    }
    setSearching(true);
    setAvailability(null);
    try {
        const localDate = new Date(selectedDate + 'T00:00:00');
        const availabilityData = await apiService.getAvailability(selectedClub.id, selectedSport, localDate);
        setAvailability(availabilityData);
    } catch(error){
        toast.error("Error al buscar disponibilidad.");
    } finally {
        setSearching(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAvailability();
  }
  
  const handleBook = async (courtId: string, slots: TimeSlot[], totalPrice: number) => {
    if (!user) {
      toast.error('Debes iniciar sesión para realizar una reserva.');
      return;
    }
    if (slots.length === 0) return;

    setIsBooking(true);
    try {
      const startTime = new Date(`${selectedDate}T${slots[0].time}:00`);
      const lastSlotTime = slots[slots.length - 1].time;
      const lastSlotDate = new Date(`${selectedDate}T${lastSlotTime}:00`);
      const endTime = new Date(lastSlotDate.getTime() + 30 * 60 * 1000);
      
      await apiService.createBooking(user.id, courtId, startTime, endTime, totalPrice);
      
      toast.success(`¡Reserva confirmada!`);
      
      // Refresh availability
      await fetchAvailability();

    } catch (error) {
      toast.error('No se pudo completar la reserva.');
      console.error(error);
    } finally {
      setIsBooking(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <Card className="!p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary to-teal-500 text-white">
            <h1 className="text-3xl font-bold">Encuentra tu pista ideal</h1>
            <p className="mt-2 text-teal-100">Busca, reserva y juega. Así de fácil.</p>
        </div>
        <form onSubmit={handleSearch} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
                <label className="block text-sm font-medium text-muted mb-1">Club</label>
                <select 
                    value={selectedClub?.id || ''} 
                    onChange={e => {
                        setSelectedClub(clubs.find(c => c.id === e.target.value) || null);
                        setSelectedSport('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                >
                    <option value="">Selecciona un club</option>
                    {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-muted mb-1">Deporte</label>
                <select
                    value={selectedSport}
                    onChange={e => setSelectedSport(e.target.value)}
                    disabled={!selectedClub}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                >
                    <option value="">Selecciona un deporte</option>
                    {selectedClub?.sports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
                </select>
            </div>
            <Input
                label="Fecha"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
            />
            <Button type="submit" isLoading={searching}>Buscar disponibilidad</Button>
        </form>
      </Card>

        {searching && <Spinner />}

        {availability && (
            <Card>
                <h2 className="text-2xl font-bold mb-4">Pistas disponibles para {selectedSport} el {new Date(selectedDate+'T00:00:00').toLocaleDateString()}</h2>
                {availability.length > 0 ? (
                    <BookingGrid availability={availability} onBook={handleBook} isBooking={isBooking} />
                ) : (
                    <p className="text-center text-muted">No hay pistas disponibles para tu selección.</p>
                )}
            </Card>
        )}
    </motion.div>
  );
};

export default HomePage;