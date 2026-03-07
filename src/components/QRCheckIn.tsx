import React, { useState } from 'react';
import { Booking } from '@/types/library';
import { useAuth } from '@/contexts/AuthContext';
import { useLibrary } from '@/contexts/LibraryContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ScanLine } from 'lucide-react';

interface QRCheckInProps {
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
}

const QRCheckIn: React.FC<QRCheckInProps> = ({ open, onClose, bookings }) => {
  const { user } = useAuth();
  const { checkIn } = useLibrary();
  const [scanned, setScanned] = useState(false);

  const pendingBooking = bookings.find(b => !b.checkedIn);

  const handleSimulateScan = () => {
    if (pendingBooking && user) {
      const success = checkIn(pendingBooking.seatId, user.userId);
      if (success) setScanned(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center justify-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            QR Check-In
          </DialogTitle>
          <DialogDescription>
            {scanned ? 'Successfully checked in!' : 'Scan the QR code at your seat'}
          </DialogDescription>
        </DialogHeader>

        {!pendingBooking ? (
          <p className="text-sm text-muted-foreground py-4">No pending bookings to check in.</p>
        ) : scanned ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <p className="text-lg font-display font-bold text-foreground">
              {pendingBooking.seatId} — Checked In
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-card rounded-xl border border-border">
              <QRCodeSVG
                value={JSON.stringify({
                  seatId: pendingBooking.seatId,
                  token: `sec-${pendingBooking.bookingId}`,
                  userId: user?.userId,
                })}
                size={180}
                level="H"
                bgColor="transparent"
                fgColor="hsl(160, 84%, 39%)"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Seat: <strong>{pendingBooking.seatId}</strong>
            </p>
            <Button onClick={handleSimulateScan} className="w-full gap-2">
              <ScanLine className="w-4 h-4" />
              Simulate QR Scan
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRCheckIn;
