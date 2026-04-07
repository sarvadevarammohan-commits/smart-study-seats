import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { Seat } from '@/types/library';
import SeatMap from '@/components/SeatMap';
import BookingDialog from '@/components/BookingDialog';
import MyBookings from '@/components/MyBookings';
import QRCheckIn from '@/components/QRCheckIn';
import ComplaintDialog from '@/components/ComplaintDialog';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { Armchair, Clock, CalendarCheck, RefreshCw, AlertTriangle, MessageSquareWarning, CheckCircle, XCircle, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { seats, bookings, getStats, complaints } = useLibrary();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const stats = getStats();
  const myBookings = bookings.filter(b => b.userId === user?.userId);
  const myComplaints = complaints.filter(c => c.userId === user?.userId);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast({ title: 'Refreshed', description: 'Data syncs automatically in real-time.' });
    }, 600);
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Refresh bar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{user?.name}</span></p>
            <p className="text-xs text-muted-foreground">{user?.branch} · {user?.year}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Armchair className="w-5 h-5 text-primary" />} label="Available" value={stats.available} />
          <StatCard icon={<Clock className="w-5 h-5 text-seat-reserved" />} label="Reserved" value={stats.reserved} />
          <StatCard icon={<CalendarCheck className="w-5 h-5 text-seat-occupied" />} label="Occupied" value={stats.occupied} />
        </div>

        {/* Seat Map */}
        <SeatMap seats={seats} onSeatClick={s => s.status === 'available' && setSelectedSeat(s)} bookings={bookings} />

        {/* My Bookings */}
        <MyBookings
          bookings={myBookings}
          onCheckIn={() => setShowQR(true)}
        />

        {/* Report Issue Button - always visible */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowComplaint(true)} className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
            <AlertTriangle className="w-3.5 h-3.5" /> Report Issue
          </Button>
        </div>

        {/* My Complaints */}
        {myComplaints.length > 0 && (
          <div className="glass-card p-4 sm:p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-destructive" /> My Complaints
            </h2>
            <div className="space-y-2">
              {[...myComplaints].reverse().map(c => (
                <div key={c.complaintId} className={`p-3 rounded-lg border ${
                  c.status === 'pending' ? 'bg-destructive/5 border-destructive/20' :
                  c.status === 'resolved' ? 'bg-primary/5 border-primary/20' :
                  'bg-muted/50 border-border'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {c.seatId === 'N/A' ? '🐛 App Issue' : `🪑 Seat ${c.seatId}`}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${
                      c.status === 'pending' ? 'bg-destructive/20 text-destructive' :
                      c.status === 'resolved' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {c.status === 'pending' && <CircleDot className="w-3 h-3" />}
                      {c.status === 'resolved' && <CheckCircle className="w-3 h-3" />}
                      {c.status === 'dismissed' && <XCircle className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.message}</p>
                  {c.adminNote && (
                    <p className="text-xs text-primary mt-1 font-medium">📋 Admin: {c.adminNote}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(c.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Dialog */}
        {selectedSeat && (
          <BookingDialog
            seat={selectedSeat}
            open={!!selectedSeat}
            onClose={() => setSelectedSeat(null)}
          />
        )}

        {/* QR Check-in */}
        {showQR && (
          <QRCheckIn
            open={showQR}
            onClose={() => setShowQR(false)}
            bookings={myBookings}
          />
        )}

        {/* Complaint Dialog */}
        <ComplaintDialog
          open={showComplaint}
          onClose={() => setShowComplaint(false)}
          bookings={myBookings}
        />
      </main>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card"
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className="text-2xl font-display font-bold text-foreground">{value}</span>
  </motion.div>
);

export default StudentDashboard;
