import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { DashboardSummary, FactoryAsset, MaintenanceTicket, PredictionResponse } from '@/types';
import {
  FileText,
  Printer,
  Download,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [machines, setMachines] = useState<FactoryAsset[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [predictions, setPredictions] = useState<PredictionResponse[]>([]);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.listMachines(),
      api.listTickets(),
      api.listPredictions(10),
    ])
      .then(([sum, macs, tcks, preds]) => {
        setSummary(sum);
        setMachines(macs);
        setTickets(tcks);
        setPredictions(preds);
      })
      .catch((err: unknown) => console.error(err));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (predictions.length === 0) return;
    const headers = 'ID,Quality,Power [W],Temp Diff [K],Failure Prob,Risk Level,Created At\n';
    const rows = predictions
      .map(
        p =>
          `${p.id},${p.input_readings.quality_type},${p.derived_power_watts},${p.derived_temp_diff_k},${p.failure_probability},${p.risk_level},${p.created_at || ''}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `factory_telemetry_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Header - Hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#23C8BB]" />
            Factory Intelligence & Audit Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate printable operational audits, technical diagnostics, and work order compliance summaries.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
          >
            <Download className="w-4 h-4 text-[#23C8BB]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold text-xs shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-[#111C30] print:bg-white print:text-black border border-slate-800 print:border-none rounded-xl p-8 space-y-6 max-w-4xl mx-auto shadow-2xl">
        {/* Document Header */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-800 print:border-slate-300">
          <div>
            <span className="font-bold text-2xl tracking-tight text-white print:text-slate-950">
              MachineMind <span className="text-[#23C8BB] print:text-teal-600">360</span>
            </span>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Factory Health & Maintenance Intelligence System
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Ref: MM360-AUDIT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-400 print:text-slate-600 space-y-0.5">
            <div>Audit Date: {new Date().toLocaleDateString()}</div>
            <div>Model: Random Forest v1.0.0</div>
            <div>Status: Operational</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-slate-900 border-l-2 border-[#23C8BB] pl-2">
            1. Executive Telemetry Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase block">Total Machinery</span>
              <span className="text-lg font-bold text-white print:text-slate-950">
                {summary?.total_assets ?? machines.length} Units
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase block">Active Alerts</span>
              <span className="text-lg font-bold text-red-400 print:text-red-600">
                {summary?.active_alerts ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase block">Open Work Orders</span>
              <span className="text-lg font-bold text-amber-400 print:text-amber-600">
                {summary?.open_tickets ?? tickets.length}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase block">Diagnostic AUC</span>
              <span className="text-lg font-bold text-emerald-400 print:text-emerald-700">
                {summary ? `${(summary.model_roc_auc * 100).toFixed(1)}%` : '96.2%'}
              </span>
            </div>
          </div>
        </div>

        {/* Registered Machinery Inventory */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-slate-900 border-l-2 border-[#23C8BB] pl-2">
            2. Factory Assets Audit
          </h2>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600 uppercase text-[10px]">
                <th className="pb-1">Asset Tag</th>
                <th className="pb-1 font-sans">Name & Department</th>
                <th className="pb-1">Criticality</th>
                <th className="pb-1 font-sans">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 print:divide-slate-200">
              {machines.map(m => (
                <tr key={m.id}>
                  <td className="py-2 font-bold text-[#23C8BB] print:text-teal-700">{m.asset_id}</td>
                  <td className="py-2 text-slate-200 print:text-slate-800 font-sans">
                    {m.name} — <span className="text-slate-400 print:text-slate-500">{m.department}</span>
                  </td>
                  <td className="py-2 uppercase font-semibold text-xs">{m.criticality}</td>
                  <td className="py-2 text-slate-300 print:text-slate-700 font-sans">
                    {m.assigned_technician || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Maintenance Work Orders */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-slate-900 border-l-2 border-[#23C8BB] pl-2">
            3. Active Maintenance Tickets
          </h2>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600 uppercase text-[10px]">
                <th className="pb-1">Ticket #</th>
                <th className="pb-1 font-sans">Issue</th>
                <th className="pb-1">Priority</th>
                <th className="pb-1">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 print:divide-slate-200">
              {tickets.map(t => (
                <tr key={t.id}>
                  <td className="py-2 font-bold text-slate-300 print:text-slate-900">{t.ticket_number}</td>
                  <td className="py-2 text-slate-200 print:text-slate-800 font-sans">{t.issue_summary}</td>
                  <td className="py-2 uppercase font-semibold">{t.priority}</td>
                  <td className="py-2 font-bold text-[#23C8BB] print:text-teal-700">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign-off footer */}
        <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-8 text-xs font-mono text-slate-400 print:text-slate-600">
          <div>
            <span>Plant Lead Engineer Signature:</span>
            <div className="mt-6 border-b border-slate-700 print:border-slate-400 w-48"></div>
          </div>
          <div>
            <span>Operations Auditor Verification:</span>
            <div className="mt-6 border-b border-slate-700 print:border-slate-400 w-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
