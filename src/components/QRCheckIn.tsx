import React, { useState, useEffect, useRef } from 'react';
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
import { CheckCircle2, ScanLine, Camera, CameraOff, Zap } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

interface QRCheckInProps {
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
}

const QRCheckIn: React.FC<QRCheckInProps> = ({ open, onClose, bookings }) => {
  const { user } = useAuth();
  const { checkIn, seats } = useLibrary();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const pendingBooking = bookings.find(b => !b.checkedIn);
  const seatForBooking = pendingBooking
    ? seats.find(s => s.seatId === pendingBooking.seatId)
    : null;

  const processQrData = async (decodedText: string) => {
    if (!pendingBooking || !user) return;
    try {
      let data: any;
      try {
        data = JSON.parse(decodedText);
      } catch {
        // Fuzzy match: try to extract seatId and partial qrToken from raw text
        const seatMatch = decodedText.match(/S\d+/i);
        const tokenMatch = decodedText.match(/QR-S\d+-\w{4,}/i);
        if (seatMatch) {
          data = { seatId: seatMatch[0].toUpperCase(), qrToken: tokenMatch?.[0] || '' };
        } else {
          toast({ title: 'Invalid QR', description: 'Could not read QR code data.', variant: 'destructive' });
          return;
        }
      }

      // Approximate matching: match seat by seatId, then verify token with partial/fuzzy match
      const seat = seats.find(s => {
        if (s.seatId !== data.seatId) return false;
        // Exact match
        if (s.qrToken === data.qrToken) return true;
        // Partial match: if at least 6 chars of the token match anywhere
        if (data.qrToken && data.qrToken.length >= 6 && s.qrToken.includes(data.qrToken.slice(0, 6))) return true;
        if (data.qrToken && s.qrToken && data.qrToken.includes(s.qrToken.slice(0, 8))) return true;
        // Token starts with same prefix (QR-SeatId-)
        const prefix = `QR-${s.seatId}-`;
        if (data.qrToken && data.qrToken.startsWith(prefix) && s.qrToken.startsWith(prefix)) return true;
        return false;
      });

      if (!seat) {
        toast({ title: 'Invalid QR', description: 'QR code does not match any valid seat.', variant: 'destructive' });
        return;
      }
      if (seat.seatId !== pendingBooking.seatId) {
        toast({ title: 'Wrong seat', description: `This QR is for ${seat.seatId}, but your booking is for ${pendingBooking.seatId}.`, variant: 'destructive' });
        return;
      }
      const success = await checkIn(pendingBooking.seatId, user.userId);
      if (success) {
        setScanned(true);
        stopScanner();
      }
    } catch {
      toast({ title: 'Invalid QR', description: 'Could not read QR code data.', variant: 'destructive' });
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          processQrData(decodedText);
        },
        () => {} // ignore errors during scanning
      );
      setScanning(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Camera access denied or not available.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleSimulateScan = async () => {
    if (!pendingBooking || !user) return;
    const seat = seats.find(s => s.seatId === pendingBooking.seatId);
    if (!seat) return;
    const success = await checkIn(pendingBooking.seatId, user.userId);
    if (success) setScanned(true);
  };

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopScanner();
      setScanned(false);
      setCameraError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { stopScanner(); onClose(); } }}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center justify-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            QR Check-In
          </DialogTitle>
          <DialogDescription>
            {scanned ? 'Successfully checked in!' : 'Scan the QR code at your seat using your camera'}
          </DialogDescription>
        </DialogHeader>

        {!pendingBooking ? (
          <p className="text-sm text-muted-foreground py-4">No pending bookings to check in.</p>
        ) : !seatForBooking ? (
          <p className="text-sm text-destructive py-4">This seat has been removed. QR code is no longer valid.</p>
        ) : scanned ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <p className="text-lg font-display font-bold text-foreground">
              {pendingBooking.seatId} — Checked In
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Camera Scanner Area */}
            <div className="w-full rounded-xl border border-border overflow-hidden bg-muted/30 relative" style={{ minHeight: 260 }}>
              <div id="qr-reader" className="w-full" />
              {!scanning && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-10 h-10 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">Camera preview will appear here</p>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                  <CameraOff className="w-8 h-8 text-destructive/70" />
                  <p className="text-xs text-destructive">{cameraError}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Seat: <strong>{pendingBooking.seatId}</strong>
            </p>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-2">
              {!scanning ? (
                <Button onClick={startScanner} className="w-full gap-2">
                  <Camera className="w-4 h-4" />
                  Open Camera & Scan
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="w-full gap-2">
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </Button>
              )}
              <Button onClick={handleSimulateScan} variant="secondary" className="w-full gap-2">
                <Zap className="w-4 h-4" />
                Quick Simulate Scan
              </Button>
            </div>

            {/* Show QR for reference */}
            <details className="w-full text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Show seat QR code (for testing)
              </summary>
              <div className="flex justify-center mt-3 p-3 bg-card rounded-lg border border-border">
                <QRCodeSVG
                  value={JSON.stringify({
                    seatId: seatForBooking.seatId,
                    qrToken: seatForBooking.qrToken,
                  })}
                  size={150}
                  level="H"
                  bgColor="transparent"
                  fgColor="hsl(160, 84%, 39%)"
                />
              </div>
            </details>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRCheckIn;
