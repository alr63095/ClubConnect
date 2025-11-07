import { User, Club, Court, Booking, TimeSlot } from '../types';
import { add, format, eachMinuteOfInterval, startOfDay, isWithinInterval, addMinutes } from 'date-fns';

// --- MOCK DATABASE ---

let users: User[] = [
  { id: 'user-1', name: 'Juan Pérez', email: 'juan@test.com', role: 'PLAYER' },
  { id: 'user-2', name: 'Ana García', email: 'ana@test.com', role: 'ADMIN', clubId: 'club-1' },
  { id: 'user-3', name: 'Carlos Sánchez', email: 'carlos@test.com', role: 'SUPER_ADMIN' },
  { id: 'user-4', name: 'Lucía Fernández', email: 'lucia@test.com', role: 'PLAYER' },
];

let clubs: Club[] = [
  { id: 'club-1', name: 'Club de Pádel El Bosque', sports: ['Pádel', 'Tenis'] },
  { id: 'club-2', name: 'Polideportivo La Ciudad', sports: ['Tenis', 'Baloncesto'] },
];

let courts: Court[] = [
  { id: 'court-1', clubId: 'club-1', name: 'Pádel Central', sport: 'Pádel', features: ['Cubierta', 'Cristal', 'LED'] },
  { id: 'court-2', clubId: 'club-1', name: 'Pádel Pista 2', sport: 'Pádel', features: ['Exterior', 'Cristal'] },
  { id: 'court-3', clubId: 'club-1', name: 'Tenis Rápida', sport: 'Tenis', features: ['Pista Dura'] },
  { id: 'court-4', clubId: 'club-2', name: 'Tenis Tierra Batida', sport: 'Tenis', features: ['Tierra Batida'] },
  { id: 'court-5', clubId: 'club-2', name: 'Cancha Basket Principal', sport: 'Baloncesto', features: ['Cubierta', 'Parquet'] },
];

let bookings: Booking[] = [
  { 
    id: 'booking-1', 
    userId: 'user-1', 
    courtId: 'court-1', 
    clubId: 'club-1',
    startTime: new Date(new Date().setHours(18, 0, 0, 0)),
    endTime: new Date(new Date().setHours(19, 30, 0, 0)),
    totalPrice: 24,
    status: 'CONFIRMED',
  },
  { 
    id: 'booking-2', 
    userId: 'user-4', 
    courtId: 'court-3',
    clubId: 'club-1',
    startTime: add(new Date(), { days: 2, hours: -2 }),
    endTime: add(new Date(), { days: 2, hours: -1 }),
    totalPrice: 15,
    status: 'CONFIRMED',
  },
   { 
    id: 'booking-3', 
    userId: 'user-1', 
    courtId: 'court-1', 
    clubId: 'club-1',
    startTime: add(new Date(), { hours: 1 }),
    endTime: add(new Date(), { hours: 2, minutes: 30 }),
    totalPrice: 24,
    status: 'PENDING_CANCELLATION',
  },
  { 
    id: 'booking-4', 
    userId: 'user-1', 
    courtId: 'court-2',
    clubId: 'club-1',
    startTime: add(new Date(), { days: -1 }),
    endTime: add(new Date(), { days: -1, hours: 1 }),
    totalPrice: 16,
    status: 'CANCELLED',
  },
];

const simulate = <T>(data: T, delay = 500): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay));

const simulateError = (message: string, delay = 500): Promise<any> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), delay));

// --- API SERVICE ---

