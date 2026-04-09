import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, UserRole } from '@/types/library';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: UserRole, extra?: { rollNumber?: string; branch?: string; year?: string; subject?: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(userId: string): Promise<User | null> {
  const [profileRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const role: UserRole = rolesRes.data?.some(r => r.role === 'admin') ? 'admin' : 'student';

  return {
    userId: profile.user_id,
    name: profile.name || '',
    email: profile.email || '',
    rollNumber: profile.roll_number || '',
    role,
    dailyBookingCount: 0,
    branch: profile.branch || '',
    year: profile.year || '',
    subject: profile.subject || '',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // 1. Listen for auth changes — NO await inside callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      if (session?.user) {
        // Fire-and-forget profile fetch
        fetchUserProfile(session.user.id).then(profile => {
          if (mountedRef.current) {
            setUser(profile);
            setLoading(false);
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // 2. Restore session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          if (mountedRef.current) {
            setUser(profile);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string, _role: UserRole): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    extra?: { rollNumber?: string; branch?: string; year?: string; subject?: string }
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error || !data.user) return false;

    // Update profile with extra info (fire-and-forget, don't block)
    supabase.from('profiles').update({
      name,
      roll_number: extra?.rollNumber || '',
      branch: extra?.branch || '',
      year: extra?.year || '',
      subject: extra?.subject || '',
    }).eq('user_id', data.user.id).then(() => {});

    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
