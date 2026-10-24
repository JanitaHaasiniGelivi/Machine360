import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatWatts } from '@/utils/formatters';
import {
  Box,
  Cpu,
  Flame,
  Gauge,
  RotateCw,
  Sliders,
  Wrench,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export const DigitalTwinPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Initial values from query params or defaults
  const [rpm, setRpm] = useState<number>(
    parseFloat(searchParams.get('rpm') || '1450')
  );
  const [torque, setTorque] = useState<number>(
    parseFloat(searchParams.get('torque') || '45.0')
  );
  const [toolWear, setToolWear] = useState<number>(
    parseFloat(searchParams.get('tool') || '25')
  );
  const [procTemp, setProcTemp] = useState<number>(
    parseFloat(searchParams.get('proc') || '308.5')
  );
  const [airTemp, setAirTemp] = useState<number>(
    parseFloat(searchParams.get('air') || '298.2')
  );

  const [activeSection, setActiveSection] = useState<'motor' | 'spindle' | 'tool' | 'cooling'>('spindle');

  // Derived physics
  const powerWatts = Math.round((torque * 2 * Math.PI * rpm) / 60);
  const tempDiff = Math.round((procTemp - airTemp) * 10) / 10;

  // Status checks
  const isToolWearCritical = toolWear >= 200;
  const isPowerCritical = powerWatts < 3500 || powerWatts > 9000;
  const isHdfCritical = tempDiff < 8.6 && rpm < 1380;
  const isCritical = isToolWearCritical || isPowerCritical || isHdfCritical;

  // Dynamic Spindle Animation Speed: 0.2s for high rpm down to 1.5s for low
  const animDuration = Math.max(0.15, Math.min(1.5, 3000 / (rpm || 1000)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Box className="w-7 h-7 text-[#23C8BB]" />
            Machine Digital Twin — 2D Subsystem Visualizer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time interactive physical twin displaying thermal gradients, mechanical stress, and insert wear.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center space-x-1.5 ${
              isCritical
                ? 'bg-red-950 text-red-400 border-red-800'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}
          >
            {isCritical ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{isCritical ? 'SUBSYSTEM ANOMALY DETECTED' : 'SUBSYSTEM HEALTH OPTIMAL'}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Canvas Twin */}
        <div className="lg:col-span-8 bg-[#111C30] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs uppercase font-mono text-slate-400">
              Interactive CNC Milling Spindle Twin (VMC-5000X)
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live SVG Physical Model
            </span>
          </div>

          {/* SVG Digital Twin Schematic */}
          <div className="my-6 flex items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-900 overflow-hidden min-h-[380px] relative">
            <svg
              viewBox="0 0 800 400"
              className="w-full max-w-2xl h-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Thermal gradient */}
                <linearGradient id="thermalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={procTemp > 311 ? '#EF4444' : procTemp > 309 ? '#F59E0B' : '#23C8BB'}
                    stopOpacity="0.8"
                  />
                  <stop offset="100%" stopColor="#1E293B" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="motorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                <linearGradient id="coolantGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Machine Chassis Housing */}
              <rect x="50" y="40" width="700" height="320" rx="16" fill="#0B1220" stroke="#1E293B" strokeWidth="3" />
              <text x="75" y="75" fill="#64748B" fontSize="12" fontFamily="monospace">
                FRAME: CNC VERTICAL SPINDLE ASSEMBLY #1
              </text>

              {/* Section 1: Motor & Electrical Drive (Clickable) */}
              <g
                onClick={() => setActiveSection('motor')}
                className="cursor-pointer group"
              >
                <rect
                  x="90"
                  y="100"
                  width="180"
                  height="200"
                  rx="10"
                  fill="url(#motorGrad)"
                  stroke={activeSection === 'motor' ? '#23C8BB' : '#334155'}
                  strokeWidth={activeSection === 'motor' ? '3' : '1.5'}
                />
                {/* Motor Cooling Fins */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line
                    key={i}
                    x1="110"
                    y1={130 + i * 25}
                    x2="250"
                    y2={130 + i * 25}
                    stroke="#475569"
                    strokeWidth="2"
                  />
                ))}
                <text x="180" y="275" fill="#F8FAFC" fontSize="13" fontWeight="bold" textAnchor="middle">
                  SPINDLE DRIVE
                </text>
                <text x="180" y="292" fill="#94A3B8" fontSize="11" fontFamily="monospace" textAnchor="middle">
                  {formatWatts(powerWatts)}
                </text>
              </g>

              {/* Coupling Shaft */}
              <rect x="270" y="180" width="60" height="40" fill="#64748B" rx="4" />

              {/* Section 2: Mechanical Drive / Spindle Bearings (Clickable) */}
              <g
                onClick={() => setActiveSection('spindle')}
                className="cursor-pointer"
              >
                <rect
                  x="330"
                  y="130"
                  width="180"
                  height="140"
                  rx="12"
                  fill="#1E293B"
                  stroke={activeSection === 'spindle' ? '#23C8BB' : '#334155'}
                  strokeWidth={activeSection === 'spindle' ? '3' : '1.5'}
                />
                {/* Rotating Spindle Graphic */}
                <circle
                  cx="420"
                  cy="200"
                  r="45"
                  fill="#0F172A"
                  stroke="#38BDF8"
                  strokeWidth="3"
                  strokeDasharray="10 6"
                  style={{
                    transformOrigin: '420px 200px',
                    animation: `spin ${animDuration}s linear infinite`,
                  }}
                />
                <circle cx="420" cy="200" r="15" fill="#23C8BB" />
                <text x="420" y="160" fill="#F8FAFC" fontSize="13" fontWeight="bold" textAnchor="middle">
                  MAIN SPINDLE
                </text>
                <text x="420" y="255" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle">
                  {rpm} RPM
                </text>
              </g>

              {/* Section 3: Tool Holder & Cutter Blade (Clickable) */}
              <g
                onClick={() => setActiveSection('tool')}
                className="cursor-pointer"
              >
                {/* Tool Collet Holder */}
                <polygon
                  points="510,175 580,185 580,215 510,225"
                  fill="#475569"
                  stroke={activeSection === 'tool' ? '#23C8BB' : '#334155'}
                  strokeWidth={activeSection === 'tool' ? '3' : '1.5'}
                />
                {/* Cutter Bit */}
                <rect
                  x="580"
                  y="190"
                  width="60"
                  height="20"
                  fill={isToolWearCritical ? '#EF4444' : '#E2E8F0'}
                  stroke="#64748B"
                  rx="2"
                />
                {/* Tool wear erosion visual indicator */}
                <line
                  x1="640"
                  y1="190"
                  x2="640"
                  y2="210"
                  stroke="#F59E0B"
                  strokeWidth={Math.min(10, Math.max(2, (toolWear / 240) * 8))}
                />
                <text x="610" y="160" fill="#F8FAFC" fontSize="13" fontWeight="bold" textAnchor="middle">
                  CUTTER TOOL
                </text>
                <text x="610" y="240" fill={isToolWearCritical ? '#EF4444' : '#22C55E'} fontSize="11" fontFamily="monospace" textAnchor="middle">
                  Wear: {toolWear}m
                </text>
              </g>

              {/* Section 4: Thermal Coolant Jacket (Clickable) */}
              <g
                onClick={() => setActiveSection('cooling')}
                className="cursor-pointer"
              >
                <rect
                  x="330"
                  y="80"
                  width="180"
                  height="40"
                  rx="6"
                  fill="url(#coolantGrad)"
                  stroke={activeSection === 'cooling' ? '#23C8BB' : '#0284C7'}
                  strokeWidth={activeSection === 'cooling' ? '2.5' : '1'}
                />
                <text x="420" y="105" fill="#E0F2FE" fontSize="11" fontWeight="bold" textAnchor="middle">
                  COOLING JACKET (ΔT: {tempDiff} K)
                </text>
              </g>

              {/* Workpiece */}
              <rect x="660" y="150" width="60" height="100" rx="4" fill="#334155" stroke="#475569" />
              <text x="690" y="205" fill="#94A3B8" fontSize="10" textAnchor="middle" transform="rotate(-90 690 205)">
                TITANIUM
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-3">
              <span className="text-slate-500">Interactive Hotspots:</span>
              <button
                onClick={() => setActiveSection('spindle')}
                className={`px-2 py-1 rounded ${activeSection === 'spindle' ? 'bg-[#23C8BB] text-slate-950 font-bold' : 'hover:text-white'}`}
              >
                Spindle
              </button>
              <button
                onClick={() => setActiveSection('motor')}
                className={`px-2 py-1 rounded ${activeSection === 'motor' ? 'bg-[#23C8BB] text-slate-950 font-bold' : 'hover:text-white'}`}
              >
                Drive Motor
              </button>
              <button
                onClick={() => setActiveSection('tool')}
                className={`px-2 py-1 rounded ${activeSection === 'tool' ? 'bg-[#23C8BB] text-slate-950 font-bold' : 'hover:text-white'}`}
              >
                Cutter Tool
              </button>
              <button
                onClick={() => setActiveSection('cooling')}
                className={`px-2 py-1 rounded ${activeSection === 'cooling' ? 'bg-[#23C8BB] text-slate-950 font-bold' : 'hover:text-white'}`}
              >
                Cooling
              </button>
            </div>
            <span>Click any module to inspect operational status</span>
          </div>
        </div>

        {/* Real-time Subsystem Detail & Interactive Sliders */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Subsystem Detail Card */}
          <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#23C8BB]" />
              {activeSection === 'motor' && 'Motor & Drive Electronics'}
              {activeSection === 'spindle' && 'Spindle Rotation & Bearing'}
              {activeSection === 'tool' && 'Cutter Insert & Tool Wear'}
              {activeSection === 'cooling' && 'Thermal & Coolant Envelope'}
            </h3>

            <div className="space-y-3 text-xs">
              {activeSection === 'motor' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Mechanical Spindle Power</span>
                    <span className="font-mono font-bold text-white">{formatWatts(powerWatts)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Applied Torque</span>
                    <span className="font-mono font-bold text-white">{torque} Nm</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">PWF Power Envelope</span>
                    <span className={`font-mono font-bold ${isPowerCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isPowerCritical ? 'CRITICAL ABERRATION' : 'OPTIMAL (3.5k–9kW)'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-2">
                    Spindle power is calculated directly using the physics formula: Power = Torque × 2π × RPM / 60.
                  </p>
                </>
              )}

              {activeSection === 'spindle' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Rotational Speed</span>
                    <span className="font-mono font-bold text-white">{rpm} RPM</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">RPM Category</span>
                    <span className="font-mono font-bold text-white">
                      {rpm < 1380 ? 'Low RPM (Fanning Sag)' : rpm > 2200 ? 'High Speed Pass' : 'Standard Baseline'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Spindle Balance</span>
                    <span className="font-mono font-bold text-emerald-400">Verified Dynamic Centering</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-2">
                    Visual rotation frequency syncs dynamically with the RPM parameter.
                  </p>
                </>
              )}

              {activeSection === 'tool' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Cumulative Tool Wear Time</span>
                    <span className="font-mono font-bold text-white">{toolWear} min</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">TWF Wear Threshold</span>
                    <span className={`font-mono font-bold ${isToolWearCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isToolWearCritical ? 'EXCEEDED (≥200m)' : 'WITHIN LIMITS'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Overstrain Factor</span>
                    <span className="font-mono font-bold text-white">
                      {(toolWear * torque).toLocaleString()} min·Nm
                    </span>
                  </div>
                </>
              )}

              {activeSection === 'cooling' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Process Temperature</span>
                    <span className="font-mono font-bold text-white">{procTemp} K</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Air Intake Temperature</span>
                    <span className="font-mono font-bold text-white">{airTemp} K</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Dissipation Delta (ΔT)</span>
                    <span className={`font-mono font-bold ${tempDiff < 8.6 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tempDiff} K {tempDiff < 8.6 ? '(HDF Critical < 8.6K)' : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Interactive Parameter Controls */}
          <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-[#23C8BB]" />
              Twin Telemetry Controls
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Spindle Speed</span>
                <span className="font-mono text-white">{rpm} RPM</span>
              </div>
              <input
                type="range"
                min={800}
                max={3000}
                step={25}
                value={rpm}
                onChange={e => setRpm(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Torque</span>
                <span className="font-mono text-white">{torque} Nm</span>
              </div>
              <input
                type="range"
                min={5}
                max={90}
                step={0.5}
                value={torque}
                onChange={e => setTorque(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Tool Wear</span>
                <span className="font-mono text-white">{toolWear} min</span>
              </div>
              <input
                type="range"
                min={0}
                max={250}
                step={1}
                value={toolWear}
                onChange={e => setToolWear(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
