import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/library';
import { motion } from 'framer-motion';
import { BookOpen, Shield, Mail, Lock, ArrowRight, RefreshCw } from 'lucide-react';
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

    // Background
    ctx.fillStyle = 'hsl(160, 20%, 12%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 40%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text
    const colors = ['hsl(160, 84%, 55%)', 'hsl(45, 90%, 65%)', 'hsl(200, 80%, 60%)', 'hsl(340, 70%, 60%)', 'hsl(120, 60%, 55%)'];
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

  return <canvas ref={canvasRef} width={170} height={45} className="rounded-md border border-border" />;
};

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4"
          >
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground">Smart Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Seat Reservation System</p>
        </div>

        {/* Role selection */}
        {!role ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-center text-sm text-muted-foreground mb-4">Select your role to continue</p>
            <button
              onClick={() => fillDemo('student')}
              className="w-full glass-card p-5 flex items-center gap-4 hover:border-primary transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display font-semibold text-foreground">Student</p>
                <p className="text-xs text-muted-foreground">Book seats & check in</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button
              onClick={() => fillDemo('admin')}
              className="w-full glass-card p-5 flex items-center gap-4 hover:border-primary transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display font-semibold text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">Manage library & analytics</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className="glass-card p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setRole(null); setError(''); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <span className="text-sm font-medium text-foreground capitalize">{role} Login</span>
            </div>

            <div className="space-y-1">
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

            <div className="space-y-1">
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Verify you're human</label>
              <div className="flex items-center gap-2">
                <CaptchaCanvas code={captchaCode} />
                <Button type="button" variant="ghost" size="icon" onClick={refreshCaptcha} className="h-8 w-8 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <Input
                type="text"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                placeholder="Type the captcha above"
                required
                maxLength={5}
                className="font-mono tracking-widest"
                autoComplete="off"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || captchaInput.length < 5}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Demo: credentials are pre-filled
            </p>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;
