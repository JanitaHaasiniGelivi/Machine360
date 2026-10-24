import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { DashboardSummary } from '@/types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Wrench,
  ArrowRight,
  Zap,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const faultChartData = data?.fault_distribution
    ? Object.entries(data.fault_distribution).map(([key, val]) => ({
        name: key,
        count: val,
      }))
    : [];

  const FAULT_COLORS: Record<string, string> = {
    TWF: '#F59E0B',
    HDF: '#EF4444',
    PWF: '#60A5FA',
    OSF: '#EC4899',
    RNF: '#8B5CF6',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Factory Health & Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time operating telemetry, explainable machine failure risk, and maintenance workflows.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSummary}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/predict"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-[#23C8BB]/20 transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>New AI Prediction</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSummary} className="underline text-xs">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Total Machinery</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-[#60A5FA]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">{data?.total_assets ?? '—'}</span>
            <span className="text-xs text-slate-400">assets online</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">{data?.critical_assets_count ?? 0}</span> classified as critical
          </div>
        </div>

        {/* Active Failure Risk Alerts */}
        <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Active Risk Alerts</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-[#EF4444]">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-red-400 font-mono">{data?.active_alerts ?? '—'}</span>
            <span className="text-xs text-slate-400">critical notices</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Model threshold trigger (prob &gt; 51.4%)
          </div>
        </div>

        {/* Open Work Orders */}
        <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Maintenance Tickets</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-[#F59E0B]">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-400 font-mono">{data?.open_tickets ?? '—'}</span>
            <span className="text-xs text-slate-400">open tickets</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{data?.in_progress_tickets ?? 0}</span> currently in progress
          </div>
        </div>

        {/* Model Accuracy & ROC-AUC */}
        <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">AI Diagnostic Engine</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">
              {data ? `${(data.model_roc_auc * 100).toFixed(1)}%` : '—'}
            </span>
            <span className="text-xs text-slate-400">ROC-AUC score</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Verified on 2,000 held-out samples (F1: {data?.model_f1.toFixed(3) ?? '—'})
          </div>
        </div>
      </div>

      {/* Charts & Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fault Distribution */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-[#111C30] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">Detected Fault Modes</h2>
              <p className="text-xs text-slate-400">AI4I fault taxonomy breakdown</p>
            </div>
            <Link to="/diagnosis" className="text-xs text-[#23C8BB] hover:underline flex items-center">
              <span>Taxonomy</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faultChartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#19263B',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {faultChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FAULT_COLORS[entry.name] || '#23C8BB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>TWF: Tool Wear</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>HDF: Heat Dissipation</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>PWF: Power Anomaly</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
              <span>OSF: Overstrain</span>
            </div>
          </div>
        </div>

        {/* Recent Machine Telemetry & Predictions */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111C30] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white">Recent Machine Observations & Risk Outcomes</h2>
                <p className="text-xs text-slate-400">Model inference outputs on operational telemetry</p>
              </div>
              <Link to="/predict" className="text-xs text-[#23C8BB] hover:underline flex items-center">
                <span>Predictor</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-mono border-b border-slate-800 uppercase tracking-wider">
                    <th className="pb-2">Sample ID</th>
                    <th className="pb-2">Quality</th>
                    <th className="pb-2">Spindle Power</th>
                    <th className="pb-2">Temp Diff (ΔT)</th>
                    <th className="pb-2">Failure Prob</th>
                    <th className="pb-2">Risk Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data?.recent_predictions && data.recent_predictions.length > 0 ? (
                    data.recent_predictions.map(pred => (
                      <tr key={pred.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 text-slate-300">#PRED-{pred.id}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            Type {pred.quality_type}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-200">{pred.power_watts.toLocaleString()} W</td>
                        <td className="py-2.5 text-slate-200">{pred.temp_diff_k} K</td>
                        <td className="py-2.5 font-bold text-slate-100">
                          {(pred.probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5">
                          {pred.risk_level === 'CRITICAL' ? (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-semibold text-[10px]">
                              CRITICAL
                            </span>
                          ) : pred.risk_level === 'ELEVATED' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-semibold text-[10px]">
                              ELEVATED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold text-[10px]">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                        No prediction observations recorded yet. Run a prediction to see live analytics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pipeline: Random Forest (Decision Threshold 0.5139)</span>
            </span>
            <Link to="/digital-twin" className="text-[#60A5FA] hover:underline flex items-center">
              <span>View 2D Digital Twin</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/simulator"
          className="p-4 rounded-xl bg-gradient-to-br from-[#111C30] to-[#19263B] border border-slate-800 hover:border-[#23C8BB]/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white group-hover:text-[#23C8BB] transition-colors">
              What-If Simulator
            </span>
            <Zap className="w-4 h-4 text-[#23C8BB]" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Simulate parameter modifications on RPM, torque, and temperatures to evaluate model response.
          </p>
        </Link>

        <Link
          to="/cost-simulator"
          className="p-4 rounded-xl bg-gradient-to-br from-[#111C30] to-[#19263B] border border-slate-800 hover:border-[#60A5FA]/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white group-hover:text-[#60A5FA] transition-colors">
              Cost & Downtime Impact
            </span>
            <TrendingDown className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Compute financial ROI of planned preventive maintenance vs catastrophic unplanned machine outage.
          </p>
        </Link>

        <Link
          to="/copilot"
          className="p-4 rounded-xl bg-gradient-to-br from-[#111C30] to-[#19263B] border border-slate-800 hover:border-emerald-400/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              AI Maintenance Copilot
            </span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Consult the industrial assistant for machine troubleshooting, checklist generation, and fault root-causes.
          </p>
        </Link>
      </div>
    </div>
  );
};
