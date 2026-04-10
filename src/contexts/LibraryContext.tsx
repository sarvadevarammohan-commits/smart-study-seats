import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Seat, Booking, SeatStatus, HourlyData, AnalyticsData, Complaint, ComplaintStatus } from '@/types/library';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LibraryContextType {
  seats: Seat[];
  bookings: Booking[];
  userBookingsToday: Booking[];
  bookSeat: (seatId: string, userId: string, userName: string, durationHours?: number, startDate?: Date, endDate?: Date) => Promise<boolean>;
  checkIn: (seatId: string, userId: string) => Promise<boolean>;
  cancelBooking: (bookingId: string) => void;
  releaseSeat: (seatId: string) => void;
  addSeat: (blockNumber: number) => void;
  removeSeat: (seatId: string) => void;
  getStats: () => { total: number; available: number; reserved: number; occupied: number };
  hourlyData: HourlyData[];
  analyticsHistory: AnalyticsData[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  complaints: Complaint[];
  fileComplaint: (userId: string, userName: string, seatId: string, bookingId: string, message: string) => void;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus, adminNote?: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

function generateQRToken(seatId: string): string {
  return `QR-${seatId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapSeatRow(row: any): Seat {
  return {
    id: row.id,
    seatId: row.seat_id,
    status: row.status as SeatStatus,
    currentUserId: row.current_user_id,
    expiryTime: row.expiry_time,
    blockNumber: row.block_number,
    qrToken: row.qr_token,
  };
}

function mapBookingRow(row: any): Booking {
  return {
    id: row.id,
    bookingId: row.id,
    userId: row.user_id,
    seatId: row.seat_id,
    startTime: row.start_time,
    endTime: row.end_time,
    checkedIn: row.checked_in,
    userName: row.user_name,
  };
}

function mapComplaintRow(row: any): Complaint {
  return {
    id: row.id,
    complaintId: row.id,
    userId: row.user_id,
    userName: row.user_name,
    seatId: row.seat_id,
    bookingId: row.booking_id || '',
    message: row.message,
    status: row.status as ComplaintStatus,
    createdAt: row.created_at,
    adminNote: row.admin_note,
  };
}

function generateHourlyData(): HourlyData[] {
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${8 + i}:00`,
    occupancy: Math.floor(Math.random() * 15) + 1,
  }));
}

