import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/library';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Shield, Mail, Lock, ArrowLeft, RefreshCw, Sparkles, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? 'hsl(224, 25%, 14%)' : 'hsl(220, 20%, 95%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = isDark
        ? `hsla(${Math.random() * 360}, 40%, 45%, 0.4)`
        : `hsla(${Math.random() * 360}, 40%, 60%, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = isDark
        ? `hsla(${Math.random() * 360}, 40%, 50%, 0.3)`
        : `hsla(${Math.random() * 360}, 40%, 60%, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text
    const colors = isDark
      ? ['hsl(160, 84%, 55%)', 'hsl(45, 90%, 65%)', 'hsl(200, 80%, 60%)', 'hsl(340, 70%, 60%)', 'hsl(120, 60%, 55%)']
      : ['hsl(160, 84%, 35%)', 'hsl(25, 80%, 45%)', 'hsl(200, 70%, 40%)', 'hsl(340, 60%, 45%)', 'hsl(120, 50%, 35%)'];
    code.split('').forEach((char, i) => {
      ctx.save();
      ctx.font = `bold ${20 + Math.random() * 6}px monospace`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.translate(20 + i * 28, 30 + Math.random() * 8);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, [code]);

  return <canvas ref={canvasRef} width={170} height={45} className="rounded-lg border border-border" />;
};

// Floating animated particles
const FloatingParticle: React.FC<{ delay: number; x: number; size: number }> = ({ delay, x, size }) => (
  <motion.div
    className="absolute rounded-full bg-primary/10"
    style={{ width: size, height: size, left: `${x}%` }}
    initial={{ y: '100vh', opacity: 0 }}
    animate={{
      y: '-10vh',
      opacity: [0, 0.6, 0],
    }}
    transition={{
      duration: 8 + Math.random() * 6,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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
      const success = await login(email, password, role);
      if (!success) setError('Invalid credentials');
    } catch {
      setError('Login failed');
    }
    setLoading(false);
    refreshCaptcha();
  };

  const fillDemo = (r: UserRole) => {
    setRole(r);
    refreshCaptcha();
    if (r === 'student') {
      setEmail('student@college.edu');
      setPassword('demo123');
    } else {
      setEmail('admin@library.edu');
      setPassword('admin123');
    }
  };

  const particles = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 1.2,
    x: Math.random() * 100,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/6 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
            style={{ background: 'var(--gradient-hero)' }}
          >
            <BookOpen className="w-10 h-10 text-primary-foreground" />
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary/30"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-3xl font-display font-bold text-foreground tracking-tight"
          >
            Smart Library
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-muted-foreground text-sm mt-2 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Intelligent Seat Reservation System
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex items-center justify-center gap-2 mt-4"
          >
            {[
              { icon: <Users className="w-3 h-3" />, text: 'Real-time' },
              { icon: <BarChart3 className="w-3 h-3" />, text: 'Analytics' },
              { icon: <BookOpen className="w-3 h-3" />, text: 'QR Check-in' },
            ].map((pill, i) => (
              <motion.span
                key={pill.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {pill.icon}
                {pill.text}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Role selection / Login form */}
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <p className="text-center text-sm text-muted-foreground mb-5">Choose how you'd like to sign in</p>

              {/* Student card */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fillDemo('student')}
                className="w-full rounded-xl p-5 flex items-center gap-4 transition-all duration-300 group border border-border bg-card hover:border-primary/50 hover:shadow-lg"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'var(--gradient-hero)' }}
                >
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-display font-bold text-foreground text-lg">Student</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Book seats, scan QR & check in</p>
                </div>
                <motion.div
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                  whileHover={{ x: 3 }}
                >
                  <ArrowLeft className="w-4 h-4 text-primary rotate-180" />
                </motion.div>
              </motion.button>

              {/* Admin card */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fillDemo('admin')}
                className="w-full rounded-xl p-5 flex items-center gap-4 transition-all duration-300 group border border-border bg-card hover:border-destructive/30 hover:shadow-lg"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'var(--gradient-admin)' }}
                >
                  <Shield className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-display font-bold text-foreground text-lg">Admin</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage seats, analytics & QR codes</p>
                </div>
                <motion.div
                  className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors"
                  whileHover={{ x: 3 }}
                >
                  <ArrowLeft className="w-4 h-4 text-destructive rotate-180" />
                </motion.div>
              </motion.button>

              <p className="text-center text-[10px] text-muted-foreground pt-3 opacity-60">
                Demo credentials are auto-filled for quick access
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin}
              className="rounded-xl border border-border bg-card p-6 space-y-4"
              style={{ boxShadow: 'var(--shadow-elevated)' }}
            >
              <div className="flex items-center gap-3 mb-1">
                <button
                  type="button"
                  onClick={() => { setRole(null); setError(''); }}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: role === 'student' ? 'var(--gradient-hero)' : 'var(--gradient-admin)' }}
                  >
                    {role === 'student' ? (
                      <BookOpen className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Shield className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-display font-bold text-foreground capitalize">{role} Login</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {/* Captcha */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-muted-foreground">Security Check</label>
                <div className="flex items-center gap-2">
                  <CaptchaCanvas code={captchaCode} />
                  <Button type="button" variant="outline" size="icon" onClick={refreshCaptcha} className="h-[45px] w-10 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  type="text"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  placeholder="Type the characters above"
                  required
                  maxLength={5}
                  className="font-mono tracking-[0.3em] text-center"
                  autoComplete="off"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-display font-semibold text-sm"
                disabled={loading || captchaInput.length < 5}
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Signing in...
                  </motion.span>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground opacity-60">
                Demo credentials are pre-filled
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;