export const apiService = {
  login: async (email: string, pass: string): Promise<User | null> => {
    console.log(`Login attempt for ${email}`);
    const user = users.find(u => u.email === email);
    // Dummy password check
    if (user && pass === '1234') {
        return simulate(user);
    }
    return simulate(null);
  },

  register: async (name: string, email: string, pass: string): Promise<User> => {
    if (pass.length < 4) {
      return simulateError('La contraseña debe tener al menos 4 caracteres.');
    }
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return simulateError('El email ya está en uso');
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'PLAYER', // Default role for new users
    };
    users.push(newUser);
    console.log("New user registered:", newUser);
    console.log("All users:", users);
    return simulate(newUser);
  },
  
  getClubs: async (): Promise<Club[]> => {
    return simulate(clubs);
  },

  getClubById: async(clubId: string): Promise<Club> => {
      const club = clubs.find(c => c.id === clubId);
      if(!club) return simulateError("Club no encontrado");
      return simulate(club);
  },

  getCourtsByClub: async (clubId: string): Promise<Court[]> => {
    const clubCourts = courts.filter(c => c.clubId === clubId);
    return simulate(clubCourts);
  },

  getAvailability: async (clubId: string, sport: string, date: Date): Promise<{ court: Court; slots: TimeSlot[] }[]> => {
    const relevantCourts = courts.filter(c => c.clubId === clubId && c.sport === sport);
    const dayStart = startOfDay(date);
    
    const relevantBookings = bookings.filter(b => {
        const bookingDate = startOfDay(new Date(b.startTime));
        return b.clubId === clubId && bookingDate.getTime() === dayStart.getTime() && b.status !== 'CANCELLED';
    });

    const availability = relevantCourts.map(court => {
        const slots: TimeSlot[] = [];
        const timeIntervals = eachMinuteOfInterval(
            { start: new Date(dayStart).setHours(9, 0, 0, 0), end: new Date(dayStart).setHours(22, 30, 0, 0) },
            { step: 30 }
        );
        
        for (const slotStart of timeIntervals) {
            const isBooked = relevantBookings.some(b => 
                b.courtId === court.id && isWithinInterval(slotStart, { start: new Date(b.startTime), end: addMinutes(new Date(b.endTime), -1) })
            );

            slots.push({
                time: format(slotStart, 'HH:mm'),
                available: !isBooked,
                price: 8, // dummy price
            });
        }
        return { court, slots };
    });

    return simulate(availability, 1000);
  },
  
  createBooking: async (userId: string, courtId: string, startTime: Date, endTime: Date, totalPrice: number): Promise<Booking> => {
      const court = courts.find(c => c.id === courtId);
      if(!court) return simulateError('Pista no encontrada');
      const newBooking: Booking = {
          id: `booking-${Date.now()}`,
          userId,
          courtId,
          clubId: court.clubId,
          startTime,
          endTime,
          totalPrice,
          status: 'CONFIRMED'
      };
      bookings.push(newBooking);
      return simulate(newBooking);
  },

  getUserBookings: async (userId: string): Promise<(Booking & { court: Court, club: Club })[]> => {
    const userBookings = bookings.filter(b => b.userId === userId);
    const enrichedBookings = userBookings.map(booking => {
        const court = courts.find(c => c.id === booking.courtId);
        const club = clubs.find(c => c.id === court?.clubId);
        return { ...booking, court, club };
    }).filter(b => b.court && b.club) as (Booking & { court: Court, club: Club })[];
    
    return simulate(enrichedBookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
  },
  
  requestCancelBooking: async (bookingId: string): Promise<{message: string}> => {
      const bookingIndex = bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex === -1) return simulateError('Reserva no encontrada');
      
      const booking = bookings[bookingIndex];
      const hoursUntil = (new Date(booking.startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);

      if (hoursUntil > 24) {
          bookings[bookingIndex].status = 'CANCELLED';
          return simulate({ message: 'Reserva cancelada con éxito.' });
      } else {
          bookings[bookingIndex].status = 'PENDING_CANCELLATION';
          return simulate({ message: 'Solicitud de cancelación enviada. El club revisará tu petición.' });
      }
  },

  getAllClubBookings: async (clubId: string): Promise<(Booking & { court: Court; user: User; })[]> => {
      const clubBookings = bookings.filter(b => b.clubId === clubId);
      const enriched = clubBookings.map(b => {
          const court = courts.find(c => c.id === b.courtId);
          const user = users.find(u => u.id === b.userId);
          return { ...b, court, user };
      }).filter(b => b.court && b.user) as (Booking & { court: Court; user: User; })[];

      return simulate(enriched.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
  },

  approveCancellation: async (bookingId: string): Promise<void> => {
      const booking = bookings.find(b => b.id === bookingId);
      if(booking) {
          booking.status = 'CANCELLED';
      }
      return simulate(undefined);
  },

  rejectCancellation: async (bookingId: string): Promise<void> => {
      const booking = bookings.find(b => b.id === bookingId);
      if(booking) {
          booking.status = 'CONFIRMED';
      }
      return simulate(undefined);
  },
  
  addCourt: async (clubId: string, name: string, sport: string, features: string[]): Promise<Court> => {
      const newCourt: Court = {
          id: `court-${Date.now()}`,
          clubId,
          name,
          sport,
          features
      };
      courts.push(newCourt);

      const club = clubs.find(c => c.id === clubId);
      if (club && !club.sports.includes(sport)) {
          club.sports.push(sport);
      }
      return simulate(newCourt);
  }

};