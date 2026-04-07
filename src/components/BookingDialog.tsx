import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { Seat } from '@/types/library';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Armchair, Clock, AlertTriangle } from 'lucide-react';

interface BookingDialogProps {
  seat: Seat;
  open: boolean;
  onClose: () => void;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 19 && m > 0) break; // cap at 7:00 PM
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const BookingDialog: React.FC<BookingDialogProps> = ({ seat, open, onClose }) => {
  const { user } = useAuth();
  const { bookSeat, bookings } = useLibrary();

  const allSlots = useMemo(() => generateTimeSlots(), []);

  // Default start: next upcoming half-hour slot
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const nextSlotMins = Math.ceil(currentMins / 30) * 30;
  const defaultStart = `${Math.floor(nextSlotMins / 60).toString().padStart(2, '0')}:${(nextSlotMins % 60).toString().padStart(2, '0')}`;
  const defaultEndMins = nextSlotMins + 60;
  const defaultEnd = `${Math.floor(defaultEndMins / 60).toString().padStart(2, '0')}:${(defaultEndMins % 60).toString().padStart(2, '0')}`;

  const [startTime, setStartTime] = useState(allSlots.includes(defaultStart) ? defaultStart : '08:00');
  const [endTime, setEndTime] = useState(allSlots.includes(defaultEnd) ? defaultEnd : '09:00');

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const durationMins = endMins - startMins;
  const isValid = durationMins >= 30 && durationMins <= 180; // 30 min to 3 hrs

  // Filter: start must be >= now (unless booking for future), end must be after start, max 3hrs
  const availableStartSlots = allSlots.filter(s => timeToMinutes(s) >= nextSlotMins - 30);
  const availableEndSlots = allSlots.filter(s => {
    const diff = timeToMinutes(s) - timeToMinutes(startTime);
    return diff >= 30 && diff <= 180;
  });

  const todayBookings = bookings.filter(
    b => b.userId === user?.userId && new Date(b.startTime).toDateString() === new Date().toDateString()
  );

  const handleBook = async () => {
    if (user && isValid) {
      const today = new Date();
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm);
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em);
      await bookSeat(seat.seatId, user.userId, user.name, undefined, start, end);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Armchair className="w-5 h-5 text-primary" />
            Book {seat.seatId}
          </DialogTitle>
          <DialogDescription>Block {seat.blockNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Time selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Start Time</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStartSlots.map(s => (
                    <SelectItem key={s} value={s}>{formatTime12(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">End Time</label>
              <Select value={availableEndSlots.includes(endTime) ? endTime : ''} onValueChange={setEndTime}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableEndSlots.map(s => (
                    <SelectItem key={s} value={s}>{formatTime12(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isValid && (
            <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/50 rounded-lg p-2.5 border border-border">
              <Clock className="w-4 h-4 text-primary" />
              <span>{formatTime12(startTime)} — {formatTime12(endTime)}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {durationMins >= 60 ? `${(durationMins / 60).toFixed(1).replace('.0', '')} hr${durationMins > 60 ? 's' : ''}` : `${durationMins} min`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span>Check in via QR within 10 min of start time</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Bookings today: {todayBookings.length}/2
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBook} disabled={todayBookings.length >= 2 || !isValid}>
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
