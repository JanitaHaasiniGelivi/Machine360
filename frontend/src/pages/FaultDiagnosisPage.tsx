import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { PredictionResponse } from '@/types';
import { formatWatts } from '@/utils/formatters';
import {
  AlertTriangle,
  Flame,
  Zap,
  Wrench,
  HelpCircle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Activity,
} from 'lucide-react';

const FAULT_DETAILS = [
  {
    code: 'TWF',
    name: 'Tool Wear Failure',
    icon: Wrench,
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-800',
    textColor: 'text-amber-400',
    formula: 'Tool Wear Time ≥ 200 – 240 minutes',
    rootCause:
      'Continuous micro-abrasion of carbide tool cutting inserts leads to edge breakdown, loss of tolerance, and sudden breakage.',
    mitigation:
      'Replace indexable inserts every 180–200 cutting minutes. Implement automated cutter tool life tracking.',
  },
  {
    code: 'HDF',
    name: 'Heat Dissipation Failure',
    icon: Flame,
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-800',
    textColor: 'text-red-400',
    formula: '(Process Temp - Air Temp < 8.6 K) AND (Rotational Speed < 1,380 RPM)',
    rootCause:
      'Inadequate air flow at low spindle speeds coupled with heavy cutting friction traps thermal energy within the workpiece/tool interface.',
    mitigation:
      'Verify auxiliary flood coolant pressure (≥ 3.0 bar), clean radiator fins, and ensure coolant-to-water ratio is between 7% and 9%.',
  },
  {
    code: 'PWF',
    name: 'Power Failure',
    icon: Zap,
    color: '#60A5FA',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-800',
    textColor: 'text-blue-400',
    formula: 'Power = Torque × 2π × RPM / 60 (< 3,500 W or > 9,000 W)',
    rootCause:
      'Spindle drive motor operates outside rated capacity. Below 3,500W indicates drive stall or slippage; above 9,000W causes electrical overload.',
    mitigation:
      'Inspect spindle VFD inverter logs, check motor thermal sensors, and optimize cutting feed rate and axial depth.',
  },
  {
    code: 'OSF',
    name: 'Overstrain Failure',
    icon: AlertTriangle,
    color: '#EC4899',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-800',
    textColor: 'text-pink-400',
    formula: 'Tool Wear [min] × Torque [Nm] > 11,000 (L) / 12,000 (M) / 13,000 (H)',
    rootCause:
      'Heavy cutting torque applied to an already degraded tool blade exceeds mechanical shear strength, causing sudden catastrophic fracture.',
    mitigation:
      'Reduce machining feed rate on workpieces with high material hardness. Avoid heavy roughing passes with worn cutters.',
  },
  {
    code: 'RNF',
    name: 'Random Failure',
    icon: HelpCircle,
    color: '#8B5CF6',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-800',
    textColor: 'text-purple-400',
    formula: 'Stochastic failure (~0.1% baseline across all observations)',
    rootCause:
      'Uncorrelated anomalies such as workpiece metallurgical voids, transient voltage surges, or foreign debris entanglement.',
    mitigation:
      'Audit incoming raw material certifications, inspect spindle electrical line filters, and ensure proper chip shielding.',
  },
];

export const FaultDiagnosisPage: React.FC = () => {
  const [history, setHistory] = useState<PredictionResponse[]>([]);
  const [selectedPred, setSelectedPred] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    api.listPredictions(10).then(preds => {
      setHistory(preds);
      if (preds.length > 0) {
        setSelectedPred(preds[0]);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-[#23C8BB]" />
          Explainable Industrial Fault Taxonomy
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Root-cause physical mechanisms, mathematical boundaries, and inspection guidelines for AI4I failure modes.
        </p>
      </div>

      {/* Model Limitations Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
        <Info className="w-5 h-5 text-[#60A5FA] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white block">Dataset Scope & Scientific Notice:</span>
          <p className="text-slate-400">
            MachineMind 360 uses the verified UCI AI4I 2020 Predictive Maintenance dataset. The dataset contains 10,000
            synthetic milling observations with strictly defined physical relationships. It does <strong>not</strong> contain
            measured high-frequency vibration, acoustic emissions, thermal imaging, or time-series remaining useful life (RUL).
            All calculations here reflect genuine physical features derived from torque, speed, and temperatures.
          </p>
        </div>
      </div>

      {/* 5 Failure Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FAULT_DETAILS.map(f => {
          const Icon = f.icon;
          return (
            <div
              key={f.code}
              className="p-5 rounded-xl bg-[#111C30] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg ${f.bgColor} ${f.textColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-white">{f.code}</span>
                      <h3 className="text-sm font-bold text-slate-200">{f.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                      Physical Condition / Formula
                    </span>
                    <p className="font-mono text-slate-200 bg-slate-900 p-2 rounded border border-slate-800 mt-1">
                      {f.formula}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                      Physical Root Cause
                    </span>
                    <p className="text-slate-300 mt-0.5">{f.rootCause}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                      Technician Mitigation
                    </span>
                    <p className="text-slate-400 mt-0.5">{f.mitigation}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Telemetry Diagnostics Inspection */}
      {selectedPred && (
        <div className="p-6 rounded-xl bg-[#111C30] border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#23C8BB]" />
                Selected Telemetry Observation Diagnostic
              </h2>
              <p className="text-xs text-slate-400">
                Evaluation of physical features against failure criteria
              </p>
            </div>

            {/* Observation Selector */}
            {history.length > 0 && (
              <select
                value={selectedPred.id || ''}
                onChange={e => {
                  const found = history.find(p => p.id === parseInt(e.target.value, 10));
                  if (found) setSelectedPred(found);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
              >
                {history.map(p => (
                  <option key={p.id} value={p.id}>
                    Observation #{p.id} — {p.risk_level} Risk ({(p.failure_probability * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Mechanical Power</span>
              <p className="text-base font-bold text-white mt-1">
                {formatWatts(selectedPred.derived_power_watts)}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {selectedPred.derived_power_watts < 3500 || selectedPred.derived_power_watts > 9000
                  ? '⚠️ Out of Safe Limits (PWF Risk)'
                  : '✓ Inside 3.5k–9kW Safe Range'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Thermal Delta (ΔT)</span>
              <p className="text-base font-bold text-white mt-1">
                {selectedPred.derived_temp_diff_k} K
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {selectedPred.derived_temp_diff_k < 8.6
                  ? '⚠️ Critical Thermal Bound (< 8.6 K)'
                  : '✓ Normal Heat Dissipation'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Rotational Speed</span>
              <p className="text-base font-bold text-white mt-1">
                {selectedPred.input_readings.rotational_speed_rpm} RPM
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {selectedPred.input_readings.rotational_speed_rpm < 1380
                  ? '⚠️ Low Spindle Fanning Speed'
                  : '✓ Normal Spindle Speed'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Tool Wear Time</span>
              <p className="text-base font-bold text-white mt-1">
                {selectedPred.input_readings.tool_wear_min} min
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {selectedPred.input_readings.tool_wear_min >= 200
                  ? '⚠️ Critical Blade Wear (TWF Risk)'
                  : '✓ Usable Insert Life Remaining'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
