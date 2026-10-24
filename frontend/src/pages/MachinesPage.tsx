import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { FactoryAsset } from '@/types';
import QRCode from 'qrcode';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  QrCode,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MachinesPage: React.FC = () => {
  const [machines, setMachines] = useState<FactoryAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [critFilter, setCritFilter] = useState<string>('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [selectedMachine, setSelectedMachine] = useState<FactoryAsset | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    asset_id: '',
    name: '',
    description: '',
    manufacturer: 'Industrial Heavy Machining Inc.',
    model: 'VMC-5000X',
    department: 'CNC Milling & Fabrication',
    installation_date: '2023-01-15',
    criticality: 'medium',
    assigned_technician: 'Lead CNC Technician',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const data = await api.listMachines({
        search: search || undefined,
        department: deptFilter || undefined,
        criticality: critFilter || undefined,
      });
      setMachines(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [deptFilter, critFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMachines();
  };

  const handleOpenRegister = () => {
    setFormData({
      asset_id: `MAC-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      description: '',
      manufacturer: 'DMG MORI',
      model: 'DMU 50',
      department: 'CNC Milling & Fabrication',
      installation_date: new Date().toISOString().split('T')[0],
      criticality: 'medium',
      assigned_technician: 'Lead CNC Technician',
      notes: '',
    });
    setFormError(null);
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createMachine(formData as any);
      setIsRegisterOpen(false);
      fetchMachines();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to register machine.');
    }
  };

  const handleOpenEdit = (machine: FactoryAsset) => {
    setSelectedMachine(machine);
    setFormData({
      asset_id: machine.asset_id,
      name: machine.name,
      description: machine.description || '',
      manufacturer: machine.manufacturer,
      model: machine.model,
      department: machine.department,
      installation_date: machine.installation_date,
      criticality: machine.criticality,
      assigned_technician: machine.assigned_technician || '',
      notes: machine.notes || '',
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    setFormError(null);
    try {
      await api.updateMachine(selectedMachine.id, formData as any);
      setIsEditOpen(false);
      fetchMachines();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update machine.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to decommission and remove this factory asset from registry?')) {
      try {
        await api.deleteMachine(id);
        fetchMachines();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete asset.');
      }
    }
  };

  const handleShowQr = async (machine: FactoryAsset) => {
    setSelectedMachine(machine);
    try {
      const qrUrl = await QRCode.toDataURL(machine.qr_code_data || `ASSET:${machine.asset_id}`, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0B1220',
          light: '#F8FAFC',
        },
      });
      setQrDataUrl(qrUrl);
      setIsQrOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-7 h-7 text-[#23C8BB]" />
            Machine Asset Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered industrial equipment, operational departments, and hardware specifications.
          </p>
        </div>
        <button
          onClick={handleOpenRegister}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-[#23C8BB]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Register Asset</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Asset ID, Name, Model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#23C8BB]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#23C8BB]"
          >
            <option value="">All Departments</option>
            <option value="CNC Milling & Fabrication">CNC Milling & Fabrication</option>
            <option value="Shaft & Turning Bay">Shaft & Turning Bay</option>
            <option value="Toolroom & Prototyping">Toolroom & Prototyping</option>
            <option value="Automated Engine Cell">Automated Engine Cell</option>
          </select>

          <select
            value={critFilter}
            onChange={e => setCritFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#23C8BB]"
          >
            <option value="">All Criticalities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {machines.map(m => (
          <div
            key={m.id}
            className="p-5 rounded-xl bg-[#111C30] border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-[#23C8BB] border border-slate-700">
                    {m.asset_id}
                  </span>
                  <h2 className="text-base font-semibold text-white mt-2 group-hover:text-[#23C8BB] transition-colors">
                    {m.name}
                  </h2>
                </div>
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                    m.criticality === 'critical'
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : m.criticality === 'high'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}
                >
                  {m.criticality}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {m.description || 'Industrial production manufacturing equipment.'}
              </p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="flex items-center text-slate-400">
                  <Building2 className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                  <span className="truncate">{m.department}</span>
                </div>
                <div className="flex items-center text-slate-400">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                  <span>Installed: {m.installation_date}</span>
                </div>
                <div className="flex items-center text-slate-400">
                  <UserCheck className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                  <span>Tech: {m.assigned_technician || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleShowQr(m)}
                  title="View Inspection QR Code"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(m)}
                  title="Edit Asset Details"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  title="Decommission Asset"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Link
                to={`/predict?asset_id=${m.id}`}
                className="text-xs text-[#23C8BB] hover:underline font-semibold flex items-center"
              >
                <span>Run Telemetry</span>
                <span className="ml-1">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {machines.length === 0 && !loading && (
        <div className="p-12 text-center rounded-xl bg-[#111C30] border border-slate-800">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-200">No factory assets found</h3>
          <p className="text-xs text-slate-400 mt-1">Adjust search filters or register a new piece of equipment.</p>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Register Industrial Machine</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Asset ID (Tag)</label>
                  <input
                    type="text"
                    required
                    value={formData.asset_id}
                    onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Criticality</label>
                  <select
                    value={formData.criticality}
                    onChange={e => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Machine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Axis CNC Milling Center #1"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Model Spec</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Operating Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Equipment Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Edit Machine Asset</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Machine Name</label>
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
                  <label className="block text-slate-300 font-medium mb-1">Criticality</label>
                  <select
                    value={formData.criticality}
                    onChange={e => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={formData.assigned_technician}
                    onChange={e => setFormData({ ...formData, assigned_technician: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Maintenance Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold"
                >
                  Update Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-mono text-xs font-bold text-[#23C8BB]">{selectedMachine.asset_id}</span>
              <button onClick={() => setIsQrOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{selectedMachine.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Industrial Equipment Inspection Tag</p>
            </div>

            {qrDataUrl && (
              <div className="bg-white p-3 rounded-lg inline-block shadow-inner mx-auto">
                <img src={qrDataUrl} alt="Asset QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 break-all">
              {selectedMachine.qr_code_data}
            </div>

            <button
              onClick={() => setIsQrOpen(false)}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
