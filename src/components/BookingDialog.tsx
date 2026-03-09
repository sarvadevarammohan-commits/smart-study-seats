import React, { useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Armchair, Clock, AlertTriangle } from 'lucide-react';

interface BookingDialogProps {
  seat: Seat;
  open: boolean;
  onClose: () => void;
}

const BookingDialog: React.FC<BookingDialogProps> = ({ seat, open, onClose }) => {
  const { user } = useAuth();
  const { bookSeat, bookings } = useLibrary();
  const [durationHours, setDurationHours] = useState(1);

  const todayBookings = bookings.filter(
    b => b.userId === user?.userId && new Date(b.startTime).toDateString() === new Date().toDateString()
  );

  const now = new Date();
  const endTime = new Date(now.getTime() + durationHours * 60 * 60000);

  const handleBook = () => {
    if (user) {
      bookSeat(seat.seatId, user.userId, user.name, durationHours);
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
          {/* Duration slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Duration
              </span>
              <span className="text-sm font-bold text-foreground">{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
            </div>
            <Slider
              value={[durationHours]}
              onValueChange={([v]) => setDurationHours(v)}
              min={1}
              max={3}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 hr</span>
              <span>2 hrs</span>
              <span>3 hrs</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>📅 {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span>Check in via QR within 10 minutes</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Bookings today: {todayBookings.length}/2
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBook} disabled={todayBookings.length >= 2}>
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
