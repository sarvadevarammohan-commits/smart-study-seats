import React, { useState } from 'react';
import { Booking } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

interface ComplaintDialogProps {
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
}

const ComplaintDialog: React.FC<ComplaintDialogProps> = ({ open, onClose, bookings }) => {
  const { fileComplaint } = useLibrary();
  const { user } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!selectedBooking || !message.trim() || !user) return;
    const booking = bookings.find(b => b.bookingId === selectedBooking);
    if (!booking) return;
    fileComplaint(user.userId, user.name, booking.seatId, booking.bookingId, message.trim());
    setMessage('');
    setSelectedBooking('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Report a Problem
          </DialogTitle>
          <DialogDescription>
            Select the booking and describe your issue (e.g. someone is sitting in your reserved seat).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select Booking</label>
            <Select value={selectedBooking} onValueChange={setSelectedBooking}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a booking" />
              </SelectTrigger>
              <SelectContent>
                {bookings.map(b => (
                  <SelectItem key={b.bookingId} value={b.bookingId}>
                    Seat {b.seatId} — {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Describe the issue</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Someone else is occupying my reserved seat S5..."
              maxLength={500}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!selectedBooking || !message.trim()}>
            Submit Complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintDialog;
