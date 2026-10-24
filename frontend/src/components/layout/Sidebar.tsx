import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Zap,
  AlertTriangle,
  Box,
  Sliders,
  FileSpreadsheet,
  Wrench,
  DollarSign,
  Bot,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Machines', path: '/machines', icon: Cpu },
  { name: 'AI Prediction', path: '/predict', icon: Zap },
  { name: 'Fault Diagnosis', path: '/diagnosis', icon: AlertTriangle },
  { name: 'Digital Twin', path: '/digital-twin', icon: Box },
  { name: 'What-If Simulator', path: '/simulator', icon: Sliders },
  { name: 'Batch Analysis', path: '/batch', icon: FileSpreadsheet },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Cost Simulator', path: '/cost-simulator', icon: DollarSign },
  { name: 'AI Copilot', path: '/copilot', icon: Bot },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#0B1220] border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="py-4 px-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
          FACTORY COMMAND
        </div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#19263B] text-[#23C8BB] font-semibold border-l-2 border-[#23C8BB] shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Model Spec Badge */}
      <div className="p-4 border-t border-slate-800 bg-[#111C30]/50 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-300">Model:</span>
          <span className="text-emerald-400 font-medium">RF-v1.0 (98.2% Acc)</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-300">Dataset:</span>
          <span className="text-slate-200">UCI AI4I 2020</span>
        </div>
      </div>
    </aside>
  );
};
