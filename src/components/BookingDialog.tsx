import React from 'react';
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
import { Armchair, Clock, AlertTriangle } from 'lucide-react';

interface BookingDialogProps {
  seat: Seat;
  open: boolean;
  onClose: () => void;
}

const BookingDialog: React.FC<BookingDialogProps> = ({ seat, open, onClose }) => {
  const { user } = useAuth();
  const { bookSeat, bookings } = useLibrary();

  const todayBookings = bookings.filter(
    b => b.userId === user?.userId && new Date(b.startTime).toDateString() === new Date().toDateString()
  );

  const handleBook = () => {
    if (user) {
      bookSeat(seat.seatId, user.userId, user.name);
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

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Duration: 1 hour from now</span>
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