function generateAnalyticsHistory(): AnalyticsData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      totalBookings: Math.floor(Math.random() * 30) + 10,
      noShows: Math.floor(Math.random() * 5),
      peakHour: Math.floor(Math.random() * 4) + 10,
    };
  });
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hourlyData] = useState<HourlyData[]>(generateHourlyData);
  const [analyticsHistory] = useState<AnalyticsData[]>(generateAnalyticsHistory);
  const { toast } = useToast();

  // Fetch seats immediately (public), but wait for auth for bookings/complaints
  useEffect(() => {
    const fetchSeats = async () => {
      const { data } = await supabase.from('seats').select('*').order('seat_id');
      if (data) {
        const sorted = data
          .map(mapSeatRow)
          .sort((a, b) => {
            const numA = parseInt(a.seatId.replace('S', ''));
            const numB = parseInt(b.seatId.replace('S', ''));
            return numA - numB;
          });
        setSeats(sorted);
      }
      // If not authenticated, we're done loading
      if (!isAuthenticated) setLoading(false);
    };
    fetchSeats();
  }, []);

  // Fetch bookings & complaints only when authenticated
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const fetchAuthData = async () => {
      const [bookingsRes, complaintsRes] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      ]);
      if (bookingsRes.data) setBookings(bookingsRes.data.map(mapBookingRow));
      if (complaintsRes.data) setComplaints(complaintsRes.data.map(mapComplaintRow));
      setLoading(false);
    };
    fetchAuthData();
  }, [authLoading, isAuthenticated]);

  // Real-time subscriptions
  useEffect(() => {
    const seatsChannel = supabase
      .channel('realtime-seats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seats' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSeats(prev => [...prev, mapSeatRow(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setSeats(prev => prev.map(s => s.id === payload.new.id ? mapSeatRow(payload.new) : s));
        } else if (payload.eventType === 'DELETE') {
          setSeats(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const bookingsChannel = supabase
      .channel('realtime-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookings(prev => [mapBookingRow(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setBookings(prev => prev.map(b => b.id === payload.new.id ? mapBookingRow(payload.new) : b));
        } else if (payload.eventType === 'DELETE') {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    const complaintsChannel = supabase
      .channel('realtime-complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComplaints(prev => [mapComplaintRow(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setComplaints(prev => prev.map(c => c.id === payload.new.id ? mapComplaintRow(payload.new) : c));
        } else if (payload.eventType === 'DELETE') {
          setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(seatsChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(complaintsChannel);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const bookSeat = useCallback(async (seatId: string, userId: string, userName: string, durationHours?: number, startDate?: Date, endDate?: Date): Promise<boolean> => {
    const seat = seats.find(s => s.seatId === seatId);
    if (!seat || seat.status !== 'available') {
      toast({ title: 'Booking failed', description: 'Seat is not available.', variant: 'destructive' });
      return false;
    }

    // Check daily limit
    const today = new Date().toDateString();
    const todayBookings = bookings.filter(b => b.userId === userId && new Date(b.startTime).toDateString() === today);
    if (todayBookings.length >= 2) {
      toast({ title: 'Limit reached', description: 'Max 2 bookings per day.', variant: 'destructive' });
      return false;
    }

    const now = new Date();
    const startTime = startDate || now;
    const endTime = endDate || new Date(now.getTime() + (durationHours || 1) * 60 * 60000);
    const checkInDeadline = new Date(startTime.getTime() + 10 * 60000);

    // Update seat
    const { error: seatError } = await supabase.from('seats').update({
      status: 'reserved' as any,
      current_user_id: userId,
      expiry_time: checkInDeadline.toISOString(),
    }).eq('seat_id', seatId);

    if (seatError) {
      toast({ title: 'Booking failed', description: seatError.message, variant: 'destructive' });
      return false;
    }

    // Create booking
    const { error: bookingError } = await supabase.from('bookings').insert({
      user_id: userId,
      seat_id: seatId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      checked_in: false,
      user_name: userName,
    });

    if (bookingError) {
      toast({ title: 'Booking failed', description: bookingError.message, variant: 'destructive' });
      return false;
    }

    const durMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    const durLabel = durMins >= 60 ? `${(durMins / 60).toFixed(1).replace('.0', '')} hr${durMins > 60 ? 's' : ''}` : `${durMins} min`;
    toast({ title: '✅ Seat booked!', description: `${seatId} reserved for ${durLabel}. Check in within 10 min of start.` });
    return true;
  }, [seats, bookings, toast]);

  const checkIn = useCallback(async (seatId: string, userId: string): Promise<boolean> => {
    const booking = bookings.find(b => b.seatId === seatId && b.userId === userId && !b.checkedIn);
    if (!booking) {
      toast({ title: 'Check-in failed', description: 'No matching booking found.', variant: 'destructive' });
      return false;
    }

    await supabase.from('seats').update({
      status: 'occupied' as any,
      expiry_time: booking.endTime,
    }).eq('seat_id', seatId);

    await supabase.from('bookings').update({
      checked_in: true,
    }).eq('id', booking.id);

    toast({ title: '🎉 Checked in!', description: `You're now occupying ${seatId}.` });
    return true;
  }, [bookings, toast]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId || b.bookingId === bookingId);
    if (booking) {
      await supabase.from('seats').update({
        status: 'available' as any,
        current_user_id: null,
        expiry_time: null,
      }).eq('seat_id', booking.seatId);

      await supabase.from('bookings').delete().eq('id', booking.id);
      toast({ title: 'Booking cancelled', description: `${booking.seatId} is now available.` });
    }
  }, [bookings, toast]);

  const releaseSeat = useCallback(async (seatId: string) => {
    await supabase.from('seats').update({
      status: 'available' as any,
      current_user_id: null,
      expiry_time: null,
    }).eq('seat_id', seatId);

    await supabase.from('bookings').delete().eq('seat_id', seatId);
  }, []);

  const addSeat = useCallback(async (blockNumber: number) => {
    const maxNum = seats.length > 0
      ? Math.max(...seats.map(s => parseInt(s.seatId.replace('S', ''))))
      : 0;
    const seatId = `S${maxNum + 1}`;

    const { error } = await supabase.from('seats').insert({
      seat_id: seatId,
      status: 'available' as any,
      block_number: blockNumber,
      qr_token: generateQRToken(seatId),
    });

    if (!error) {
      toast({ title: 'Seat added', description: `${seatId} added to Block ${blockNumber} with unique QR code.` });
    }
  }, [seats, toast]);

  const removeSeat = useCallback(async (seatId: string) => {
    await supabase.from('bookings').delete().eq('seat_id', seatId);
    await supabase.from('seats').delete().eq('seat_id', seatId);
    toast({ title: 'Seat removed', description: `${seatId} has been removed.` });
  }, [toast]);

  const getStats = useCallback(() => {
    const total = seats.length;
    let available = 0, reserved = 0, occupied = 0;
    for (const s of seats) {
      if (s.status === 'available') available++;
      else if (s.status === 'reserved') reserved++;
      else occupied++;
    }
    return { total, available, reserved, occupied };
  }, [seats]);

  const toggleDarkMode = useCallback(() => setIsDarkMode(p => !p), []);

  const fileComplaint = useCallback(async (userId: string, userName: string, seatId: string, bookingId: string, message: string) => {
    const { error } = await supabase.from('complaints').insert({
      user_id: userId,
      user_name: userName,
      seat_id: seatId,
      booking_id: bookingId,
      message,
      status: 'pending' as any,
    });

    if (!error) {
      toast({ title: '📩 Complaint filed', description: 'Your complaint has been sent to the admin.' });
    }
  }, [toast]);

  const updateComplaintStatus = useCallback(async (complaintId: string, status: ComplaintStatus, adminNote?: string) => {
    await supabase.from('complaints').update({
      status: status as any,
      admin_note: adminNote,
    }).eq('id', complaintId);

    toast({ title: 'Complaint updated', description: `Complaint marked as ${status}.` });
  }, [toast]);

  return (
    <LibraryContext.Provider value={{
      seats, bookings, userBookingsToday: [], bookSeat, checkIn, cancelBooking,
      releaseSeat, addSeat, removeSeat, getStats, hourlyData, analyticsHistory,
      isDarkMode, toggleDarkMode, complaints, fileComplaint, updateComplaintStatus, loading,
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
};
