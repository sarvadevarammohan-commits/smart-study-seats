import React, { memo, useMemo } from 'react';
import { Seat, Booking } from '@/types/library';
import SeatCard from './SeatCard';
import { motion } from 'framer-motion';

interface SeatMapProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  bookings?: Booking[];
}

const SeatMap: React.FC<SeatMapProps> = memo(({ seats, onSeatClick, bookings = [] }) => {
  const blocks = useMemo(() => {
    const b: Record<number, Seat[]> = {};
    seats.forEach(s => {
      if (!b[s.blockNumber]) b[s.blockNumber] = [];
      b[s.blockNumber].push(s);
    });
    return b;
  }, [seats]);

  const blockNumbers = useMemo(() => Object.keys(blocks).map(Number).sort((a, b) => a - b), [blocks]);

  const bookingMap = useMemo(() => {
    const m = new Map<string, Booking>();
    bookings.forEach(b => m.set(b.seatId, b));
    return m;
  }, [bookings]);

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="font-display font-bold text-lg text-foreground">Library Floor Plan</h2>
        <div className="flex gap-3 ml-auto">
          <Legend color="bg-seat-available" label="Available" />
          <Legend color="bg-seat-reserved" label="Reserved" />
          <Legend color="bg-seat-occupied" label="Occupied" />
        </div>
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 sm:p-6 border border-border">
        <p className="text-[10px] text-muted-foreground text-center mb-4 font-medium uppercase tracking-wider">
          — Entrance —
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {blockNumbers.map((bn, bi) => (
            <motion.div
              key={bn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: bi * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-[10px] text-muted-foreground font-medium mb-2">Block {bn}</span>
              <BlockLayout
                seats={blocks[bn]}
                onSeatClick={onSeatClick}
                blockIndex={bi}
                bookingMap={bookingMap}
              />
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-4 font-medium uppercase tracking-wider">
          — Back Wall —
        </p>
      </div>
    </div>
  );
});

SeatMap.displayName = 'SeatMap';

interface BlockLayoutProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  blockIndex: number;
  bookingMap: Map<string, Booking>;
}

const BlockLayout: React.FC<BlockLayoutProps> = memo(({ seats, onSeatClick, blockIndex, bookingMap }) => {
  const topSeats = seats.slice(0, 3);
  const leftSeats = seats.slice(3, 6);
  const rightSeats = seats.slice(6, 9);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex gap-2 justify-center">
        {topSeats.map((seat, si) => (
          <div key={seat.seatId} className="w-14 sm:w-16">
            <SeatCard seat={seat} onClick={onSeatClick} index={blockIndex * 9 + si} booking={bookingMap.get(seat.seatId)} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          {leftSeats.map((seat, si) => (
            <div key={seat.seatId} className="w-14 sm:w-16">
              <SeatCard seat={seat} onClick={onSeatClick} index={blockIndex * 9 + 3 + si} booking={bookingMap.get(seat.seatId)} />
            </div>
          ))}
        </div>

        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted/60 border-2 border-primary/30 flex items-center justify-center shadow-inner">
          <span className="text-[10px] text-muted-foreground font-medium">TABLE</span>
        </div>

        <div className="flex flex-col gap-2">
          {rightSeats.map((seat, si) => (
            <div key={seat.seatId} className="w-14 sm:w-16">
              <SeatCard seat={seat} onClick={onSeatClick} index={blockIndex * 9 + 6 + si} booking={bookingMap.get(seat.seatId)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

BlockLayout.displayName = 'BlockLayout';

const Legend: React.FC<{ color: string; label: string }> = memo(({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-3 h-3 rounded-sm ${color}`} />
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
));

Legend.displayName = 'Legend';

export default SeatMap;
