import React, { useState } from 'react';
import { Booking } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bug } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [tab, setTab] = useState<string>('seat');
  const [appIssue, setAppIssue] = useState('');

  const handleSeatComplaint = () => {
    if (!selectedBooking || !message.trim() || !user) return;
    const booking = bookings.find(b => b.bookingId === selectedBooking);
    if (!booking) return;
    fileComplaint(user.userId, user.name, booking.seatId, booking.bookingId, message.trim());
    setMessage('');
    setSelectedBooking('');
    onClose();
  };

  const handleAppIssue = () => {
    if (!appIssue.trim() || !user) return;
    fileComplaint(user.userId, user.name, 'N/A', 'APP-ISSUE', appIssue.trim());
    setAppIssue('');
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
            Report a seat issue or an app problem. Admin will review your complaint.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="seat" className="gap-1 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" /> Seat Issue
            </TabsTrigger>
            <TabsTrigger value="app" className="gap-1 text-xs">
              <Bug className="w-3.5 h-3.5" /> App Problem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seat" className="space-y-4 pt-2">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">You have no active bookings to report an issue for.</p>
            ) : (
              <>
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
                <DialogFooter>
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button variant="destructive" onClick={handleSeatComplaint} disabled={!selectedBooking || !message.trim()}>
                    Submit Complaint
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="app" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">What's not working?</label>
              <Textarea
                value={appIssue}
                onChange={e => setAppIssue(e.target.value)}
                placeholder="e.g. The app is not loading properly, QR check-in is failing, seats not updating..."
                maxLength={500}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground text-right">{appIssue.length}/500</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="destructive" onClick={handleAppIssue} disabled={!appIssue.trim()}>
                Report App Issue
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintDialog;
