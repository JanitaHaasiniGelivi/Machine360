import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, login } = useAuth();
  const [threshold, setThreshold] = useState<number>(0.5139);
  const [switching, setSwitching] = useState<boolean>(false);

  const handleDemoSwitch = async (email: string, pass: string) => {
    setSwitching(true);
    try {
      await login(email, pass);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Login switch failed');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-[#23C8BB]" />
          System Settings & Operational Configuration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage application roles, ML model decision thresholds, and runtime connectivity parameters.
        </p>
      </div>

      {/* User Profile & Role Switcher */}
      <div className="p-6 rounded-xl bg-[#111C30] border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <User className="w-4 h-4 text-[#23C8BB]" />
          Authenticated Operator Profile
        </h2>

        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Operator Name</span>
              <p className="text-sm font-bold text-white mt-1 font-sans">{user.full_name}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Email Address</span>
              <p className="text-sm font-bold text-slate-200 mt-1">{user.email}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Assigned Role</span>
              <span className="mt-1 inline-block uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {user.role}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Not currently logged in with active credentials.</p>
        )}

        {/* Quick Demo Switcher */}
        <div className="pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400 block mb-2 font-medium">
            Switch Demo Account (Quick Verification):
          </span>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <button
              onClick={() => handleDemoSwitch('admin@machinemind360.com', 'AdminPassword123!')}
              disabled={switching}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
            >
              👑 Login as Admin
            </button>
            <button
              onClick={() => handleDemoSwitch('technician@machinemind360.com', 'TechPassword123!')}
              disabled={switching}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
            >
              🔧 Login as Technician
            </button>
            <button
              onClick={() => handleDemoSwitch('viewer@machinemind360.com', 'ViewerPassword123!')}
              disabled={switching}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
            >
              👁️ Login as Viewer
            </button>
          </div>
        </div>
      </div>

      {/* ML Threshold Configuration */}
      <div className="p-6 rounded-xl bg-[#111C30] border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-[#23C8BB]" />
          Random Forest Decision Cutoff Threshold
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300">Classification Probability Threshold:</span>
            <span className="text-lg font-bold text-[#23C8BB]">{(threshold * 100).toFixed(2)}%</span>
          </div>

          <input
            type="range"
            min={0.3}
            max={0.7}
            step={0.01}
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-[#23C8BB] cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>30% (Higher Recall / More Alarms)</span>
            <span>Optimized: 51.39%</span>
            <span>70% (Higher Precision / Fewer Alarms)</span>
          </div>

          <p className="text-xs text-slate-400">
            Tuned on the AI4I training split cross-validation curve to balance false positives against
            unidentified mechanical failures.
          </p>
        </div>
      </div>

      {/* System Specifications */}
      <div className="p-6 rounded-xl bg-[#111C30] border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Cpu className="w-4 h-4 text-[#23C8BB]" />
          Platform Environment & Stack Architecture
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">BACKEND RUNTIME</span>
            <span className="text-white font-bold mt-1 block">FastAPI / Python 3.12+</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">FRONTEND STACK</span>
            <span className="text-white font-bold mt-1 block">React 18 / TypeScript / Vite</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">DATABASE PERSISTENCE</span>
            <span className="text-white font-bold mt-1 block">PostgreSQL / SQLite ORM</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">CHAMPION ML PIPELINE</span>
            <span className="text-[#23C8BB] font-bold mt-1 block">Random Forest (200 Trees)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">MIGRATIONS ENGINE</span>
            <span className="text-white font-bold mt-1 block">Alembic 1.13+</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PRIMARY DATASET</span>
            <span className="text-white font-bold mt-1 block">UCI AI4I 2020 (10k Rows)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
