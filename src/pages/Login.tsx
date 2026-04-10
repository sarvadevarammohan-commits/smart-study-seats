import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/library';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Shield, Mail, Lock, ArrowLeft, RefreshCw, Sparkles, Users, BarChart3, User, Zap, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function generateCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const CaptchaCanvas: React.FC<{ code: string }> = ({ code }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'hsl(224, 30%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `hsla(${160 + Math.random() * 40}, 80%, 50%, 0.15)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `hsla(160, 84%, 50%, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const colors = ['hsl(160, 100%, 60%)', 'hsl(180, 100%, 55%)', 'hsl(140, 90%, 55%)', 'hsl(200, 100%, 60%)', 'hsl(160, 84%, 70%)'];
    code.split('').forEach((char, i) => {
      ctx.save();
      ctx.font = `bold ${20 + Math.random() * 6}px monospace`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur = 8;
      ctx.translate(20 + i * 28, 30 + Math.random() * 8);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, [code]);

  return <canvas ref={canvasRef} width={170} height={45} className="rounded-lg border border-primary/30" />;
};

/* Electrical arc SVG line */
const ElectricArc: React.FC<{ className?: string; delay?: number }> = ({ className = '', delay = 0 }) => (
  <motion.svg
    className={`absolute pointer-events-none ${className}`}
    width="200" height="100" viewBox="0 0 200 100"
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0.8, 0] }}
    transition={{ duration: 0.15, delay, repeat: Infinity, repeatDelay: 3 + Math.random() * 5 }}
  >
    <motion.path
      d="M0,50 L30,20 L50,60 L80,10 L110,70 L140,30 L170,55 L200,40"
      stroke="hsl(160, 100%, 60%)"
      strokeWidth="1.5"
      fill="none"
      filter="url(#glow)"
      strokeLinecap="round"
    />
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </motion.svg>
);

/* Floating energy orb */
const EnergyOrb: React.FC<{ delay: number; x: number; size: number }> = ({ delay, x, size }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      background: `radial-gradient(circle, hsla(160, 100%, 60%, 0.4), hsla(160, 100%, 40%, 0) 70%)`,
      boxShadow: `0 0 ${size * 2}px hsla(160, 100%, 50%, 0.3)`,
    }}
    initial={{ y: '110vh', opacity: 0 }}
    animate={{ y: '-10vh', opacity: [0, 1, 0.6, 0] }}
    transition={{ duration: 6 + Math.random() * 4, delay, repeat: Infinity, ease: 'linear' }}
  />
);

/* Scanning line effect */
const ScanLine: React.FC = () => (
  <motion.div
    className="absolute left-0 right-0 h-[1px] pointer-events-none z-0"
    style={{
      background: 'linear-gradient(90deg, transparent 0%, hsl(160, 100%, 50%) 50%, transparent 100%)',
      boxShadow: '0 0 20px 2px hsla(160, 100%, 50%, 0.3)',
    }}
    initial={{ top: '-2%' }}
    animate={{ top: '102%' }}
    transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
  />
);

/* Hexagonal grid background pattern */
const HexGrid: React.FC = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.04]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M30 0l30 15v22L30 52 0 37V15z' fill='none' stroke='%2310b981' stroke-width='0.5'/%3E%3C/svg%3E")`,
      backgroundSize: '60px 52px',
    }}
  />
);

