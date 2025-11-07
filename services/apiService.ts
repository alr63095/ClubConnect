import { User, UserRole, Club, Court, Booking, TimeSlot, BookingStatus } from '../types';
import { add, set, differenceInHours } from 'date-fns';

// --- MOCK DATABASE ---
const users: User[] = [
  { id: 'user-1', name: 'Carlos Jugador', email: 'player@test.com', role: UserRole.Player },
  { id: 'user-2', name: 'Ana Admin', email: 'admin@test.com', role: UserRole.Admin, clubId: 'club-1' },
];

const clubs: Club[] = [
  { id: 'club-1', name: 'Padel Club Center', address: 'Calle Falsa 123, Madrid', sports: ['Pádel', 'Tenis'], logoUrl: 'https://picsum.photos/seed/club1/200' },
  { id: 'club-2', name: 'SportZone Arena', address: 'Avenida Siempre Viva 742, Barcelona', sports: ['Fútbol Sala', 'Baloncesto'], logoUrl: 'https://picsum.photos/seed/club2/200' },
];

const courts: Court[] = [
  { id: 'court-1', clubId: 'club-1', name: 'Pista Central (Cristal)', sport: 'Pádel', features: ['Cubierta', 'Iluminación LED'] },
  { id: 'court-2', clubId: 'club-1', name: 'Pista 2', sport: 'Pádel', features: ['Iluminación LED'] },
  { id: 'court-3', clubId: 'club-1', name: 'Pista de Tenis 1', sport: 'Tenis', features: ['Tierra Batida'] },
  { id: 'court-4', clubId: 'club-2', name: 'Campo de Fútbol Sala', sport: 'Fútbol Sala', features: ['Cubierta'] },
];

let bookings: Booking[] = [
  { id: 'booking-1', courtId: 'court-1', userId: 'user-1', startTime: set(new Date(), { hours: 18, minutes: 0, seconds: 0, milliseconds: 0 }), endTime: set(new Date(), { hours: 19, minutes: 0, seconds: 0, milliseconds: 0 }), totalPrice: 20, status: 'CONFIRMED' },
  { id: 'booking-2', courtId: 'court-1', userId: 'user-2', startTime: set(new Date(), { hours: 19, minutes: 30, seconds: 0, milliseconds: 0 }), endTime: set(new Date(), { hours: 20, minutes: 30, seconds: 0, milliseconds: 0 }), totalPrice: 22, status: 'CONFIRMED' },
  { id: 'booking-3', courtId: 'court-3', userId: 'user-1', startTime: add(new Date(), {days: -2, hours: -3}), endTime: add(new Date(), {days: -2, hours: -2}), totalPrice: 15, status: 'CONFIRMED' },
  { id: 'booking-4', courtId: 'court-2', userId: 'user-1', startTime: add(new Date(), { hours: 4 }), endTime: add(new Date(), { hours: 5 }), totalPrice: 10, status: 'CONFIRMED' },
  { id: 'booking-5', courtId: 'court-2', userId: 'user-1', startTime: add(new Date(), { days: 2 }), endTime: add(new Date(), { days: 2, hours: 1 }), totalPrice: 10, status: 'CONFIRMED' },
];
// --- END MOCK DATABASE ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const apiService = {
  login: async (email: string, pass: string): Promise<User | null> => {
    await delay(500);
    const user = users.find(u => u.email === email);
    // In a real app, you'd check the password hash
    return user || null;
  },

  getClubs: async (): Promise<Club[]> => {
    await delay(500);
    return clubs;
  },
  
  getCourtsByClub: async (clubId: string): Promise<Court[]> => {
    await delay(300);
    return courts.filter(c => c.clubId === clubId);
  },

  getAvailability: async (clubId: string, sport: string, date: Date): Promise<{ court: Court, slots: TimeSlot[] }[]> => {
    await delay(700);
    const relevantCourts = courts.filter(c => c.clubId === clubId && c.sport === sport);
    const clubBookings = bookings.filter(b => 
        b.startTime.toDateString() === date.toDateString() && 
        relevantCourts.some(c => c.id === b.courtId)
    );

    const availability = relevantCourts.map(court => {
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = set(date, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
          const isBooked = clubBookings.some(b => 
            b.courtId === court.id && 
            slotTime >= b.startTime && 
            slotTime < b.endTime &&
            b.status !== 'CANCELLED'
          );
          
          const price = (hour >= 18 && hour < 21) ? 12 : 8; // Dynamic pricing example

          slots.push({
            time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
            available: !isBooked,
            price: price,
          });
        }
      }
      return { court, slots };
    });

    return availability;
  },

  createBooking: async (userId: string, courtId: string, startTime: Date, endTime: Date, totalPrice: number): Promise<Booking> => {
      await delay(1000);
      const newBooking: Booking = {
          id: `booking-${Date.now()}`,
          userId,
          courtId,
          startTime,
          endTime,
          totalPrice,
          status: 'CONFIRMED',
      };
      bookings.push(newBooking);
      return newBooking;
  },

  getUserBookings: async (userId: string): Promise<(Booking & { court: Court, club: Club })[]> => {
    await delay(600);
    const userBookings = bookings.filter(b => b.userId === userId);
    return userBookings.map(b => {
        const court = courts.find(c => c.id === b.courtId)!;
        const club = clubs.find(c => c.id === court.clubId)!;
        return { ...b, court, club };
    }).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
  },
  
  getClubBookings: async (clubId: string, date: Date): Promise<(Booking & { court: Court, user: User })[]> => {
    await delay(600);
    const clubBookings = bookings.filter(b => {
        const court = courts.find(c => c.id === b.courtId);
        return court?.clubId === clubId && b.startTime.toDateString() === date.toDateString();
    });
    return clubBookings.map(b => {
        const court = courts.find(c => c.id === b.courtId)!;
        const user = users.find(u => u.id === b.userId)!;
        return { ...b, court, user };
    }).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
  },

  getAllClubBookings: async (clubId: string): Promise<(Booking & { court: Court, user: User })[]> => {
    await delay(800);
    const clubCourtsIds = courts.filter(c => c.clubId === clubId).map(c => c.id);
    const clubBookings = bookings.filter(b => clubCourtsIds.includes(b.courtId) && b.status !== 'CANCELLED');

    return clubBookings.map(b => {
        const court = courts.find(c => c.id === b.courtId)!;
        const user = users.find(u => u.id === b.userId)!;
        return { ...b, court, user };
    }).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
  },

  requestCancelBooking: async (bookingId: string): Promise<{ success: boolean, message: string, pending: boolean }> => {
    await delay(500);
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        throw new Error('Reserva no encontrada');
    }

    const hoursUntilStart = differenceInHours(booking.startTime, new Date());

    if (hoursUntilStart > 24) {
        booking.status = 'CANCELLED';
        return { success: true, message: 'Reserva cancelada con éxito.', pending: false };
    } else {
        booking.status = 'PENDING_CANCELLATION';
        return { success: true, message: 'Solicitud de cancelación enviada al club para su aprobación.', pending: true };
    }
  },

  approveCancellation: async (bookingId: string): Promise<Booking> => {
      await delay(400);
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");
      booking.status = 'CANCELLED';
      return booking;
  },

  rejectCancellation: async (bookingId: string): Promise<Booking> => {
      await delay(400);
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");
      booking.status = 'CONFIRMED';
      return booking;
  },
};