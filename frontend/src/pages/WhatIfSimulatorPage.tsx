import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { PredictionInput, PredictionResponse, QualityType } from '@/types';
import { formatWatts } from '@/utils/formatters';
import {
  Sliders,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const WhatIfSimulatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Baseline initial state (defaulting to a high wear sample)
  const [baseType] = useState<QualityType>((searchParams.get('type') as QualityType) || 'L');
  const [baseAir] = useState<number>(parseFloat(searchParams.get('air') || '300.5'));
  const [baseProc] = useState<number>(parseFloat(searchParams.get('proc') || '310.2'));
  const [baseRpm] = useState<number>(parseFloat(searchParams.get('rpm') || '1320'));
  const [baseTorque] = useState<number>(parseFloat(searchParams.get('torque') || '64.0'));
  const [baseWear] = useState<number>(parseFloat(searchParams.get('tool') || '210'));

  // Simulated (modified) state
  const [simType] = useState<QualityType>('L');
  const [simAir, setSimAir] = useState<number>(baseAir);
  const [simProc, setSimProc] = useState<number>(baseProc);
  const [simRpm, setSimRpm] = useState<number>(baseRpm);
  const [simTorque, setSimTorque] = useState<number>(baseTorque);
  const [simWear, setSimWear] = useState<number>(baseWear);

  // Predictions
  const [baseResult, setBaseResult] = useState<PredictionResponse | null>(null);
  const [simResult, setSimResult] = useState<PredictionResponse | null>(null);
  const [loadingSim, setLoadingSim] = useState<boolean>(false);

  // Debounce and race-condition safety ref
  const requestIdRef = useRef<number>(0);

  // Fetch baseline on mount
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const res = await api.predict(
          {
            quality_type: baseType,
            air_temperature_k: baseAir,
            process_temperature_k: baseProc,
            rotational_speed_rpm: baseRpm,
            torque_nm: baseTorque,
            tool_wear_min: baseWear,
          },
          false
        );
        setBaseResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBase();
  }, [baseType, baseAir, baseProc, baseRpm, baseTorque, baseWear]);

  // Debounced execution of modified scenario
  useEffect(() => {
    const currentId = ++requestIdRef.current;
    setLoadingSim(true);

    const timer = setTimeout(async () => {
      try {
        const payload: PredictionInput = {
          quality_type: simType,
          air_temperature_k: simAir,
          process_temperature_k: simProc,
          rotational_speed_rpm: simRpm,
          torque_nm: simTorque,
          tool_wear_min: simWear,
        };
        const res = await api.predict(payload, false);
        // Only update if this is the newest request
        if (currentId === requestIdRef.current) {
          setSimResult(res);
          setLoadingSim(false);
        }
      } catch {
        if (currentId === requestIdRef.current) {
          setLoadingSim(false);
        }
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(timer);
  }, [simType, simAir, simProc, simRpm, simTorque, simWear]);

  // Delta calculations
  const probDiff = simResult && baseResult
    ? Math.round((simResult.failure_probability - baseResult.failure_probability) * 1000) / 10
    : 0;

  const powerDiff = simResult && baseResult
    ? simResult.derived_power_watts - baseResult.derived_power_watts
    : 0;

  const resetToBaseline = () => {
    setSimAir(baseAir);
    setSimProc(baseProc);
    setSimRpm(baseRpm);
    setSimTorque(baseTorque);
    setSimWear(baseWear);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-7 h-7 text-[#23C8BB]" />
            What-If Scenario Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate parameter alterations to observe live ML model responses and evaluate preventive interventions.
          </p>
        </div>

        <button
          onClick={resetToBaseline}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Parameter Modification Controls */}
        <div className="lg:col-span-5 bg-[#111C30] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>Simulated Operating Variables</span>
            <span className="text-[10px] font-mono text-emerald-400">Live Inference Active</span>
          </h2>

          <div className="space-y-4 text-xs">
            {/* Spindle Speed Slider */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-slate-300">Spindle Speed [rpm]</span>
                <span className="text-white font-bold">{simRpm} RPM ({simRpm - baseRpm >= 0 ? `+${simRpm - baseRpm}` : simRpm - baseRpm})</span>
              </div>
              <input
                type="range"
                min={1000}
                max={3000}
                step={20}
                value={simRpm}
                onChange={e => setSimRpm(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1000 RPM</span>
                <span>Baseline: {baseRpm}</span>
                <span>3000 RPM</span>
              </div>
            </div>

            {/* Torque Slider */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-slate-300">Applied Torque [Nm]</span>
                <span className="text-white font-bold">{simTorque} Nm ({(simTorque - baseTorque).toFixed(1)} Nm)</span>
              </div>
              <input
                type="range"
                min={5}
                max={90}
                step={0.5}
                value={simTorque}
                onChange={e => setSimTorque(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5 Nm</span>
                <span>Baseline: {baseTorque}</span>
                <span>90 Nm</span>
              </div>
            </div>

            {/* Tool Wear Slider */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-slate-300">Tool Wear Time [min]</span>
                <span className="text-[#23C8BB] font-bold">{simWear} min ({simWear - baseWear} min)</span>
              </div>
              <input
                type="range"
                min={0}
                max={250}
                step={1}
                value={simWear}
                onChange={e => setSimWear(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0m (Fresh Insert)</span>
                <span>Baseline: {baseWear}m</span>
                <span>250m (Exhausted)</span>
              </div>
            </div>

            {/* Process Temp Slider */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-slate-300">Process Temperature [K]</span>
                <span className="text-white font-bold">{simProc.toFixed(1)} K</span>
              </div>
              <input
                type="range"
                min={295}
                max={325}
                step={0.1}
                value={simProc}
                onChange={e => setSimProc(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
            </div>

            {/* Air Temp Slider */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-slate-300">Air Temperature [K]</span>
                <span className="text-white font-bold">{simAir.toFixed(1)} K</span>
              </div>
              <input
                type="range"
                min={290}
                max={315}
                step={0.1}
                value={simAir}
                onChange={e => setSimAir(parseFloat(e.target.value))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baseline Card */}
            <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800 space-y-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                ORIGINAL BASELINE
              </span>
              <div className="flex items-center space-x-2">
                {baseResult?.machine_failure_prediction ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-bold text-base text-white">
                  {baseResult?.machine_failure_prediction ? 'FAILURE RISK' : 'NORMAL'}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200">
                {baseResult ? `${(baseResult.failure_probability * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="space-y-1 text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Power:</span>
                  <span className="text-slate-200">{baseResult ? formatWatts(baseResult.derived_power_watts) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ΔT:</span>
                  <span className="text-slate-200">{baseResult?.derived_temp_diff_k} K</span>
                </div>
                <div className="flex justify-between">
                  <span>Wear:</span>
                  <span className="text-slate-200">{baseWear} min</span>
                </div>
              </div>
            </div>

            {/* Simulated Card */}
            <div
              className={`p-5 rounded-xl border space-y-3 ${
                simResult?.machine_failure_prediction
                  ? 'bg-red-950/20 border-red-800/80'
                  : 'bg-emerald-950/20 border-emerald-800/80'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                  SIMULATED OUTCOME
                </span>
                {loadingSim && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#23C8BB]" />}
              </div>
              <div className="flex items-center space-x-2">
                {simResult?.machine_failure_prediction ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-bold text-base text-white">
                  {simResult?.machine_failure_prediction ? 'FAILURE RISK' : 'NORMAL'}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {simResult ? `${(simResult.failure_probability * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="space-y-1 text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Power:</span>
                  <span className="text-white">{simResult ? formatWatts(simResult.derived_power_watts) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ΔT:</span>
                  <span className="text-white">{simResult?.derived_temp_diff_k} K</span>
                </div>
                <div className="flex justify-between">
                  <span>Wear:</span>
                  <span className="text-white">{simWear} min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Delta Summary */}
          <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Simulation Impact Analysis</h3>
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Failure Probability Delta</span>
                <div className="flex items-center space-x-2 mt-1">
                  {probDiff < 0 ? (
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                  ) : probDiff > 0 ? (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  ) : null}
                  <span
                    className={`text-lg font-bold ${
                      probDiff < 0 ? 'text-emerald-400' : probDiff > 0 ? 'text-red-400' : 'text-slate-300'
                    }`}
                  >
                    {probDiff > 0 ? `+${probDiff}%` : `${probDiff}%`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {probDiff < 0 ? 'Intervention lowers failure risk' : 'Intervention elevates failure risk'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Spindle Power Delta</span>
                <p className="text-lg font-bold text-slate-100 mt-1">
                  {powerDiff > 0 ? `+${powerDiff.toLocaleString()} W` : `${powerDiff.toLocaleString()} W`}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Current simulated power: {simResult ? formatWatts(simResult.derived_power_watts) : '—'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic mt-2">
              Note: Results are hypothetical model responses computed via real-time inference, not guaranteed
              effects on physical equipment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
