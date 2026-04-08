import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Seat, Booking } from '@/types/library';

interface SeatCardProps {
  seat: Seat;
  onClick: (seat: Seat) => void;
  index: number;
  booking?: Booking;
}

const SeatCard: React.FC<SeatCardProps> = memo(({ seat, onClick, index, booking }) => {
  const statusClass = `seat-${seat.status}`;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, type: 'spring', stiffness: 300 }}
      whileHover={seat.status === 'available' ? { scale: 1.08 } : {}}
      whileTap={seat.status === 'available' ? { scale: 0.95 } : {}}
      onClick={() => onClick(seat)}
      disabled={seat.status !== 'available'}
      className={`seat-card ${statusClass} w-full flex flex-col items-center justify-center min-h-[70px] py-1.5 ${
        seat.status === 'available' ? 'animate-pulse-green' : ''
      }`}
    >
      <span className="text-sm font-bold">{seat.seatId}</span>
      <span className="text-[10px] opacity-80 capitalize">{seat.status}</span>
      {booking && seat.status !== 'available' && (
        <div className="text-[8px] opacity-70 leading-tight mt-0.5 text-center">
          <span>{new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span> - </span>
          <span>{new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    </motion.button>
  );
}, (prev, next) => 
  prev.seat.status === next.seat.status && 
  prev.seat.seatId === next.seat.seatId && 
  prev.booking?.id === next.booking?.id
);

SeatCard.displayName = 'SeatCard';

export default SeatCard;
