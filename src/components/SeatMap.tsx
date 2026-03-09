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
        <p className="text-[10px] text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">
          — Entrance —
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {blockNumbers.map((bn, bi) => (
            <React.Fragment key={bn}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: bi * 0.1 }}
                className="flex flex-col gap-2 items-center"
              >
                <span className="text-[10px] text-muted-foreground font-medium mb-1">Block {bn}</span>
                {blocks[bn].map((seat, si) => (
                  <div key={seat.seatId} className="w-16 sm:w-20">
                    <SeatCard seat={seat} onClick={onSeatClick} index={bi * 3 + si} booking={getBookingForSeat(seat.seatId)} />
                  </div>
                ))}
              </motion.div>

              {bi < blockNumbers.length - 1 && (
                <div className="flex flex-col items-center justify-center">
                  <div className="table-divider w-8 sm:w-10 h-full min-h-[180px] rounded-md">
                    <span className="[writing-mode:vertical-rl] text-[9px] rotate-180">TABLE</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-3 font-medium uppercase tracking-wider">
          — Back Wall —
        </p>
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
