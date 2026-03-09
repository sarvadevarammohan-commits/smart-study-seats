import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { Seat } from '@/types/library';
import SeatMap from '@/components/SeatMap';
import BookingDialog from '@/components/BookingDialog';
import MyBookings from '@/components/MyBookings';
import QRCheckIn from '@/components/QRCheckIn';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { Armchair, Clock, CalendarCheck } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { seats, bookings, getStats } = useLibrary();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showQR, setShowQR] = useState(false);

  const stats = getStats();
  const myBookings = bookings.filter(b => b.userId === user?.userId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Armchair className="w-5 h-5 text-primary" />} label="Available" value={stats.available} />
          <StatCard icon={<Clock className="w-5 h-5 text-seat-reserved" />} label="Reserved" value={stats.reserved} />
          <StatCard icon={<CalendarCheck className="w-5 h-5 text-seat-occupied" />} label="Occupied" value={stats.occupied} />
        </div>

        {/* Seat Map */}
        <SeatMap seats={seats} onSeatClick={s => s.status === 'available' && setSelectedSeat(s)} bookings={bookings} />

        {/* My Bookings */}
        <MyBookings
          bookings={myBookings}
          onCheckIn={() => setShowQR(true)}
        />

        {/* Booking Dialog */}
        {selectedSeat && (
          <BookingDialog
            seat={selectedSeat}
            open={!!selectedSeat}
            onClose={() => setSelectedSeat(null)}
          />
        )}

        {/* QR Check-in */}
        {showQR && (
          <QRCheckIn
            open={showQR}
            onClose={() => setShowQR(false)}
            bookings={myBookings}
          />
        )}
      </main>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card"
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className="text-2xl font-display font-bold text-foreground">{value}</span>
  </motion.div>
);

export default StudentDashboard;
