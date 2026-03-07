import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/library';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, User> = {
  'student@college.edu': {
    userId: 'stu-001',
    name: 'Arjun Kumar',
    email: 'student@college.edu',
    rollNumber: '22CS101',
    role: 'student',
    dailyBookingCount: 0,
  },
  'admin@library.edu': {
    userId: 'adm-001',
    name: 'Dr. Priya Sharma',
    email: 'admin@library.edu',
    rollNumber: 'ADMIN',
    role: 'admin',
    dailyBookingCount: 0,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, _password: string, role: UserRole): Promise<boolean> => {
    // Mock authentication
    const mockUser = MOCK_USERS[email];
    if (mockUser && mockUser.role === role) {
      setUser(mockUser);
      return true;
    }
    // Allow any login for demo
    setUser({
      userId: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      rollNumber: role === 'student' ? 'DEMO' : 'ADMIN',
      role,
      dailyBookingCount: 0,
    });
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
