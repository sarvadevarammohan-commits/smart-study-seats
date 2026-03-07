export type SeatStatus = 'available' | 'reserved' | 'occupied';
export type UserRole = 'student' | 'admin';

export interface User {
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  role: UserRole;
  dailyBookingCount: number;
}

export interface Seat {
  seatId: string;
  status: SeatStatus;
  currentUser: string | null;
  expiryTime: string | null;
  blockNumber: number;
}

export interface Booking {
  bookingId: string;
  userId: string;
  seatId: string;
  startTime: string;
  endTime: string;
  checkedIn: boolean;
  userName?: string;
}

export interface AnalyticsData {
  date: string;
  totalBookings: number;
  noShows: number;
  peakHour: number;
}

export interface HourlyData {
  hour: string;
  occupancy: number;
}
