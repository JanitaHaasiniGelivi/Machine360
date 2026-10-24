import React, { useState } from 'react';
import { api } from '@/services/api';
import { BatchPredictionResponse } from '@/types';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  RefreshCw,
  FileCheck,
  Table,
} from 'lucide-react';

export const BatchAnalysisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<BatchPredictionResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop a valid CSV document.');
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.predictBatch(file);
      setBatchData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Batch prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]\n' +
      'M,298.1,308.6,1551,42.8,0\n' +
      'L,298.2,308.7,1408,46.3,3\n' +
      'L,298.4,308.2,1430,68.5,215\n' +
      'H,298.6,308.6,1250,75.2,180\n' +
      'M,298.8,308.9,1500,40.0,15\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ai4i2020_batch_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportResults = () => {
    if (!batchData || !batchData.rows) return;

    const headers =
      'Row,Type,Air Temp [K],Process Temp [K],Speed [rpm],Torque [Nm],Tool Wear [min],Prediction,Probability,Risk,Predicted Faults\n';
    const rows = batchData.rows
      .map(
        r =>
          `${r.row_index},${r.quality_type},${r.air_temperature_k},${r.process_temperature_k},${r.rotational_speed_rpm},${r.torque_nm},${r.tool_wear_min},${r.prediction ? 1 : 0},${r.probability},${r.risk_level},"${r.predicted_faults.join(';')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `machinemind_batch_results_${Date.now()}.csv`);
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
            <FileSpreadsheet className="w-7 h-7 text-[#23C8BB]" />
            CSV Telemetry Batch Inference
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Process high-volume machine sensor logs, audit historical runs, and export classified risk scores.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#23C8BB]" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="p-8 rounded-xl bg-[#111C30] border-2 border-dashed border-slate-700 hover:border-[#23C8BB] transition-colors text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
      >
        <UploadCloud className="w-12 h-12 text-[#23C8BB]" />
        <div>
          <h3 className="text-base font-semibold text-white">Drag & Drop Sensor CSV or Browse File</h3>
          <p className="text-xs text-slate-400 mt-1">
            Requires AI4I sensor columns: Type, Air Temp, Process Temp, Speed, Torque, Tool wear.
          </p>
        </div>

        <label className="px-4 py-2 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all">
          Browse File
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        </label>

        {file && (
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mt-2 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800">
            <FileCheck className="w-4 h-4" />
            <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {file && (
        <div className="flex justify-center">
          <button
            onClick={handleUploadSubmit}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/20 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
            <span>{loading ? 'Processing Batch Inference...' : 'Execute Batch Analysis'}</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Results Section */}
      {batchData && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Total Observations</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {batchData.total_processed.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Predicted Failures</span>
              <p className="text-2xl font-bold font-mono text-red-400 mt-1">
                {batchData.total_failures.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Failure Rate</span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {batchData.failure_rate_pct.toFixed(2)}%
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Fault Distribution</span>
              <div className="text-xs font-mono text-slate-300 mt-1 flex flex-wrap gap-2">
                {Object.entries(batchData.fault_breakdown).map(([k, v]) => (
                  <span key={k}>
                    {k}: <strong className="text-white">{String(v)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-5 rounded-xl bg-[#111C30] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Batch Telemetry Rows & Inferred Risks</h3>
              <button
                onClick={handleExportResults}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-[#23C8BB] border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Air [K]</th>
                    <th className="pb-2">Proc [K]</th>
                    <th className="pb-2">Speed [rpm]</th>
                    <th className="pb-2">Torque [Nm]</th>
                    <th className="pb-2">Wear [m]</th>
                    <th className="pb-2">Probability</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Fault Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {batchData.rows.slice(0, 100).map(row => (
                    <tr key={row.row_index} className="hover:bg-slate-800/30">
                      <td className="py-2 text-slate-500">{row.row_index}</td>
                      <td className="py-2 text-slate-300 font-bold">{row.quality_type}</td>
                      <td className="py-2 text-slate-300">{row.air_temperature_k.toFixed(1)}</td>
                      <td className="py-2 text-slate-300">{row.process_temperature_k.toFixed(1)}</td>
                      <td className="py-2 text-slate-300">{row.rotational_speed_rpm}</td>
                      <td className="py-2 text-slate-300">{row.torque_nm.toFixed(1)}</td>
                      <td className="py-2 text-slate-300">{row.tool_wear_min}</td>
                      <td className="py-2 font-bold text-white">{(row.probability * 100).toFixed(1)}%</td>
                      <td className="py-2">
                        {row.prediction ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold">
                            FAIL
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-amber-400 font-semibold">
                        {row.predicted_faults.length > 0 ? row.predicted_faults.join(', ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {batchData.rows.length > 100 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                Showing first 100 observations of {batchData.rows.length}. Export CSV to view full dataset.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
