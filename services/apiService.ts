import { User, Club, Court, Booking, TimeSlot, UserRole, EnrichedBooking } from '../types';
import { add, format, eachMinuteOfInterval, set, areIntervalsOverlapping } from 'date-fns';

// Helper to simulate async operations
const simulate = <T>(data: T, delay = 500): Promise<T> => 
  new Promise(resolve => setTimeout(() => {
    // Deep clone the data to simulate receiving a fresh copy from an API
    resolve(JSON.parse(JSON.stringify(data)));
  }, delay));

// --- MOCK DATABASE ---

let users: User[] = [
  { id: 'user-1', name: 'Juan Pérez', email: 'juan@test.com', role: 'PLAYER', isBanned: false },
  { id: 'user-2', name: 'Ana García', email: 'ana@test.com', role: 'ADMIN', clubIds: ['club-1', 'club-2'], isBanned: false },
  { id: 'user-3', name: 'Super Admin', email: 'super@test.com', role: 'SUPER_ADMIN', isBanned: false },
  { id: 'user-4', name: 'Carlos Sanz', email: 'carlos@test.com', role: 'PLAYER', isBanned: false },
  { id: 'user-5', name: 'Lucía Martín', email: 'lucia@test.com', role: 'PLAYER', isBanned: true },
  { id: 'user-6', name: 'Pedro Jiménez', email: 'pedro@test.com', role: 'ADMIN', clubIds: ['club-2'], isBanned: false },
  { id: 'user-7', name: 'Sofía López', email: 'sofia@test.com', role: 'PLAYER', isBanned: false },
  { id: 'user-8', name: 'Miguel Reyes', email: 'miguel@test.com', role: 'PLAYER', isBanned: false },
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
    {
        id: 'booking-4', userId: 'user-7', courtId: 'court-2', clubId: 'club-1',
        startTime: add(new Date(), { days: 1, hours: 4 }),
        endTime: add(new Date(), { days: 1, hours: 5, minutes: 30 }),
        totalPrice: 24, status: 'CONFIRMED',
        playersNeeded: 3,
        skillLevel: 3,
        joinedPlayerIds: ['user-8'],
        pendingPlayerIds: []
    },
    {
        id: 'booking-5-forum', userId: 'user-4', courtId: 'court-5', clubId: 'club-2',
        startTime: add(new Date(), { days: 3, hours: 5 }),
        endTime: add(new Date(), { days: 3, hours: 6, minutes: 30 }),
        totalPrice: 30, status: 'CONFIRMED',
        playersNeeded: 4,
        skillLevel: 4,
        joinedPlayerIds: [],
        pendingPlayerIds: ['user-1'],
    },
];

class ApiService {
  private enrichBooking(booking: Booking): EnrichedBooking {
      const court = courts.find(c => c.id === booking.courtId)!;
      const club = clubs.find(c => c.id === court.clubId)!;
      const user = users.find(u => u.id === booking.userId)!;
      
      const enriched: EnrichedBooking = { ...booking, court, club, user };
      
      if (booking.joinedPlayerIds) {
          enriched.joinedPlayers = users.filter(u => booking.joinedPlayerIds!.includes(u.id));
      }
      if (booking.pendingPlayerIds) {
          enriched.pendingPlayers = users.filter(u => booking.pendingPlayerIds!.includes(u.id));
      }

      return enriched;
  }

