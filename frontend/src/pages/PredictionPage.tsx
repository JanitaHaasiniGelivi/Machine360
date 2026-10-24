import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { PredictionInput, PredictionResponse, FactoryAsset } from '@/types';
import { kelvinToCelsius, celsiusToKelvin, formatWatts } from '@/utils/formatters';
import {
  Zap,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Thermometer,
  RotateCw,
  Wrench,
  Sliders,
  Box,
  ClipboardList,
  Sparkles,
  Info,
} from 'lucide-react';

export const PredictionPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assetIdParam = searchParams.get('asset_id');

  const [machines, setMachines] = useState<FactoryAsset[]>([]);
  const [tempUnit, setTempUnit] = useState<'K' | 'C'>('K');

  // Form values (internal storage in Kelvin for accuracy)
  const [qualityType, setQualityType] = useState<'L' | 'M' | 'H'>('M');
  const [airTempK, setAirTempK] = useState<number>(298.2);
  const [procTempK, setProcTempK] = useState<number>(308.7);
  const [rpm, setRpm] = useState<number>(1408);
  const [torqueNm, setTorqueNm] = useState<number>(46.3);
  const [toolWearMin, setToolWearMin] = useState<number>(15);
  const [selectedAssetId, setSelectedAssetId] = useState<number | undefined>(
    assetIdParam ? parseInt(assetIdParam, 10) : undefined
  );
  const [notes, setNotes] = useState<string>('');

  // Result state
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketCreated, setTicketCreated] = useState<boolean>(false);
  const [isTicketLoading, setIsTicketLoading] = useState<boolean>(false);

  useEffect(() => {
    api.listMachines().then(res => setMachines(res)).catch(() => {});
  }, []);

  // Display temperature values based on current unit
  const displayAirTemp = tempUnit === 'C' ? kelvinToCelsius(airTempK) : airTempK;
  const displayProcTemp = tempUnit === 'C' ? kelvinToCelsius(procTempK) : procTempK;

  const handleAirTempChange = (val: number) => {
    if (tempUnit === 'C') {
      setAirTempK(celsiusToKelvin(val));
    } else {
      setAirTempK(val);
    }
  };

  const handleProcTempChange = (val: number) => {
    if (tempUnit === 'C') {
      setProcTempK(celsiusToKelvin(val));
    } else {
      setProcTempK(val);
    }
  };

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTicketCreated(false);

    try {
      const payload: PredictionInput = {
        asset_id: selectedAssetId,
        quality_type: qualityType,
        air_temperature_k: airTempK,
        process_temperature_k: procTempK,
        rotational_speed_rpm: rpm,
        torque_nm: torqueNm,
        tool_wear_min: toolWearMin,
        notes: notes || undefined,
      };

      const res = await api.predict(payload, hasRole(['admin', 'technician']));
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inference request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!result) return;
    setIsTicketLoading(true);
    try {
      const asset = machines.find(m => m.id === selectedAssetId) || machines[0];
      await api.createTicket({
        asset_id: asset ? asset.id : 1,
        prediction_id: result.id,
        issue_summary: `Predicted ${result.risk_level} failure risk (${(result.failure_probability * 100).toFixed(1)}%) - Power ${result.derived_power_watts}W`,
        priority: result.risk_level === 'CRITICAL' ? 'critical' : 'high',
        assigned_technician: asset?.assigned_technician || 'Lead CNC Technician',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      });
      setTicketCreated(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create work order.');
    } finally {
      setIsTicketLoading(false);
    }
  };

  const handleOpenSimulator = () => {
    navigate(
      `/simulator?type=${qualityType}&air=${airTempK}&proc=${procTempK}&rpm=${rpm}&torque=${torqueNm}&tool=${toolWearMin}`
    );
  };

  const handleOpenDigitalTwin = () => {
    navigate(
      `/digital-twin?rpm=${rpm}&torque=${torqueNm}&tool=${toolWearMin}&proc=${procTempK}&air=${airTempK}`
    );
  };

  // Preset demo conditions
  const loadPreset = (type: 'normal' | 'twf' | 'hdf' | 'pwf') => {
    if (type === 'normal') {
      setQualityType('M');
      setAirTempK(298.1);
      setProcTempK(308.6);
      setRpm(1551);
      setTorqueNm(42.8);
      setToolWearMin(12);
    } else if (type === 'twf') {
      // High Tool Wear condition
      setQualityType('L');
      setAirTempK(298.9);
      setProcTempK(309.2);
      setRpm(1390);
      setTorqueNm(52.0);
      setToolWearMin(225);
    } else if (type === 'hdf') {
      // Heat Dissipation condition (Low temp diff & low RPM)
      setQualityType('L');
      setAirTempK(302.5);
      setProcTempK(310.4); // diff = 7.9 K (< 8.6 K)
      setRpm(1320); // < 1380 RPM
      setTorqueNm(55.0);
      setToolWearMin(90);
    } else if (type === 'pwf') {
      // Power Failure condition (Extreme torque / power surge)
      setQualityType('H');
      setAirTempK(300.2);
      setProcTempK(310.5);
      setRpm(1230);
      setTorqueNm(76.5); // High power ~9800 W
      setToolWearMin(80);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-[#23C8BB] fill-current" />
            Explainable AI Prediction Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Execute real-time ML inference on machine operating parameters using the trained AI4I Random Forest model.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px] hidden lg:inline">Presets:</span>
          <button
            onClick={() => loadPreset('normal')}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Normal
          </button>
          <button
            onClick={() => loadPreset('twf')}
            className="px-2.5 py-1.5 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800"
          >
            TWF Wear
          </button>
          <button
            onClick={() => loadPreset('hdf')}
            className="px-2.5 py-1.5 rounded bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800"
          >
            HDF Thermal
          </button>
          <button
            onClick={() => loadPreset('pwf')}
            className="px-2.5 py-1.5 rounded bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800"
          >
            PWF Power
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Telemetry Input Form */}
        <div className="lg:col-span-5 bg-[#111C30] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#23C8BB]" />
              Machine Telemetry Inputs
            </h2>

            {/* Unit Toggle */}
            <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTempUnit('K')}
                className={`px-2 py-0.5 rounded ${tempUnit === 'K' ? 'bg-[#23C8BB] text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                Kelvin [K]
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`px-2 py-0.5 rounded ${tempUnit === 'C' ? 'bg-[#23C8BB] text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                Celsius [°C]
              </button>
            </div>
          </div>

          <form onSubmit={handleRunInference} className="space-y-4 text-xs">
            {/* Target Asset */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Machinery (Optional Link)</label>
              <select
                value={selectedAssetId || ''}
                onChange={e => setSelectedAssetId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-[#23C8BB]"
              >
                <option value="">Unlinked Observation (Ad-Hoc Analysis)</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.asset_id} — {m.name} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Variant Type */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                AI4I Product Quality Variant (Type L / M / H)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['L', 'M', 'H'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQualityType(t)}
                    className={`py-2 rounded-lg font-mono font-semibold transition-all border ${
                      qualityType === t
                        ? 'bg-[#23C8BB] text-slate-950 border-[#23C8BB]'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Type {t} {t === 'L' ? '(50%)' : t === 'M' ? '(30%)' : '(20%)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperatures */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                  <span>Air Temperature</span>
                  <span className="font-mono text-slate-500 text-[10px]">[{tempUnit}]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={displayAirTemp}
                  onChange={e => handleAirTempChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-[#23C8BB]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                  <span>Process Temperature</span>
                  <span className="font-mono text-slate-500 text-[10px]">[{tempUnit}]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={displayProcTemp}
                  onChange={e => handleProcTempChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-[#23C8BB]"
                />
              </div>
            </div>

            {/* Speed & Torque */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Rotational Speed <span className="font-mono text-slate-500 text-[10px]">[rpm]</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  min={800}
                  max={3500}
                  value={rpm}
                  onChange={e => setRpm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-[#23C8BB]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Torque <span className="font-mono text-slate-500 text-[10px]">[Nm]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={1}
                  max={120}
                  value={torqueNm}
                  onChange={e => setTorqueNm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-[#23C8BB]"
                />
              </div>
            </div>

            {/* Tool Wear */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Tool Wear Time</label>
                <span className="font-mono text-[#23C8BB] font-bold">{toolWearMin} min</span>
              </div>
              <input
                type="range"
                min={0}
                max={260}
                value={toolWearMin}
                onChange={e => setToolWearMin(parseInt(e.target.value, 10))}
                className="w-full accent-[#23C8BB] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 min (Fresh)</span>
                <span>150 min (Warning)</span>
                <span>240 min (Limit)</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Observation Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. End of 1st shift machining pass"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#23C8BB]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold text-sm shadow-lg shadow-[#23C8BB]/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{loading ? 'Evaluating Model...' : 'Execute ML Inference'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results & Explainability */}
        <div className="lg:col-span-7 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-5">
              {/* Outcome Card */}
              <div
                className={`p-6 rounded-xl border ${
                  result.machine_failure_prediction
                    ? 'bg-red-950/30 border-red-700/80'
                    : 'bg-emerald-950/30 border-emerald-700/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                      ML Classification Outcome
                    </span>
                    <div className="flex items-center space-x-3 mt-1">
                      {result.machine_failure_prediction ? (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                          <h3 className="text-xl font-bold text-red-300 tracking-tight">
                            MACHINE FAILURE PREDICTED
                          </h3>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <h3 className="text-xl font-bold text-emerald-300 tracking-tight">
                            NORMAL OPERATING CONDITIONS
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono">Failure Probability</span>
                    <div className="text-2xl font-bold font-mono text-white">
                      {(result.failure_probability * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Decision Cutoff: {(result.threshold_used * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Derived Physics Callouts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase">Mechanical Power</span>
                    <p className="text-white font-bold text-sm mt-0.5">
                      {formatWatts(result.derived_power_watts)}
                    </p>
                    <span className="text-[10px] text-slate-400">Torque × 2π × RPM / 60</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase">Temp Delta (ΔT)</span>
                    <p className="text-white font-bold text-sm mt-0.5">
                      {result.derived_temp_diff_k} K
                    </p>
                    <span className="text-[10px] text-slate-400">Process - Air Temp</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 text-[10px] uppercase">Risk Category</span>
                    <p
                      className={`font-bold text-sm mt-0.5 ${
                        result.risk_level === 'CRITICAL'
                          ? 'text-red-400'
                          : result.risk_level === 'ELEVATED'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {result.risk_level}
                    </p>
                    <span className="text-[10px] text-slate-400">Industrial Severity</span>
                  </div>
                </div>
              </div>

              {/* 5 Fault Probabilities */}
              <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
                  <span>AI4I Failure Mode Probabilities</span>
                  <span className="text-xs font-mono text-slate-400">5 Validated Classifiers</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {Object.values(result.fault_probabilities).map(fault => (
                    <div
                      key={fault.fault_code}
                      className={`p-3 rounded-lg border text-center ${
                        fault.detected
                          ? 'bg-red-950/40 border-red-800 text-red-200'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold block">{fault.fault_code}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{fault.fault_name}</span>
                      <span className="font-mono text-base font-bold mt-1 block">
                        {(fault.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Contributions Waterfall / Importance */}
              <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Feature Explainability & Impact Attribution
                </h3>
                <div className="space-y-2.5">
                  {result.feature_contributions.map(feat => (
                    <div key={feat.feature_name} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{feat.display_name}</span>
                        <span className="text-slate-400">
                          {feat.value} {feat.unit} ({feat.importance_pct}% global importance)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            feat.contribution === 'risk_increasing'
                              ? 'bg-red-500'
                              : feat.contribution === 'protective'
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, feat.importance_pct * 3))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 italic">{feat.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technician Checklist */}
              {result.checklist && result.checklist.length > 0 && (
                <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#23C8BB]" />
                    Recommended Technician Inspection Checklist
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {result.checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-[#23C8BB] font-mono font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleCreateTicket}
                  disabled={ticketCreated || isTicketLoading}
                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" />
                  <span>
                    {ticketCreated
                      ? 'Work Order Logged ✓'
                      : isTicketLoading
                      ? 'Saving...'
                      : 'Create Maintenance Ticket'}
                  </span>
                </button>

                <button
                  onClick={handleOpenSimulator}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center space-x-1.5"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Open in What-If Simulator</span>
                </button>

                <button
                  onClick={handleOpenDigitalTwin}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center space-x-1.5"
                >
                  <Box className="w-4 h-4" />
                  <span>View in 2D Digital Twin</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-[#111C30] border border-slate-800 text-center flex flex-col items-center justify-center min-h-[420px]">
              <Sparkles className="w-12 h-12 text-[#23C8BB]/40 mb-3" />
              <h3 className="text-base font-medium text-slate-200">Awaiting Telemetry Input</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Configure the sensor readings on the left and click &quot;Execute ML Inference&quot; or select one of the
                industrial presets above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
