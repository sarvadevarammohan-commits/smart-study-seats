import React from 'react';
import { Booking } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { QrCode, X, Clock } from 'lucide-react';

interface MyBookingsProps {
  bookings: Booking[];
  onCheckIn: () => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onCheckIn }) => {
  const { cancelBooking } = useLibrary();

  if (bookings.length === 0) return null;

  return (
    <div className="glass-card p-4 sm:p-6">
      <h2 className="font-display font-bold text-lg text-foreground mb-3">My Bookings</h2>
      <div className="space-y-2">
        {bookings.map((b, i) => (
          <motion.div
            key={b.bookingId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
                b.checkedIn ? 'bg-seat-occupied text-primary-foreground' : 'bg-seat-reserved text-primary-foreground'
              }`}>
                {b.seatId}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {b.checkedIn ? '✅ Checked In' : '⏳ Awaiting Check-in'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Until {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!b.checkedIn && (
                <Button size="sm" variant="default" onClick={onCheckIn} className="gap-1 h-8 text-xs">
                  <QrCode className="w-3.5 h-3.5" /> Check In
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => cancelBooking(b.bookingId)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;
