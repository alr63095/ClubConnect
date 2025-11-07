export type UserRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId?: string;
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
}