  async login(email: string, pass: string): Promise<User> {
    console.log(`Attempting login for ${email}`);
    const user = users.find(u => u.email === email);
    // Dummy password check
    if (user && user.isBanned) {
        return Promise.reject('Este usuario ha sido baneado.');
    }
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

  async requestPasswordReset(email: string): Promise<{ message: string }> {
      console.log(`Password reset requested for ${email}`);
      // We don't reveal if the user exists for security reasons.
      // In a real app, this would trigger an email send process.
      return simulate({ message: 'Password reset email sent.' });
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
        const now = new Date();
        const isToday = new Date().toDateString() === date.toDateString();

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

                const isPast = isToday && slotStart < now;
                
                const customPrice = court.slotPrices.find(p => p.time === time);

                slots.push({
                    time,
                    available: !isBooked && !isPast,
                    price: customPrice ? customPrice.price : court.defaultPrice,
                });
            }
        });

        return { court, slots };
    });

    return simulate(availability);
  }

  async getGlobalAvailability(sport: string, date: Date): Promise<{ club: Club; availability: { court: Court; slots: TimeSlot[] }[] }[]> {
    const relevantClubs = clubs.filter(c => c.sports.includes(sport));
    if (relevantClubs.length === 0) return simulate([]);

    const results = await Promise.all(
        relevantClubs.map(async club => {
            const availability = await this.getAvailability(club.id, sport, date);
            return { club, availability };
        })
    );

    return simulate(results.filter(r => r.availability.length > 0 && r.availability.some(a => a.slots.length > 0)));
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
        status: 'CONFIRMED',
    };
    bookings.push(newBooking);
    return simulate(newBooking);
  }

  async getUserBookings(userId: string): Promise<EnrichedBooking[]> {
    const userBookings = bookings.filter(b => b.userId === userId);
    const enrichedBookings = userBookings
        .map(booking => this.enrichBooking(booking))
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return simulate(enrichedBookings);
  }

  // Fix: Implement getForumPosts to return open, future bookings where players are needed.
  async getForumPosts(): Promise<EnrichedBooking[]> {
    const now = new Date();
    // A "forum post" is a confirmed, future booking where the user is looking for players.
    const forumBookings = bookings.filter(b => 
        b.playersNeeded && b.playersNeeded > 0 &&
        new Date(b.startTime) > now &&
        b.status === 'CONFIRMED'
    );
    
    const enriched = forumBookings.map(b => this.enrichBooking(b));
    
    return simulate(enriched);
  }
  
  async publishBookingToForum(bookingId: string, playersNeeded: number, skillLevel: number): Promise<Booking> {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return Promise.reject({ message: 'Reserva no encontrada.' });

      booking.playersNeeded = playersNeeded;
      booking.skillLevel = skillLevel;

      return simulate(booking);
  }

  // Fix: Implement requestToJoinBooking to allow users to request to join a forum post.
  async requestToJoinBooking(bookingId: string, userId: string): Promise<{ message: string }> {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return Promise.reject({ message: 'Partida no encontrada.' });
      if (booking.userId === userId) return Promise.reject({ message: 'No puedes unirte a tu propia partida.' });
      
      const pending = booking.pendingPlayerIds || [];
      const joined = booking.joinedPlayerIds || [];

      if (pending.includes(userId) || joined.includes(userId)) {
          return Promise.reject({ message: 'Ya has solicitado unirte o ya eres parte de esta partida.' });
      }

      const spotsFilled = joined.length;
      if (spotsFilled >= booking.playersNeeded!) {
          return Promise.reject({ message: 'Esta partida ya está completa.' });
      }
      
      if (!booking.pendingPlayerIds) {
          booking.pendingPlayerIds = [];
      }
      booking.pendingPlayerIds.push(userId);
      
      return simulate({ message: 'Solicitud para unirse enviada.' });
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
  
  // --- SUPER ADMIN METHODS ---
  async getAllUsers(): Promise<User[]> {
      return simulate(users);
  }

  async getAdmins(): Promise<User[]> {
      const admins = users.filter(u => u.role === 'ADMIN');
      return simulate(admins);
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    if (users.some(u => u.email === userData.email)) {
      return Promise.reject('Ya existe un usuario con este email.');
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      clubIds: userData.role === 'ADMIN' ? [] : undefined,
    };
    users.push(newUser);
    return simulate(newUser);
  }

  async updateUser(userData: User): Promise<User> {
    const index = users.findIndex(u => u.id === userData.id);
    if (index === -1) return Promise.reject("Usuario no encontrado.");
    
    if (users.some(u => u.email === userData.email && u.id !== userData.id)) {
        return Promise.reject('Ya existe otro usuario con este email.');
    }
    
    users[index] = { ...users[index], ...userData };
    return simulate(users[index]);
  }

  async updateUserStatus(userId: string, isBanned: boolean): Promise<User> {
      const user = users.find(u => u.id === userId);
      if (!user) return Promise.reject("User not found");
      user.isBanned = isBanned;
      return simulate(user);
  }
  
  async createClub(clubData: Omit<Club, 'id'>, adminId?: string): Promise<Club> {
      const newClub: Club = {
          id: `club-${Date.now()}`,
          ...clubData
      };
      clubs.push(newClub);

      if (adminId) {
          const admin = users.find(u => u.id === adminId);
          if (admin && admin.role === 'ADMIN') {
              if (!admin.clubIds) admin.clubIds = [];
              admin.clubIds.push(newClub.id);
          }
      }
      return simulate(newClub);
  }

  async updateClub(clubData: Club, adminId?: string): Promise<Club> {
      const index = clubs.findIndex(c => c.id === clubData.id);
      if (index === -1) return Promise.reject("Club not found");
      
      // Update club details
      clubs[index] = clubData;

      // Find current and new admin
      const currentAdmin = users.find(u => u.clubIds?.includes(clubData.id));
      const newAdmin = users.find(u => u.id === adminId);

      // If admin has changed
      if (currentAdmin?.id !== newAdmin?.id) {
          // Remove from old admin
          if (currentAdmin && currentAdmin.clubIds) {
              currentAdmin.clubIds = currentAdmin.clubIds.filter(id => id !== clubData.id);
          }
          // Add to new admin
          if (newAdmin && newAdmin.role === 'ADMIN') {
              if (!newAdmin.clubIds) newAdmin.clubIds = [];
              newAdmin.clubIds.push(clubData.id);
          }
      }

      return simulate(clubs[index]);
  }

  async deleteClub(clubId: string): Promise<void> {
      // Delete club
      clubs = clubs.filter(c => c.id !== clubId);
      // Delete associated courts
      courts = courts.filter(c => c.clubId !== clubId);
      // Cancel future bookings for this club
      bookings.forEach(b => {
          if (b.clubId === clubId && new Date(b.startTime) > new Date()) {
              b.status = 'CANCELLED';
          }
      });
      // Remove club from admins
      users.forEach(u => {
          if (u.role === 'ADMIN' && u.clubIds) {
              u.clubIds = u.clubIds.filter(id => id !== clubId);
          }
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
  }

}

export const apiService = new ApiService();