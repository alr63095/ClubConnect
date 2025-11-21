
export type UserRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubIds?: string[]; // Un admin puede gestionar varios clubs
  isBanned?: boolean;
  sportPreferences?: { sport: string; skillLevel: number }[];
  avatar?: string; // Base64 string de la imagen de perfil
}

export interface Club {
  id: string;
  name: string;
  sports: string[];
}

export interface Court {
  id: string;
  clubId: string;
  name: string;
  sport: string;
  features: string[];
  // Nuevos campos para horarios y precios personalizados
  openingTime: string; // "HH:mm" e.g., "09:00"
  closingTime: string; // "HH:mm" e.g., "23:00"
  defaultPrice: number;
  slotPrices: { time: string; price: number }[];
}

export interface TimeSlot {
  time: string; // e.g. "09:00"
  available: boolean;
  price: number;
}

export type BookingStatus = 'CONFIRMED' | 'PENDING_CANCELLATION' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  clubId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: BookingStatus;
  // For forum posts
  playersNeeded?: number;
  skillLevel?: number;
  joinedPlayerIds?: string[];
  pendingPlayerIds?: string[];
}


// Tipo enriquecido para usar en la UI
export type EnrichedBooking = Booking & {
  court: Court;
  club: Club;
  user: User; // El creador de la reserva
  // Enriched for forum
  joinedPlayers?: User[];
  pendingPlayers?: User[];
};
