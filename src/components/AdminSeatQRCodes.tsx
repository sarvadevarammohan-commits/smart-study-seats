import React from 'react';
import { Seat } from '@/types/library';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface AdminSeatQRCodesProps {
  seats: Seat[];
}

const AdminSeatQRCodes: React.FC<AdminSeatQRCodesProps> = ({ seats }) => {
  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="font-display font-bold text-foreground">Seat QR Codes</h3>
      <p className="text-sm text-muted-foreground">
        Each seat has a unique QR code. Print and place at the corresponding seat. Deleted seats will have their QR codes invalidated automatically.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
        {seats.map((seat, i) => (
          <motion.div
            key={seat.seatId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
          >
            <div className="p-2 bg-card rounded-lg border border-border">
              <QRCodeSVG
                value={JSON.stringify({
                  seatId: seat.seatId,
                  qrToken: seat.qrToken,
                })}
                size={100}
                level="H"
                bgColor="transparent"
                fgColor="hsl(160, 84%, 39%)"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{seat.seatId}</p>
              <p className="text-[10px] text-muted-foreground">Block {seat.blockNumber}</p>
              <p className="text-[9px] text-muted-foreground/60 font-mono truncate max-w-[120px]">{seat.qrToken}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminSeatQRCodes;
