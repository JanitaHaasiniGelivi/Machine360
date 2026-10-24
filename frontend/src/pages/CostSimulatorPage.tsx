import React, { useState } from 'react';
import { api } from '@/services/api';
import { CostSimulateRequest, CostSimulateResponse } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import {
  DollarSign,
  Calculator,
  TrendingDown,
  PieChart as PieIcon,
  CheckCircle2,
  Download,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const CostSimulatorPage: React.FC = () => {
  const [formData, setFormData] = useState<CostSimulateRequest>({
    name: 'Precision Milling Line 1',
    inspection_cost: 250,
    repair_cost: 1200,
    spare_part_cost: 850,
    labor_cost: 500,
    downtime_hours: 8,
    downtime_cost_per_hour: 1500,
  });

  const [result, setResult] = useState<CostSimulateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.simulateCost(formData);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation on mount
  React.useEffect(() => {
    api.simulateCost(formData).then(res => setResult(res)).catch(() => {});
  }, []);

  const chartData = result
    ? [
        {
          name: 'Preventive Intervention',
          Direct_Maintenance: formData.inspection_cost + formData.labor_cost + formData.spare_part_cost,
          Downtime_Cost: result.cost_breakdown.planned_downtime_cost,
          Total: result.preventive_total_cost,
        },
        {
          name: 'Catastrophic Reactive Failure',
          Direct_Maintenance:
            formData.inspection_cost +
            result.cost_breakdown.emergency_repair_cost +
            result.cost_breakdown.emergency_parts_cost +
            result.cost_breakdown.emergency_labor_cost,
          Downtime_Cost: result.cost_breakdown.unplanned_downtime_cost,
          Total: result.reactive_total_cost,
        },
      ]
    : [];

  const handleExportSummary = () => {
    if (!result) return;
    const content =
      `# MachineMind 360 Maintenance Cost Simulation Report\n\n` +
      `Scenario: ${result.scenario_name}\n` +
      `Preventive Maintenance Total Cost: ${formatCurrency(result.preventive_total_cost)}\n` +
      `Catastrophic Reactive Failure Cost: ${formatCurrency(result.reactive_total_cost)}\n` +
      `Net Factory Financial Savings: ${formatCurrency(result.net_savings)}\n` +
      `Estimated Preventive Return on Investment (ROI): ${result.roi_percent}%\n\n` +
      `## Cost Breakdown\n` +
      `- Planned Downtime Cost: ${formatCurrency(result.cost_breakdown.planned_downtime_cost)}\n` +
      `- Emergency Repair Surcharge: ${formatCurrency(result.cost_breakdown.emergency_repair_cost)}\n` +
      `- Unplanned Production Downtime Loss: ${formatCurrency(result.cost_breakdown.unplanned_downtime_cost)}\n\n` +
      `## Formulas Applied\n${result.formula_summary}\n`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cost_simulation_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-[#23C8BB]" />
            Maintenance Economic & Cost Impact Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quantify financial ROI comparing planned predictive intervention versus catastrophic production outages.
          </p>
        </div>

        {result && (
          <button
            onClick={handleExportSummary}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-[#23C8BB]" />
            <span>Export Financial Report</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cost Variables Form */}
        <div className="lg:col-span-5 bg-[#111C30] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#23C8BB]" />
            Plant Economic Assumptions
          </h2>

          <form onSubmit={handleSimulate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Scenario Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Inspection Cost ($)</label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={formData.inspection_cost}
                  onChange={e => setFormData({ ...formData, inspection_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Base Repair Cost ($)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={formData.repair_cost}
                  onChange={e => setFormData({ ...formData, repair_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Spare Part Cost ($)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={formData.spare_part_cost}
                  onChange={e => setFormData({ ...formData, spare_part_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Standard Labor ($)</label>
                <input
                  type="number"
                  min={0}
                  step={25}
                  value={formData.labor_cost}
                  onChange={e => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Downtime Duration [hours]</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  step={0.5}
                  value={formData.downtime_hours}
                  onChange={e => setFormData({ ...formData, downtime_hours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Downtime Cost / Hour ($)</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={formData.downtime_cost_per_hour}
                  onChange={e =>
                    setFormData({ ...formData, downtime_cost_per_hour: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold text-xs tracking-wider uppercase shadow-md transition-all mt-2"
            >
              {loading ? 'Calculating...' : 'Recalculate Financial Model'}
            </button>
          </form>

          {/* Transparent formula notice */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Transparent Cost Formulas:</span>
            <p>• Planned downtime assumed at 20% of unplanned shutdown duration.</p>
            <p>• Emergency reactive repair incurs 1.75x surcharge + 2x overtime labor.</p>
          </div>
        </div>

        {/* Financial Results & ROI */}
        <div className="lg:col-span-7 space-y-5">
          {result && (
            <>
              {/* ROI Callout Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Preventive Cost</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {formatCurrency(result.preventive_total_cost)}
                  </p>
                  <span className="text-[10px] text-slate-500">Scheduled maintenance</span>
                </div>

                <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Reactive Outage Cost</span>
                  <p className="text-xl font-bold font-mono text-red-400 mt-1">
                    {formatCurrency(result.reactive_total_cost)}
                  </p>
                  <span className="text-[10px] text-slate-500">Unplanned shutdown</span>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-[#111C30] to-[#19263B] border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Net Financial Savings</span>
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    {formatCurrency(result.net_savings)}
                  </p>
                  <span className="text-[10px] font-mono text-[#23C8BB] font-semibold">
                    +{result.roi_percent}% ROI
                  </span>
                </div>
              </div>

              {/* Cost Comparison Bar Chart */}
              <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
                  <span>Preventive vs Reactive Cost Comparison</span>
                  <span className="text-xs font-mono text-slate-400">USD Breakdown</span>
                </h3>

                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val), 'Cost']}
                        contentStyle={{
                          backgroundColor: '#19263B',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Direct_Maintenance" fill="#23C8BB" stackId="a" />
                      <Bar dataKey="Downtime_Cost" fill="#EF4444" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
