import { User, Club, Court, Booking, TimeSlot } from '../types';
import { add, format, eachMinuteOfInterval, set, areIntervalsOverlapping } from 'date-fns';

// Helper to simulate async operations
const simulate = <T>(data: T, delay = 500): Promise<T> => 
  new Promise(resolve => setTimeout(() => {
    // Deep clone the data to simulate receiving a fresh copy from an API
    resolve(JSON.parse(JSON.stringify(data)));
  }, delay));

// --- MOCK DATABASE ---

let users: User[] = [
  { id: 'user-1', name: 'Juan Pérez', email: 'juan@test.com', role: 'PLAYER' },
  { id: 'user-2', name: 'Ana García', email: 'ana@test.com', role: 'ADMIN', clubIds: ['club-1', 'club-2'] },
  { id: 'user-3', name: 'Super Admin', email: 'super@test.com', role: 'SUPER_ADMIN' },
  { id: 'user-4', name: 'Carlos Sanz', email: 'carlos@test.com', role: 'PLAYER' },
];

let clubs: Club[] = [
  { id: 'club-1', name: 'Club de Tenis y Pádel Montecarlo', sports: ['Tenis', 'Pádel'] },
  { id: 'club-2', name: 'Polideportivo La Estación', sports: ['Pádel', 'Baloncesto'] },
];

let courts: Court[] = [
    { 
        id: 'court-1', clubId: 'club-1', name: 'Pista de Pádel 1', sport: 'Pádel', 
        features: ['Cristal', 'Exterior'], openingTime: '09:00', closingTime: '23:00',
        defaultPrice: 15, slotPrices: [{time: '20:00', price: 20}, {time: '20:30', price: 20}]
    },
    { 
        id: 'court-2', clubId: 'club-1', name: 'Pista de Pádel 2', sport: 'Pádel', 
        features: ['Muro', 'Exterior'], openingTime: '09:00', closingTime: '23:00',
        defaultPrice: 12, slotPrices: []
    },
    { 
        id: 'court-3', clubId: 'club-1', name: 'Pista de Tenis Central', sport: 'Tenis', 
        features: ['Tierra Batida', 'Iluminación LED'], openingTime: '09:00', closingTime: '22:00',
        defaultPrice: 25, slotPrices: []
    },
    { 
        id: 'court-4', clubId: 'club-2', name: 'Pista de Pádel Indoor', sport: 'Pádel', 
        features: ['Cristal', 'Indoor'], openingTime: '10:00', closingTime: '22:00',
        defaultPrice: 18, slotPrices: []
    },
    { 
        id: 'court-5', clubId: 'club-2', name: 'Cancha de Baloncesto', sport: 'Baloncesto', 
        features: ['Parquet', 'Indoor'], openingTime: '10:00', closingTime: '21:00',
        defaultPrice: 30, slotPrices: []
    },
];

let bookings: Booking[] = [
    {
        id: 'booking-1', userId: 'user-1', courtId: 'court-1', clubId: 'club-1',
        startTime: set(new Date(), { hours: 19, minutes: 0, seconds: 0, milliseconds: 0 }),
        endTime: set(new Date(), { hours: 20, minutes: 30, seconds: 0, milliseconds: 0 }),
        totalPrice: 35, status: 'CONFIRMED'
    },
    {
        id: 'booking-2', userId: 'user-4', courtId: 'court-3', clubId: 'club-1',
        startTime: add(new Date(), { days: -1, hours: 2 }),
        endTime: add(new Date(), { days: -1, hours: 3, minutes: 30 }),
        totalPrice: 50, status: 'CONFIRMED'
    },
    {
        id: 'booking-3', userId: 'user-1', courtId: 'court-4', clubId: 'club-2',
        startTime: add(new Date(), { days: 2, hours: 1 }),
        endTime: add(new Date(), { days: 2, hours: 2, minutes: 30 }),
        totalPrice: 27, status: 'PENDING_CANCELLATION'
    },
];

class ApiService {
  async login(email: string, pass: string): Promise<User> {
    console.log(`Attempting login for ${email}`);
    const user = users.find(u => u.email === email);
    // Dummy password check
    if (user && pass === '1234') {
      return simulate(user);
    }
    return Promise.reject('Invalid credentials');
  }

  async register(name: string, email: string, pass: string): Promise<User> {
    if (users.some(u => u.email === email)) {
      return Promise.reject('User with this email already exists');
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: 'PLAYER',
    };
    users.push(newUser);
    return simulate(newUser);
  }

  async getClubs(): Promise<Club[]> {
    return simulate(clubs);
  }
  
  async getClubById(clubId: string): Promise<Club> {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return Promise.reject('Club not found');
    return simulate(club);
  }

  async getClubsByIds(clubIds: string[]): Promise<Club[]> {
    const foundClubs = clubs.filter(c => clubIds.includes(c.id));
    return simulate(foundClubs);
  }

