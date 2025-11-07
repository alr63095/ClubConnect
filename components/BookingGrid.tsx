import React, { useState, useMemo } from 'react';
import { Court, TimeSlot } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';

interface BookingGridProps {
  availability: { court: Court; slots: TimeSlot[] }[];
  onBook: (courtId: string, slots: TimeSlot[], totalPrice: number) => void;
  isBooking: boolean;
}

const BookingGrid: React.FC<BookingGridProps> = ({ availability, onBook, isBooking }) => {
  const [selectedSlots, setSelectedSlots] = useState<{ [courtId: string]: string[] }>({});

  const handleSlotClick = (courtId: string, time: string, available: boolean) => {
    if (!available) return;

    setSelectedSlots(prev => {
      const currentCourtSlots = prev[courtId] || [];
      const isSelected = currentCourtSlots.includes(time);
      const newCourtSlots = isSelected
        ? currentCourtSlots.filter(t => t !== time)
        : [...currentCourtSlots, time].sort();

      // Check for contiguity
      if (newCourtSlots.length > 1) {
        for (let i = 1; i < newCourtSlots.length; i++) {
          const prevTime = newCourtSlots[i-1];
          const currentTime = newCourtSlots[i];
          const prevDate = new Date(`1970-01-01T${prevTime}:00`);
          const currentDate = new Date(`1970-01-01T${currentTime}:00`);
          if (currentDate.getTime() - prevDate.getTime() !== 30 * 60 * 1000) {
            toast.error('Por favor, selecciona bloques de tiempo contiguos.');
            return prev;
          }
        }
      }
      
      // Only one court can be booked at a time
      const newSelection = { [courtId]: newCourtSlots };
      return newSelection;
    });
  };

  const selectedCourtId = Object.keys(selectedSlots)[0];
  const selectedCourtTimes = selectedCourtId ? selectedSlots[selectedCourtId] : [];
  
  const { totalPrice, selectedTimeSlots } = useMemo(() => {
    if (!selectedCourtId || selectedCourtTimes.length === 0) {
      return { totalPrice: 0, selectedTimeSlots: [] };
    }
    const courtData = availability.find(a => a.court.id === selectedCourtId);
    if (!courtData) return { totalPrice: 0, selectedTimeSlots: [] };

    const slots = courtData.slots.filter(s => selectedCourtTimes.includes(s.time));
    const price = slots.reduce((acc, slot) => acc + slot.price, 0);
    return { totalPrice: price, selectedTimeSlots: slots };
  }, [selectedCourtId, selectedCourtTimes, availability]);


  const handleBooking = () => {
    if (selectedCourtId && selectedTimeSlots.length > 0) {
        onBook(selectedCourtId, selectedTimeSlots, totalPrice);
        setSelectedSlots({});
    } else {
        toast.error('Selecciona al menos un bloque de 30 minutos.');
    }
  }

  return (
    <div>
        <div className="overflow-x-auto bg-surface rounded-lg shadow-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Pista</th>
                        {availability[0]?.slots.slice(0, 10).map(slot => ( // Show first 5 hours
                            <th key={slot.time} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{slot.time}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {availability.map(({ court, slots }) => (
                        <tr key={court.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">{court.name}</td>
                            {slots.slice(0, 10).map(slot => {
                                const isSelected = selectedSlots[court.id]?.includes(slot.time);
                                return (
                                <td key={slot.time} className="px-2 py-4 whitespace-nowrap">
                                    <button
                                        disabled={!slot.available}
                                        onClick={() => handleSlotClick(court.id, slot.time, slot.available)}
                                        className={`w-full h-10 rounded-md text-xs transition-all duration-150 ${
                                            slot.available
                                            ? isSelected
                                                ? 'bg-secondary text-white scale-110 shadow-lg'
                                                : 'bg-teal-100 text-primary hover:bg-teal-200'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                    {slot.available ? `${slot.price}€` : 'X'}
                                    </button>
                                </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <AnimatePresence>
        {totalPrice > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 p-4 bg-teal-50 rounded-lg flex items-center justify-between shadow-md"
            >
                <div>
                    <p className="font-semibold text-primary">Resumen de la reserva:</p>
                    <p className="text-sm text-muted">
                       {selectedTimeSlots.length * 30} min en '{availability.find(a=>a.court.id === selectedCourtId)?.court.name}'
                       {' a las '}
                       {selectedCourtTimes[0]}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{totalPrice}€</p>
                    <Button variant="secondary" size="sm" onClick={handleBooking} isLoading={isBooking}>
                        Confirmar Reserva
                    </Button>
                </div>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
};

export default BookingGrid;