import React from 'react';
import { motion } from 'framer-motion';
import { Seat } from '@/types/library';

interface SeatCardProps {
  seat: Seat;
  onClick: (seat: Seat) => void;
  index: number;
}

const SeatCard: React.FC<SeatCardProps> = ({ seat, onClick, index }) => {
  const statusClass = `seat-${seat.status}`;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
      whileHover={seat.status === 'available' ? { scale: 1.08 } : {}}
      whileTap={seat.status === 'available' ? { scale: 0.95 } : {}}
      onClick={() => onClick(seat)}
      disabled={seat.status !== 'available'}
      className={`seat-card ${statusClass} w-full aspect-square flex flex-col items-center justify-center min-h-[60px] ${
        seat.status === 'available' ? 'animate-pulse-green' : ''
      }`}
    >
      <span className="text-sm font-bold">{seat.seatId}</span>
      <span className="text-[10px] opacity-80 capitalize mt-0.5">{seat.status}</span>
    </motion.button>
  );
};

export default SeatCard;
