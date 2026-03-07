import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/library';
import { motion } from 'framer-motion';
import { BookOpen, Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError('');
    try {
      const success = await login(email, password, role);
      if (!success) setError('Invalid credentials');
    } catch {
      setError('Login failed');
    }
    setLoading(false);
  };

  const fillDemo = (r: UserRole) => {
    setRole(r);
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
                onClick={() => setRole(null)}
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

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
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
