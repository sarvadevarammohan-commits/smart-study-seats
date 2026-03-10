import React, { useState, useEffect } from 'react';
import { Booking } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Clock, AlertTriangle, TimerOff } from 'lucide-react';

interface MyBookingsProps {
  bookings: Booking[];
  onCheckIn: () => void;
}

function useCountdown(bookings: Booking[]) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return bookings.map(b => {
    const endMs = new Date(b.endTime).getTime();
    const remainingMs = endMs - now;
    const remainingMins = Math.max(0, Math.ceil(remainingMs / 60000));
    const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
    return { ...b, remainingMs, remainingMins, remainingSecs };
  });
}

function formatCountdown(totalSecs: number): string {
  if (totalSecs <= 0) return '0:00';
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onCheckIn }) => {
  const { cancelBooking } = useLibrary();
  const bookingsWithTime = useCountdown(bookings);

  if (bookings.length === 0) return null;

  return (
    <div className="glass-card p-4 sm:p-6">
      <h2 className="font-display font-bold text-lg text-foreground mb-3">My Bookings</h2>
      <div className="space-y-2">
        <AnimatePresence>
          {bookingsWithTime.map((b, i) => {
            const isExpired = b.remainingMs <= 0 && b.checkedIn;
            const isUrgent = b.checkedIn && b.remainingMins <= 10 && b.remainingMs > 0;

            return (
              <motion.div
                key={b.bookingId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className={`flex flex-col p-3 rounded-lg border transition-colors ${
                  isExpired
                    ? 'bg-destructive/10 border-destructive/30'
                    : isUrgent
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-secondary/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
                      b.checkedIn ? 'bg-seat-occupied text-primary-foreground' : 'bg-seat-reserved text-primary-foreground'
                    }`}>
                      {b.seatId}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isExpired ? '⏰ Time\'s Up!' : b.checkedIn ? '✅ Checked In' : '⏳ Awaiting Check-in'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                </div>

                {/* Countdown bar for checked-in bookings */}
                {b.checkedIn && (
                  <div className="mt-2">
                    {isExpired ? (
                      <div className="flex items-center gap-2 text-destructive text-xs font-medium">
                        <TimerOff className="w-3.5 h-3.5" />
                        <span>Booking expired — please check out now!</span>
                      </div>
                    ) : isUrgent ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-500 text-xs font-medium animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Only {formatCountdown(b.remainingSecs)} left — prepare to check out!</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Time remaining: {formatCountdown(b.remainingSecs)}</span>
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isExpired ? 'bg-destructive' : isUrgent ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, (b.remainingMs / (new Date(b.endTime).getTime() - new Date(b.startTime).getTime())) * 100))}%`,
                        }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyBookings;
