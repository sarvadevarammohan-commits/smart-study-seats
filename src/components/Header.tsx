import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { BookOpen, LogOut, Sun, Moon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useLibrary();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-xl shadow-sm">
      <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-foreground leading-none">Smart Library</h1>
            <p className="text-[10px] text-muted-foreground">
              {user?.name} • {user?.role}
              {user?.branch && ` • ${user.branch}`}
              {user?.year && ` • ${user.year}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2.5 py-1 border border-border">
            <Calendar className="w-3 h-3 text-primary" />
            <span>{dateStr}</span>
            <span className="text-primary font-mono font-medium">{timeStr}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
