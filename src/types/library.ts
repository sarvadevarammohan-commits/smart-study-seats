export type SeatStatus = 'available' | 'reserved' | 'occupied';
export type UserRole = 'student' | 'admin';

export interface User {
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  role: UserRole;
  dailyBookingCount: number;
  branch?: string;
  year?: string;
  subject?: string;
}

export interface Seat {
  seatId: string;
  status: SeatStatus;
  currentUser: string | null;
  expiryTime: string | null;
  blockNumber: number;
  qrToken: string;
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

export type ComplaintStatus = 'pending' | 'resolved' | 'dismissed';

export interface Complaint {
  complaintId: string;
  userId: string;
  userName: string;
  seatId: string;
  bookingId: string;
  message: string;
  status: ComplaintStatus;
  createdAt: string;
  adminNote?: string;
}
