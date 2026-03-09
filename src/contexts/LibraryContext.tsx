import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Seat, Booking, SeatStatus, HourlyData, AnalyticsData } from '@/types/library';
import { useToast } from '@/hooks/use-toast';

interface LibraryContextType {
  seats: Seat[];
  bookings: Booking[];
  userBookingsToday: Booking[];
  bookSeat: (seatId: string, userId: string, userName: string, durationHours?: number) => boolean;
  checkIn: (seatId: string, userId: string) => boolean;
  cancelBooking: (bookingId: string) => void;
  releaseSeat: (seatId: string) => void;
  addSeat: (blockNumber: number) => void;
  removeSeat: (seatId: string) => void;
  getStats: () => { total: number; available: number; reserved: number; occupied: number };
  hourlyData: HourlyData[];
  analyticsHistory: AnalyticsData[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

function generateQRToken(seatId: string): string {
  return `QR-${seatId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  for (let i = 1; i <= 15; i++) {
    const block = Math.ceil(i / 3);
    seats.push({
      seatId: `S${i}`,
      status: 'available',
      currentUser: null,
      expiryTime: null,
      blockNumber: block,
      qrToken: generateQRToken(`S${i}`),
    });
  }
  seats[2].status = 'occupied';
  seats[2].currentUser = 'stu-002';
  seats[6].status = 'reserved';
  seats[6].currentUser = 'stu-003';
  seats[6].expiryTime = new Date(Date.now() + 50 * 60000).toISOString();
  seats[10].status = 'occupied';
  seats[10].currentUser = 'stu-004';
  seats[13].status = 'reserved';
  seats[13].currentUser = 'stu-005';
  seats[13].expiryTime = new Date(Date.now() + 30 * 60000).toISOString();
  return seats;
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
  const [seats, setSeats] = useState<Seat[]>(generateInitialSeats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hourlyData] = useState<HourlyData[]>(generateHourlyData);
  const [analyticsHistory] = useState<AnalyticsData[]>(generateAnalyticsHistory);
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Auto-release expired bookings every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setSeats(prev => prev.map(s => {
        if (s.status === 'reserved' && s.expiryTime && new Date(s.expiryTime) < new Date()) {
          toast({ title: `Seat ${s.seatId} auto-released`, description: 'Booking expired without check-in.' });
          return { ...s, status: 'available' as SeatStatus, currentUser: null, expiryTime: null };
        }
        return s;
      }));
      setBookings(prev => prev.filter(b => {
        if (!b.checkedIn && new Date(b.endTime) < new Date()) return false;
        return true;
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  const getUserBookingsToday = useCallback((userId?: string) => {
    const today = new Date().toDateString();
    return bookings.filter(b => b.userId === userId && new Date(b.startTime).toDateString() === today);
  }, [bookings]);

  const bookSeat = useCallback((seatId: string, userId: string, userName: string): boolean => {
    const seat = seats.find(s => s.seatId === seatId);
    if (!seat || seat.status !== 'available') {
      toast({ title: 'Booking failed', description: 'Seat is not available.', variant: 'destructive' });
      return false;
    }

    const todayBookings = getUserBookingsToday(userId);
    if (todayBookings.length >= 2) {
      toast({ title: 'Limit reached', description: 'Max 2 bookings per day.', variant: 'destructive' });
      return false;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60000); // 1 hour
    const checkInDeadline = new Date(now.getTime() + 10 * 60000); // 10 min

    setSeats(prev => prev.map(s =>
      s.seatId === seatId
        ? { ...s, status: 'reserved' as SeatStatus, currentUser: userId, expiryTime: checkInDeadline.toISOString() }
        : s
    ));

    const newBooking: Booking = {
      bookingId: `BK-${Date.now()}`,
      userId,
      seatId,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      checkedIn: false,
      userName,
    };
    setBookings(prev => [...prev, newBooking]);

    toast({ title: '✅ Seat booked!', description: `${seatId} reserved for 1 hour. Check in within 10 min.` });
    return true;
  }, [seats, getUserBookingsToday, toast]);

  const checkIn = useCallback((seatId: string, userId: string): boolean => {
    const booking = bookings.find(b => b.seatId === seatId && b.userId === userId && !b.checkedIn);
    if (!booking) {
      toast({ title: 'Check-in failed', description: 'No matching booking found.', variant: 'destructive' });
      return false;
    }

    setSeats(prev => prev.map(s =>
      s.seatId === seatId
        ? { ...s, status: 'occupied' as SeatStatus, expiryTime: booking.endTime }
        : s
    ));
    setBookings(prev => prev.map(b =>
      b.bookingId === booking.bookingId ? { ...b, checkedIn: true } : b
    ));

    toast({ title: '🎉 Checked in!', description: `You're now occupying ${seatId}.` });
    return true;
  }, [bookings, toast]);

  const cancelBooking = useCallback((bookingId: string) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (booking) {
      setSeats(prev => prev.map(s =>
        s.seatId === booking.seatId
          ? { ...s, status: 'available' as SeatStatus, currentUser: null, expiryTime: null }
          : s
      ));
      setBookings(prev => prev.filter(b => b.bookingId !== bookingId));
      toast({ title: 'Booking cancelled', description: `${booking.seatId} is now available.` });
    }
  }, [bookings, toast]);

  const releaseSeat = useCallback((seatId: string) => {
    setSeats(prev => prev.map(s =>
      s.seatId === seatId
        ? { ...s, status: 'available' as SeatStatus, currentUser: null, expiryTime: null }
        : s
    ));
    setBookings(prev => prev.filter(b => b.seatId !== seatId));
  }, []);

  const addSeat = useCallback((blockNumber: number) => {
    const maxNum = Math.max(...seats.map(s => parseInt(s.seatId.replace('S', ''))), 0);
    const seatId = `S${maxNum + 1}`;
    const newSeat: Seat = {
      seatId,
      status: 'available',
      currentUser: null,
      expiryTime: null,
      blockNumber,
      qrToken: generateQRToken(seatId),
    };
    setSeats(prev => [...prev, newSeat]);
    toast({ title: 'Seat added', description: `${newSeat.seatId} added to Block ${blockNumber} with unique QR code.` });
  }, [seats, toast]);

  const removeSeat = useCallback((seatId: string) => {
    setSeats(prev => prev.filter(s => s.seatId !== seatId));
    setBookings(prev => prev.filter(b => b.seatId !== seatId));
    toast({ title: 'Seat removed', description: `${seatId} has been removed.` });
  }, [toast]);

  const getStats = useCallback(() => {
    const total = seats.length;
    const available = seats.filter(s => s.status === 'available').length;
    const reserved = seats.filter(s => s.status === 'reserved').length;
    const occupied = seats.filter(s => s.status === 'occupied').length;
    return { total, available, reserved, occupied };
  }, [seats]);

  const toggleDarkMode = useCallback(() => setIsDarkMode(p => !p), []);

  return (
    <LibraryContext.Provider value={{
      seats, bookings, userBookingsToday: [], bookSeat, checkIn, cancelBooking,
      releaseSeat, addSeat, removeSeat, getStats, hourlyData, analyticsHistory,
      isDarkMode, toggleDarkMode,
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
