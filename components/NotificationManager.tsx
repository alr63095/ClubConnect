
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { differenceInHours } from 'date-fns';

const NotificationManager: React.FC = () => {
    const { user, selectedClubId } = useAuth();
    const navigate = useNavigate();
    
    // Refs to track sent notifications and avoid duplicates in the same session
    const notifiedUpcomingRef = useRef<Set<string>>(new Set());
    const notifiedJoinRequestsRef = useRef<Set<string>>(new Set());
    const notifiedCancellationsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Request permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const checkNotifications = async () => {
            if (!('Notification' in window) || Notification.permission !== 'granted') return;

            try {
                const now = new Date();

                // --- 1. Player Notifications ---
                // Users can be both Players and Admins
                const myBookings = await apiService.getUserBookings(user.id);

                // A) Upcoming Bookings Reminder (approx 24h before)
                myBookings.forEach(booking => {
                    if (booking.status === 'CANCELLED') return;
                    
                    const startTime = new Date(booking.startTime);
                    const hoursDiff = differenceInHours(startTime, now);

                    // Notify if the booking is between 23 and 25 hours away
                    // This ensures we catch it around the 24h mark
                    if (hoursDiff >= 23 && hoursDiff <= 25 && !notifiedUpcomingRef.current.has(booking.id)) {
                        const n = new Notification('Recordatorio de Reserva', {
                            body: `Tienes una reserva en ${booking.club.name} mañana a las ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
                            tag: `upcoming-${booking.id}`, // Prevents duplicate notifications in OS
                        });
                        n.onclick = () => { window.focus(); navigate('/bookings'); };
                        notifiedUpcomingRef.current.add(booking.id);
                    }
                });

                // B) Join Requests for my hosted games
                const myHostedBookings = myBookings.filter(b => 
                    b.status === 'CONFIRMED' && 
                    b.userId === user.id && // I am the owner
                    b.playersNeeded && b.playersNeeded > 0 // It is a public game
                );

                myHostedBookings.forEach(booking => {
                        if (booking.pendingPlayers && booking.pendingPlayers.length > 0) {
                            booking.pendingPlayers.forEach(player => {
                                const key = `${booking.id}-${player.id}`;
                                if (!notifiedJoinRequestsRef.current.has(key)) {
                                    const n = new Notification('Solicitud para unirse', {
                                        body: `${player.name} quiere unirse a tu partida de ${booking.court.sport}.`,
                                        tag: `join-${key}`
                                    });
                                    n.onclick = () => { window.focus(); navigate('/bookings'); };
                                    notifiedJoinRequestsRef.current.add(key);
                                }
                            });
                        }
                });

                // --- 2. Admin Notifications ---
                // Cancellation Requests for Admins (< 24h urgent approval)
                if (user.role === 'ADMIN' && selectedClubId) {
                    const clubBookings = await apiService.getAllClubBookings(selectedClubId);
                    const pendingCancellations = clubBookings.filter(b => b.status === 'PENDING_CANCELLATION');

                    pendingCancellations.forEach(booking => {
                        if (!notifiedCancellationsRef.current.has(booking.id)) {
                            const n = new Notification('Cancelación Pendiente', {
                                body: `El usuario ${booking.user.name} ha solicitado cancelar una reserva urgente (<24h).`,
                                tag: `cancel-${booking.id}`
                            });
                            n.onclick = () => { window.focus(); navigate('/admin/dashboard'); };
                            notifiedCancellationsRef.current.add(booking.id);
                        }
                    });
                }

            } catch (error) {
                console.error("Error checking notifications:", error);
            }
        };

        // Check immediately on load/login
        checkNotifications();

        // Poll every minute
        const intervalId = setInterval(checkNotifications, 60 * 1000);

        return () => clearInterval(intervalId);

    }, [user, selectedClubId, navigate]);

    return null;
};

export default NotificationManager;
