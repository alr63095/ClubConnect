export enum UserRole {
  Admin = 'ADMIN',
  Player = 'PLAYER',
}

export type BookingStatus = 'CONFIRMED' | 'PENDING_CANCELLATION' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId?: string; // Only for Admins
}

export interface Club {
  id: string;
  name: string;
  address: string;
  sports: string[];
  logoUrl: string;
}

export interface Court {
  id: string;
  name: string;
  sport: string;
  clubId: string;
  features: string[]; // e.g., 'Cubierta', 'Iluminación LED'
}

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: BookingStatus;
}

export interface TimeSlot {
    time: string;
    available: boolean;
    price: number;
}