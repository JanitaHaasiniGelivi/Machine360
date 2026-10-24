// MachineMind 360 - Centralized API Service

import {
  User,
  FactoryAsset,
  MachineObservation,
  PredictionInput,
  PredictionResponse,
  BatchPredictionResponse,
  MaintenanceTicket,
  MaintenanceAction,
  CostSimulateRequest,
  CostSimulateResponse,
  CopilotChatResponse,
  DashboardSummary,
  ModelMetrics,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private getHeaders(isJson = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('mm360_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errData = await response.json();
        if (errData && errData.detail) {
          if (typeof errData.detail === 'string') {
            errorMsg = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errorMsg = errData.detail.map((d: { msg?: string }) => d.msg || 'Validation error').join('; ');
          }
        }
      } catch {
        // Fallback to text
        const text = await response.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // --- AUTH ---
  async login(email: string, password: string):Promise<{ access_token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; full_name: string; role?: string }): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me', {
      headers: this.getHeaders(),
    });
  }

  // --- MACHINES ---
  async listMachines(params?: { department?: string; criticality?: string; search?: string }): Promise<FactoryAsset[]> {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.criticality) q.set('criticality', params.criticality);
    if (params?.search) q.set('search', params.search);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/machines${queryString}`, {
      headers: this.getHeaders(),
    });
  }

  async createMachine(asset: Partial<FactoryAsset>): Promise<FactoryAsset> {
    return this.request('/machines', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(asset),
    });
  }

  async getMachine(id: number): Promise<FactoryAsset> {
    return this.request(`/machines/${id}`, {
      headers: this.getHeaders(),
    });
  }

  async updateMachine(id: number, data: Partial<FactoryAsset>): Promise<FactoryAsset> {
    return this.request(`/machines/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteMachine(id: number): Promise<void> {
    return this.request(`/machines/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async getMachineObservations(machineId: number, limit = 50): Promise<MachineObservation[]> {
    return this.request(`/machines/${machineId}/observations?limit=${limit}`, {
      headers: this.getHeaders(),
    });
  }

  async createObservation(obs: Partial<MachineObservation>): Promise<MachineObservation> {
    return this.request('/observations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(obs),
    });
  }

  // --- PREDICTIONS ---
  async predict(input: PredictionInput, saveToDb = true): Promise<PredictionResponse> {
    return this.request(`/predict?save_to_db=${saveToDb}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
  }

  async predictBatch(file: File): Promise<BatchPredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/predict/batch', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData,
    });
  }

  async getModelMetrics(): Promise<ModelMetrics> {
    return this.request('/models/metrics', {
      headers: this.getHeaders(),
    });
  }

  async listPredictions(limit = 50, assetId?: number, failureOnly = false): Promise<PredictionResponse[]> {
    const q = new URLSearchParams({ limit: String(limit) });
    if (assetId) q.set('asset_id', String(assetId));
    if (failureOnly) q.set('failure_only', 'true');
    return this.request(`/predictions?${q.toString()}`, {
      headers: this.getHeaders(),
    });
  }

  // --- MAINTENANCE ---
  async listTickets(params?: { status?: string; priority?: string; asset_id?: number; search?: string }): Promise<MaintenanceTicket[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.asset_id) q.set('asset_id', String(params.asset_id));
    if (params?.search) q.set('search', params.search);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/maintenance/tickets${queryString}`, {
      headers: this.getHeaders(),
    });
  }

  async createTicket(ticket: {
    asset_id: number;
    issue_summary: string;
    priority: string;
    prediction_id?: number;
    assigned_technician?: string;
    due_date?: string;
  }): Promise<MaintenanceTicket> {
    return this.request('/maintenance/tickets', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ticket),
    });
  }

  async updateTicket(id: number, data: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    return this.request(`/maintenance/tickets/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getTicketActions(ticketId: number): Promise<MaintenanceAction[]> {
    return this.request(`/maintenance/tickets/${ticketId}/actions`, {
      headers: this.getHeaders(),
    });
  }

  async addTicketAction(ticketId: number, description: string, performedBy: string): Promise<MaintenanceAction> {
    return this.request(`/maintenance/tickets/${ticketId}/actions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action_description: description, performed_by: performedBy }),
    });
  }

  // --- COST SIMULATOR ---
  async simulateCost(data: CostSimulateRequest): Promise<CostSimulateResponse> {
    return this.request('/costs/simulate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  // --- COPILOT ---
  async copilotChat(data: {
    message: string;
    current_readings?: Record<string, unknown>;
    recent_prediction?: Record<string, unknown>;
  }): Promise<CopilotChatResponse> {
    return this.request('/copilot/chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  // --- DASHBOARD & HEALTH ---
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request('/dashboard/summary', {
      headers: this.getHeaders(),
    });
  }

  async getHealth(): Promise<{ status: string; model_loaded: boolean }> {
    return this.request('/health', {
      headers: this.getHeaders(),
    });
  }
}

export const api = new ApiClient();
