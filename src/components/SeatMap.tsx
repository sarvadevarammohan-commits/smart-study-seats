import React from 'react';
import { Seat, Booking } from '@/types/library';
import SeatCard from './SeatCard';
import { motion } from 'framer-motion';

interface SeatMapProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  bookings?: Booking[];
}

const SeatMap: React.FC<SeatMapProps> = ({ seats, onSeatClick, bookings = [] }) => {
  const blocks: Record<number, Seat[]> = {};
  seats.forEach(s => {
    if (!blocks[s.blockNumber]) blocks[s.blockNumber] = [];
    blocks[s.blockNumber].push(s);
  });

  const blockNumbers = Object.keys(blocks).map(Number).sort((a, b) => a - b);

  const getBookingForSeat = (seatId: string) =>
    bookings.find(b => b.seatId === seatId);

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
                getBookingForSeat={getBookingForSeat}
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
};

interface BlockLayoutProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  blockIndex: number;
  getBookingForSeat: (seatId: string) => Booking | undefined;
}

const BlockLayout: React.FC<BlockLayoutProps> = ({ seats, onSeatClick, blockIndex, getBookingForSeat }) => {
  // Seats arranged: first 3 = top, next 3 = left, last 3 = right
  const topSeats = seats.slice(0, 3);
  const leftSeats = seats.slice(3, 6);
  const rightSeats = seats.slice(6, 9);

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Top row - 3 seats */}
      <div className="flex gap-2 justify-center">
        {topSeats.map((seat, si) => (
          <div key={seat.seatId} className="w-14 sm:w-16">
            <SeatCard seat={seat} onClick={onSeatClick} index={blockIndex * 9 + si} booking={getBookingForSeat(seat.seatId)} />
          </div>
        ))}
      </div>

      {/* Middle row - left seats, round table, right seats */}
      <div className="flex items-center gap-2">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          {leftSeats.map((seat, si) => (
            <div key={seat.seatId} className="w-14 sm:w-16">
              <SeatCard seat={seat} onClick={onSeatClick} index={blockIndex * 9 + 3 + si} booking={getBookingForSeat(seat.seatId)} />
            </div>
          ))}
        </div>

        {/* Round table */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted/60 border-2 border-primary/30 flex items-center justify-center shadow-inner">
          <span className="text-[10px] text-muted-foreground font-medium">TABLE</span>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2">
          {rightSeats.map((seat, si) => (
            <div key={seat.seatId} className="w-14 sm:w-16">
              <SeatCard seat={seat} onClick={onSeatClick} index={blockIndex * 9 + 6 + si} booking={getBookingForSeat(seat.seatId)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-3 h-3 rounded-sm ${color}`} />
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

export default SeatMap;
