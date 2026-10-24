import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { MaintenanceTicket, FactoryAsset, TicketStatus, TicketPriority } from '@/types';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileText,
  UserCheck,
  Calendar,
  Layers,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [machines, setMachines] = useState<FactoryAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    asset_id: 1,
    issue_summary: '',
    priority: 'medium' as TicketPriority,
    assigned_technician: 'Lead CNC Technician',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  });

  // Action log form
  const [actionDesc, setActionDesc] = useState<string>('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.listTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    api.listMachines().then(res => setMachines(res)).catch(() => {});
  }, [statusFilter, priorityFilter]);

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      await api.updateTicket(ticketId, { status: newStatus });
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket status.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTicket(newTicket);
      setIsCreateOpen(false);
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create work order.');
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !actionDesc.trim()) return;

    try {
      await api.addTicketAction(selectedTicket.id, actionDesc, 'Lead CNC Technician');
      setActionDesc('');
      alert('Action logged successfully!');
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record action.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-7 h-7 text-[#23C8BB]" />
            Maintenance Work Orders & Workflows
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Database-backed ticket lifecycle management, status workflows, and technician logs.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-[#23C8BB]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#111C30] border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, summary, technician..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchTickets()}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#23C8BB]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#23C8BB]"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#23C8BB]"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-[#111C30] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Machinery Asset</th>
                <th className="py-3 px-4 font-sans">Issue Summary</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 font-sans">Assigned Technician</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#23C8BB]">{t.ticket_number}</td>
                  <td className="py-3 px-4 text-slate-200 font-sans">{t.asset_name || `Asset #${t.asset_id}`}</td>
                  <td className="py-3 px-4 text-white font-sans max-w-xs truncate">{t.issue_summary}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        t.priority === 'critical'
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : t.priority === 'high'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={t.status}
                      onChange={e => handleStatusChange(t.id, e.target.value as TicketStatus)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border focus:outline-none cursor-pointer ${
                        t.status === 'Completed' || t.status === 'Closed'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : t.status === 'In Progress'
                          ? 'bg-blue-950 text-blue-400 border-blue-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{t.assigned_technician || 'Unassigned'}</td>
                  <td className="py-3 px-4 text-slate-400">{t.due_date || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedTicket(t);
                        setIsDetailOpen(true);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tickets.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 font-sans text-xs">
            No maintenance work orders match the current filter criteria.
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create Maintenance Work Order</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Machine Asset</label>
                <select
                  value={newTicket.asset_id}
                  onChange={e => setNewTicket({ ...newTicket, asset_id: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.asset_id} — {m.name} ({m.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Summary / Anomaly Notice</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excessive Spindle Torque & Thermal Rise"
                  value={newTicket.issue_summary}
                  onChange={e => setNewTicket({ ...newTicket, issue_summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={newTicket.assigned_technician}
                    onChange={e => setNewTicket({ ...newTicket, assigned_technician: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTicket.due_date}
                  onChange={e => setNewTicket({ ...newTicket, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail & Action Log Modal */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-[#23C8BB]">{selectedTicket.ticket_number}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedTicket.issue_summary}</h3>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Machine Asset:</span>
                <span className="font-semibold text-white">{selectedTicket.asset_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="font-mono font-bold text-[#23C8BB]">{selectedTicket.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Priority:</span>
                <span className="font-bold text-amber-400 uppercase">{selectedTicket.priority}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Technician:</span>
                <span>{selectedTicket.assigned_technician}</span>
              </div>
            </div>

            {/* Action Log Form */}
            <form onSubmit={handleAddAction} className="pt-2 space-y-2">
              <label className="block text-xs font-medium text-slate-300">Log Technician Action</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Inspected cooling manifold; replaced worn carbide inserts; tested spindle runout at 1500 RPM."
                value={actionDesc}
                onChange={e => setActionDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-[#23C8BB] border border-slate-700"
              >
                Record Action
              </button>
            </form>

            <button
              onClick={() => setIsDetailOpen(false)}
              className="w-full py-2 rounded-lg bg-slate-900 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
