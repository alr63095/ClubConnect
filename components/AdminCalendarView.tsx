
import React, { useMemo } from 'react';
import { Booking, Court, User } from '../types';
import { format } from 'date-fns';

interface AdminCalendarViewProps {
  courts: Court[];
  bookings: (Booking & { court: Court; user: User })[];
  date: Date;
}

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({ courts, bookings, date }) => {

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h < 23; h++) {
        slots.push(`${String(h).padStart(2,'0')}:00`);
        slots.push(`${String(h).padStart(2,'0')}:30`);
    }
    return slots;
  }, []);

  const getBookingForSlot = (courtId: string, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hour, minute, 0, 0);

    return bookings.find(b => 
        b.courtId === courtId &&
        slotDate >= b.startTime &&
        slotDate < b.endTime
    );
  };
  
  const getBookingStyle = (booking: Booking) => {
    const durationMinutes = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60);
    const height = (durationMinutes / 30); // 1 cell per 30 mins
    return {
        height: `calc(${height} * 3rem - 4px)`,
        top: `2px`,
    };
  }

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <div className="min-w-max flex">
                <div className="sticky left-0 bg-gray-100 z-10">
                    <div className="h-16 border-b border-r flex items-center justify-center w-32">
                        <span className="font-semibold text-muted">Hora</span>
                    </div>
                    {timeSlots.map(time => (
                        <div key={time} className="h-12 border-b border-r flex items-center justify-center w-32">
                            <span className="text-sm text-muted">{time}</span>
                        </div>
                    ))}
                </div>
                <div className="flex-grow flex">
                    {courts.map(court => (
                        <div key={court.id} className="w-48 border-r flex-shrink-0">
                            <div className="h-16 border-b flex items-center justify-center text-center p-2">
                                <span className="font-semibold text-text">{court.name}</span>
                            </div>
                            <div className="relative">
                                {timeSlots.map((time, index) => (
                                    <div key={`${court.id}-${time}`} className="h-12 border-b relative">
                                        { getBookingForSlot(court.id, time) && new Date(`1970-01-01T${time}:00`).getMinutes() === getBookingForSlot(court.id, time)!.startTime.getMinutes() &&
                                            (
                                                <div 
                                                  className="absolute left-0 w-full bg-primary text-white rounded-md p-1 z-20 text-xs overflow-hidden"
                                                  style={getBookingStyle(getBookingForSlot(court.id, time)!)}
                                                >
                                                    <p className="font-bold truncate">{getBookingForSlot(court.id, time)?.user.name}</p>
                                                    <p>{format(getBookingForSlot(court.id, time)!.startTime, 'HH:mm')} - {format(getBookingForSlot(court.id, time)!.endTime, 'HH:mm')}</p>
                                                </div>
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminCalendarView;
