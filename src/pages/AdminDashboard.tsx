import React, { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import AdminSeatQRCodes from '@/components/AdminSeatQRCodes';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Armchair, Users, Clock, AlertTriangle, Plus, Trash2, TrendingUp, Activity, QrCode, MessageSquareWarning, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { seats, bookings, getStats, hourlyData, analyticsHistory, addSeat, removeSeat, releaseSeat } = useLibrary();
  const [newBlock, setNewBlock] = useState('1');
  const stats = getStats();

  const noShowRate = analyticsHistory.length > 0
    ? Math.round(analyticsHistory.reduce((a, d) => a + d.noShows, 0) / analyticsHistory.reduce((a, d) => a + d.totalBookings, 0) * 100)
    : 0;

  // Heatmap data
  const heatmapData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${8 + i}:00`,
    ...Object.fromEntries(
      Array.from(new Set(seats.map(s => s.blockNumber))).map(bn => [
        `Block ${bn}`,
        Math.floor(Math.random() * 3) + 1,
      ])
    ),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">Welcome, <span className="font-semibold text-foreground">{user?.name}</span></p>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AdminStat icon={<Armchair className="w-5 h-5 text-primary" />} label="Total Seats" value={stats.total} />
          <AdminStat icon={<Users className="w-5 h-5 text-seat-available" />} label="Available" value={stats.available} />
          <AdminStat icon={<Clock className="w-5 h-5 text-seat-reserved" />} label="Reserved" value={stats.reserved} />
          <AdminStat icon={<AlertTriangle className="w-5 h-5 text-seat-occupied" />} label="Occupied" value={stats.occupied} />
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="map">Floor Map</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="qrcodes" className="gap-1"><QrCode className="w-3.5 h-3.5" /> QR Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <SeatMap seats={seats} onSeatClick={() => {}} bookings={bookings} />
          </TabsContent>

          <TabsContent value="manage">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-display font-bold text-foreground">Seat Management</h3>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Block Number</label>
                  <Input value={newBlock} onChange={e => setNewBlock(e.target.value)} type="number" min="1" />
                </div>
                <Button onClick={() => addSeat(parseInt(newBlock))} className="gap-1">
                  <Plus className="w-4 h-4" /> Add Seat
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {seats.map(s => (
                  <div key={s.seatId} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold seat-${s.status}`}>
                        {s.seatId}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Block {s.blockNumber}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {s.status !== 'available' && (
                        <Button size="sm" variant="outline" onClick={() => releaseSeat(s.seatId)} className="h-7 text-xs">
                          Release
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeSeat(s.seatId)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qrcodes">
            <AdminSeatQRCodes seats={seats} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-4">
              {/* Occupancy Trend */}
              <div className="glass-card p-5">
                <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Occupancy Trend (Today)
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="occupancy" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Bookings */}
              <div className="glass-card p-5">
                <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Weekly Bookings
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="totalBookings" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="noShows" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* No-show rate */}
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No-Show Rate</p>
                  <p className="text-3xl font-display font-bold text-foreground">{noShowRate}%</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-display font-bold text-foreground">Daily Usage Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Bookings</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">No-Shows</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Peak Hour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsHistory.map((d, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{d.date}</td>
                        <td className="py-2 text-right text-foreground">{d.totalBookings}</td>
                        <td className="py-2 text-right text-destructive">{d.noShows}</td>
                        <td className="py-2 text-right text-foreground">{d.peakHour}:00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Active Bookings */}
              <h3 className="font-display font-bold text-foreground pt-2">Active Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active bookings</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map(b => (
                    <div key={b.bookingId} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${b.checkedIn ? 'bg-seat-occupied' : 'bg-seat-reserved'} text-primary-foreground`}>
                          {b.seatId}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{b.userName || b.userId}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${b.checkedIn ? 'bg-primary/20 text-primary' : 'bg-seat-reserved/20 text-seat-reserved'}`}>
                        {b.checkedIn ? 'Checked In' : 'Pending Check-in'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const AdminStat: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className="text-2xl font-display font-bold text-foreground">{value}</span>
  </motion.div>
);

export default AdminDashboard;
