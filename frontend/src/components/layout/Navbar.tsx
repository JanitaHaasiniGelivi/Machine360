import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Bell, LogOut, ShieldCheck, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0B1220]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Telemetry Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#23C8BB] to-[#60A5FA] flex items-center justify-center shadow-lg shadow-[#23C8BB]/20">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              MachineMind <span className="text-[#23C8BB]">360</span>
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400 font-medium">LIVE TELEMETRY ACTIVE</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            title="Active Notifications"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]"></span>
          </button>
        </div>

        {/* User Pill */}
        {user ? (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">{user.full_name}</span>
              <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-950 hover:text-red-400 text-slate-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono text-slate-400">DEMO ACCESS</span>
          </div>
        )}
      </div>
    </header>
  );
};