  async getCourtsByClub(clubId: string): Promise<Court[]> {
    const clubCourts = courts.filter(c => c.clubId === clubId);
    return simulate(clubCourts);
  }

  async getAvailability(clubId: string, sport: string, date: Date): Promise<{ court: Court; slots: TimeSlot[] }[]> {
    const clubCourts = courts.filter(c => c.clubId === clubId && c.sport === sport);
    const dayBookings = bookings.filter(b => 
      b.clubId === clubId && 
      new Date(b.startTime).toDateString() === date.toDateString() &&
      b.status !== 'CANCELLED'
    );
    
    const availability = clubCourts.map(court => {
        const slots: TimeSlot[] = [];
        const [openH, openM] = court.openingTime.split(':').map(Number);
        const [closeH, closeM] = court.closingTime.split(':').map(Number);

        const start = set(date, { hours: openH, minutes: openM, seconds: 0, milliseconds: 0 });
        const end = set(date, { hours: closeH, minutes: closeM, seconds: 0, milliseconds: 0 });
        
        const courtBookings = dayBookings.filter(b => b.courtId === court.id);

        eachMinuteOfInterval({ start, end }, { step: 30 }).forEach(slotStart => {
            if (slotStart < end) { // Don't create a slot at the exact closing time
                const slotEnd = add(slotStart, { minutes: 30 });
                const time = format(slotStart, 'HH:mm');

                const isBooked = courtBookings.some(booking => 
                    areIntervalsOverlapping(
                        { start: slotStart, end: slotEnd },
                        { start: new Date(booking.startTime), end: new Date(booking.endTime) },
                        { inclusive: false }
                    )
                );
                
                const customPrice = court.slotPrices.find(p => p.time === time);

                slots.push({
                    time,
                    available: !isBooked,
                    price: customPrice ? customPrice.price : court.defaultPrice,
                });
            }
        });

        return { court, slots };
    });

    return simulate(availability);
  }

  async createBooking(userId: string, courtId: string, startTime: Date, endTime: Date, totalPrice: number): Promise<Booking> {
    const court = courts.find(c => c.id === courtId);
    if (!court) return Promise.reject("Court not found");

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
  }

  async getUserBookings(userId: string): Promise<(Booking & { court: Court, club: Club })[]> {
    const userBookings = bookings.filter(b => b.userId === userId);
    const enrichedBookings = userBookings.map(booking => {
        const court = courts.find(c => c.id === booking.courtId)!;
        const club = clubs.find(c => c.id === court.clubId)!;
        return { ...booking, court, club };
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return simulate(enrichedBookings);
  }

  async requestCancelBooking(bookingId: string): Promise<{ message: string }> {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return Promise.reject({ message: 'Reserva no encontrada.' });

    const hoursUntilBooking = (new Date(booking.startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking > 24) {
        booking.status = 'CANCELLED';
        return simulate({ message: 'Reserva cancelada correctamente.' });
    } else {
        booking.status = 'PENDING_CANCELLATION';
        return simulate({ message: 'Solicitud de cancelación enviada al club.' });
    }
  }

  async createCourt(courtData: Omit<Court, 'id'>): Promise<Court> {
    const newCourt: Court = {
        id: `court-${Date.now()}`,
        ...courtData
    };
    courts.push(newCourt);
    
    const club = clubs.find(c => c.id === courtData.clubId);
    if (club && !club.sports.includes(courtData.sport)) {
        club.sports.push(courtData.sport);
    }
    
    return simulate(newCourt);
  }

  async updateCourt(courtData: Court): Promise<Court> {
    const index = courts.findIndex(c => c.id === courtData.id);
    if (index === -1) return Promise.reject("Court not found");

    courts[index] = courtData;
    
    const club = clubs.find(c => c.id === courtData.clubId);
    if (club && !club.sports.includes(courtData.sport)) {
        club.sports.push(courtData.sport);
    }

    return simulate(courts[index]);
  }

  async deleteCourt(courtId: string): Promise<void> {
    courts = courts.filter(c => c.id !== courtId);
    bookings.forEach(booking => {
        if (booking.courtId === courtId && new Date(booking.startTime) > new Date()) {
            booking.status = 'CANCELLED';
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  async getAllClubBookings(clubId: string): Promise<(Booking & { court: Court, user: User })[]> {
    const clubBookings = bookings.filter(b => b.clubId === clubId);
    const enrichedBookings = clubBookings.map(booking => {
        const court = courts.find(c => c.id === booking.courtId)!;
        const user = users.find(u => u.id === booking.userId)!;
        return { ...booking, court, user, startTime: new Date(booking.startTime), endTime: new Date(booking.endTime) };
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    return simulate(enrichedBookings);
  }

  async approveCancellation(bookingId: string): Promise<void> {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'CANCELLED';
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  async rejectCancellation(bookingId: string): Promise<void> {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'CONFIRMED';
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }
}

export const apiService = new ApiService();