const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    if (captchaInput !== captchaCode) {
      setError('Incorrect captcha. Please try again.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (authMode === 'login') {
        const success = await login(email, password, role);
        if (!success) setError('Invalid credentials. Please check your email and password.');
      } else {
        const success = await signup(email, password, name, role, {
          rollNumber: role === 'student' ? rollNumber : 'ADMIN',
          branch: role === 'student' ? course : '',
          year: role === 'student' ? year : '',
        });
        if (!success) setError('Signup failed. Email may already be in use.');
      }
    } catch {
      setError(authMode === 'login' ? 'Login failed' : 'Signup failed');
    }
    setLoading(false);
    refreshCaptcha();
  };

  const selectRole = (r: UserRole) => {
    setRole(r);
    setAuthMode(r === 'admin' ? 'login' : 'login');
    setEmail('');
    setPassword('');
    setName('');
    setRollNumber('');
    setCourse('');
    setYear('');
    setError('');
    refreshCaptcha();
  };

  const orbs = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.8,
    x: Math.random() * 100,
    size: 6 + Math.random() * 14,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, hsl(224, 35%, 5%) 0%, hsl(224, 30%, 8%) 40%, hsl(220, 25%, 10%) 100%)' }}>
      
      {/* Animated background layers */}
      <HexGrid />
      <ScanLine />
      
      {/* Radial glow spots */}
      <motion.div
        className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(160, 100%, 50%, 0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-15%] right-[15%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(200, 100%, 50%, 0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-[40%] right-[5%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(270, 80%, 50%, 0.05) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Electric arcs */}
      <ElectricArc className="top-[15%] left-[5%] w-48 opacity-60" delay={1} />
      <ElectricArc className="bottom-[20%] right-[8%] w-40 opacity-40 rotate-12" delay={4} />
      <ElectricArc className="top-[60%] left-[60%] w-36 opacity-30 -rotate-45" delay={7} />

      {/* Energy orbs */}
      {orbs.map((p, i) => (
        <EnergyOrb key={i} {...p} />
      ))}

      {/* Corner accent lines */}
      <div className="absolute top-0 left-0 w-32 h-[1px] bg-gradient-to-r from-primary/40 to-transparent" />
      <div className="absolute top-0 left-0 w-[1px] h-32 bg-gradient-to-b from-primary/40 to-transparent" />
      <div className="absolute bottom-0 right-0 w-32 h-[1px] bg-gradient-to-l from-primary/40 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[1px] h-32 bg-gradient-to-t from-primary/40 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, hsl(160, 100%, 40%), hsl(180, 90%, 35%))',
              boxShadow: '0 0 40px hsla(160, 100%, 50%, 0.3), 0 0 80px hsla(160, 100%, 50%, 0.1), inset 0 1px 1px hsla(0, 0%, 100%, 0.2)',
            }}
          >
            <BookOpen className="w-12 h-12 text-primary-foreground drop-shadow-lg" />
            {/* Pulsating ring */}
            <motion.div
              className="absolute inset-[-4px] rounded-2xl"
              style={{ border: '2px solid hsla(160, 100%, 60%, 0.4)' }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Second ring offset */}
            <motion.div
              className="absolute inset-[-8px] rounded-2xl"
              style={{ border: '1px solid hsla(160, 100%, 50%, 0.2)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            {/* Corner sparks */}
            <motion.div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
              style={{ boxShadow: '0 0 8px hsl(160, 100%, 50%)' }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-4xl font-display font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, hsl(160, 100%, 60%), hsl(180, 80%, 70%), hsl(160, 100%, 50%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px hsla(160, 100%, 50%, 0.3))',
            }}
          >
            Smart Library
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-sm mt-2 flex items-center justify-center gap-1.5"
            style={{ color: 'hsla(210, 20%, 70%, 0.8)' }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: 'hsl(160, 100%, 55%)' }} />
            Intelligent Seat Reservation System
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="flex items-center justify-center gap-2 mt-4">
            {[
              { icon: <Users className="w-3 h-3" />, text: 'Real-time' },
              { icon: <BarChart3 className="w-3 h-3" />, text: 'Analytics' },
              { icon: <QrCode className="w-3 h-3" />, text: 'QR Check-in' },
            ].map((pill, i) => (
              <motion.span key={pill.text} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                style={{
                  background: 'hsla(160, 100%, 50%, 0.08)',
                  color: 'hsl(160, 100%, 55%)',
                  border: '1px solid hsla(160, 100%, 50%, 0.2)',
                  boxShadow: '0 0 12px hsla(160, 100%, 50%, 0.05), inset 0 1px 0 hsla(160, 100%, 50%, 0.05)',
                }}
              >
                {pill.icon}
                {pill.text}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div key="roles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
              <p className="text-center text-sm mb-5" style={{ color: 'hsla(210, 20%, 60%, 0.7)' }}>Choose how you'd like to sign in</p>

              {/* Student card */}
              <motion.button whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => selectRole('student')}
                className="w-full rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 group relative overflow-hidden"
                style={{
                  background: 'hsla(224, 25%, 12%, 0.8)',
                  border: '1px solid hsla(160, 80%, 50%, 0.15)',
                  boxShadow: '0 4px 24px hsla(0, 0%, 0%, 0.3), inset 0 1px 0 hsla(160, 100%, 50%, 0.05)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, hsla(160, 100%, 50%, 0.05), transparent 60%)' }} />
                <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(90deg, transparent, hsla(160, 100%, 50%, 0.4), transparent)' }} />
                
                <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, hsl(160, 100%, 40%), hsl(170, 90%, 35%))',
                    boxShadow: '0 0 20px hsla(160, 100%, 50%, 0.25)',
                  }}
                >
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-left flex-1 relative z-10">
                  <p className="font-display font-bold text-lg" style={{ color: 'hsl(210, 20%, 95%)' }}>Student</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsla(210, 20%, 60%, 0.7)' }}>Book seats, scan QR & check in</p>
                </div>
                <motion.div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all duration-300"
                  style={{
                    background: 'hsla(160, 100%, 50%, 0.1)',
                    border: '1px solid hsla(160, 100%, 50%, 0.2)',
                  }}
                  whileHover={{ x: 3 }}
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" style={{ color: 'hsl(160, 100%, 55%)' }} />
                </motion.div>
              </motion.button>

              {/* Admin card */}
              <motion.button whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => selectRole('admin')}
                className="w-full rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 group relative overflow-hidden"
                style={{
                  background: 'hsla(224, 25%, 12%, 0.8)',
                  border: '1px solid hsla(270, 60%, 50%, 0.15)',
                  boxShadow: '0 4px 24px hsla(0, 0%, 0%, 0.3), inset 0 1px 0 hsla(270, 80%, 50%, 0.05)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, hsla(270, 80%, 50%, 0.05), transparent 60%)' }} />
                <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(90deg, transparent, hsla(270, 80%, 60%, 0.4), transparent)' }} />
                
                <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, hsl(260, 70%, 50%), hsl(280, 70%, 45%))',
                    boxShadow: '0 0 20px hsla(270, 80%, 50%, 0.25)',
                  }}
                >
                  <Shield className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-left flex-1 relative z-10">
                  <p className="font-display font-bold text-lg" style={{ color: 'hsl(210, 20%, 95%)' }}>Admin</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsla(210, 20%, 60%, 0.7)' }}>Manage seats, analytics & QR codes</p>
                </div>
                <motion.div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all duration-300"
                  style={{
                    background: 'hsla(270, 80%, 50%, 0.1)',
                    border: '1px solid hsla(270, 80%, 50%, 0.2)',
                  }}
                  whileHover={{ x: 3 }}
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" style={{ color: 'hsl(270, 80%, 60%)' }} />
                </motion.div>
              </motion.button>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
              style={{
                background: 'hsla(224, 25%, 12%, 0.9)',
                border: '1px solid hsla(160, 80%, 50%, 0.12)',
                boxShadow: '0 8px 32px hsla(0, 0%, 0%, 0.4), 0 0 60px hsla(160, 100%, 50%, 0.03)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Top glow line */}
              <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, hsla(160, 100%, 50%, 0.3), transparent)' }} />

              <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={() => { setRole(null); setError(''); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'hsla(224, 20%, 18%, 0.8)', border: '1px solid hsla(160, 80%, 50%, 0.1)' }}
                >
                  <ArrowLeft className="w-4 h-4" style={{ color: 'hsla(210, 20%, 60%, 0.7)' }} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: role === 'student'
                        ? 'linear-gradient(135deg, hsl(160, 100%, 40%), hsl(170, 90%, 35%))'
                        : 'linear-gradient(135deg, hsl(260, 70%, 50%), hsl(280, 70%, 45%))',
                      boxShadow: role === 'student'
                        ? '0 0 12px hsla(160, 100%, 50%, 0.3)'
                        : '0 0 12px hsla(270, 80%, 50%, 0.3)',
                    }}
                  >
                    {role === 'student' ? <BookOpen className="w-4 h-4 text-primary-foreground" /> : <Shield className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <span className="text-sm font-display font-bold capitalize"
                    style={{ color: 'hsl(210, 20%, 95%)' }}>{role}</span>
                </div>
              </div>

              {role === 'student' ? (
                <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as 'login' | 'signup'); setError(''); }}>
                  <TabsList className="w-full grid grid-cols-2"
                    style={{ background: 'hsla(224, 20%, 15%, 0.8)', border: '1px solid hsla(160, 80%, 50%, 0.08)' }}
                  >
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : null}

              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsla(210, 20%, 50%, 0.6)' }} />
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} className="pl-10 bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20" placeholder="Enter your full name" required />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsla(210, 20%, 50%, 0.6)' }} />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20" placeholder="Enter your email" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsla(210, 20%, 50%, 0.6)' }} />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20" placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Enter password'} required minLength={6} />
                </div>
              </div>

              {authMode === 'signup' && role === 'student' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Roll Number</label>
                  <Input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20" placeholder="e.g. 22CS101" required />
                </div>
              )}

              {authMode === 'signup' && role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Course / Branch</label>
                    <Input type="text" value={course} onChange={e => setCourse(e.target.value)} className="bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20" placeholder="e.g. CSE, ECE" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Year</label>
                    <Input type="text" value={year} onChange={e => setYear(e.target.value)} className="bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20" placeholder="e.g. 2nd Year" required />
                  </div>
                </div>
              )}

              {/* Captcha */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium" style={{ color: 'hsla(160, 60%, 60%, 0.8)' }}>Security Check</label>
                <div className="flex items-center gap-2">
                  <CaptchaCanvas code={captchaCode} />
                  <Button type="button" variant="outline" size="icon" onClick={refreshCaptcha} className="h-[45px] w-10 shrink-0 border-primary/20 hover:border-primary/40 hover:bg-primary/10">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <Input type="text" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                  className="font-mono tracking-[0.3em] text-center bg-transparent border-primary/20 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="Type the characters above" required maxLength={5} autoComplete="off" />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium rounded-lg px-3 py-2"
                  style={{
                    color: 'hsl(0, 90%, 65%)',
                    background: 'hsla(0, 80%, 50%, 0.08)',
                    border: '1px solid hsla(0, 80%, 50%, 0.15)',
                  }}
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full h-12 font-display font-bold text-sm relative overflow-hidden group" disabled={loading || captchaInput.length < 5}
                style={{
                  background: 'linear-gradient(135deg, hsl(160, 100%, 40%), hsl(170, 90%, 35%))',
                  boxShadow: '0 0 20px hsla(160, 100%, 50%, 0.2), 0 4px 12px hsla(0, 0%, 0%, 0.3)',
                  border: 'none',
                }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, hsl(160, 100%, 45%), hsl(180, 90%, 40%))' }} />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </motion.span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </span>
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Bottom branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-[10px] tracking-widest uppercase"
          style={{ color: 'hsla(210, 20%, 40%, 0.4)' }}
        >
          Powered by Smart Library System
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
