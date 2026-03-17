import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Seat, Booking, SeatStatus, HourlyData, AnalyticsData, Complaint, ComplaintStatus } from '@/types/library';
import { useToast } from '@/hooks/use-toast';

interface LibraryContextType {
  seats: Seat[];
  bookings: Booking[];
  userBookingsToday: Booking[];
  bookSeat: (seatId: string, userId: string, userName: string, durationHours?: number, startDate?: Date, endDate?: Date) => boolean;
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
  // 4 blocks, 9 seats each (3 top, 3 left, 3 right around a round table)
  for (let block = 1; block <= 4; block++) {
    for (let s = 1; s <= 9; s++) {
      const seatNum = (block - 1) * 9 + s;
      seats.push({
        seatId: `S${seatNum}`,
        status: 'available',
        currentUser: null,
        expiryTime: null,
        blockNumber: block,
        qrToken: generateQRToken(`S${seatNum}`),
      });
    }
  }
  // Some pre-occupied/reserved seats for demo
  seats[2].status = 'occupied';
  seats[2].currentUser = 'stu-002';
  seats[10].status = 'reserved';
  seats[10].currentUser = 'stu-003';
  seats[10].expiryTime = new Date(Date.now() + 50 * 60000).toISOString();
  seats[20].status = 'occupied';
  seats[20].currentUser = 'stu-004';
  seats[30].status = 'reserved';
  seats[30].currentUser = 'stu-005';
  seats[30].expiryTime = new Date(Date.now() + 30 * 60000).toISOString();
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

  const bookSeat = useCallback((seatId: string, userId: string, userName: string, durationHours?: number, startDate?: Date, endDate?: Date): boolean => {
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
    const startTime = startDate || now;
    const endTime = endDate || new Date(now.getTime() + (durationHours || 1) * 60 * 60000);
    const checkInDeadline = new Date(startTime.getTime() + 10 * 60000); // 10 min from start

    setSeats(prev => prev.map(s =>
      s.seatId === seatId
        ? { ...s, status: 'reserved' as SeatStatus, currentUser: userId, expiryTime: checkInDeadline.toISOString() }
        : s
    ));

    const newBooking: Booking = {
      bookingId: `BK-${Date.now()}`,
      userId,
      seatId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      checkedIn: false,
      userName,
    };
    setBookings(prev => [...prev, newBooking]);

    const durMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    const durLabel = durMins >= 60 ? `${(durMins / 60).toFixed(1).replace('.0', '')} hr${durMins > 60 ? 's' : ''}` : `${durMins} min`;
    toast({ title: '✅ Seat booked!', description: `${seatId} reserved for ${durLabel}. Check in within 10 min of start.` });
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
