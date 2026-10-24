// MachineMind 360 - TypeScript Definitions

export type QualityType = 'L' | 'M' | 'H';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Closed';
export type RiskLevel = 'LOW' | 'ELEVATED' | 'CRITICAL' | 'NORMAL';
export type UserRole = 'admin' | 'technician' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface FactoryAsset {
  id: number;
  asset_id: string;
  name: string;
  description?: string;
  manufacturer: string;
  model: string;
  department: string;
  installation_date: string;
  criticality: Criticality;
  assigned_technician?: string;
  notes?: string;
  qr_code_data?: string;
  created_at: string;
  updated_at: string;
}

export interface MachineObservation {
  id: number;
  asset_id: number;
  quality_type: QualityType;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  observed_at: string;
}

export interface FaultProbability {
  fault_code: string;
  fault_name: string;
  probability: number;
  detected: boolean;
  risk_level: RiskLevel;
  description: string;
}

export interface FeatureContribution {
  feature_name: string;
  display_name: string;
  value: number;
  unit: string;
  importance_pct: number;
  contribution: 'risk_increasing' | 'normal' | 'protective';
  explanation: string;
}

export interface PredictionInput {
  asset_id?: number;
  quality_type: QualityType;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  notes?: string;
}

export interface PredictionResponse {
  id?: number;
  machine_failure_prediction: boolean;
  failure_probability: number;
  threshold_used: number;
  risk_level: 'LOW' | 'ELEVATED' | 'CRITICAL';
  model_version: string;
  derived_power_watts: number;
  derived_temp_diff_k: number;
  fault_probabilities: Record<string, FaultProbability>;
  feature_contributions: FeatureContribution[];
  checklist: string[];
  input_readings: {
    quality_type: QualityType;
    air_temperature_k: number;
    process_temperature_k: number;
    rotational_speed_rpm: number;
    torque_nm: number;
    tool_wear_min: number;
  };
  created_at?: string;
}

export interface BatchPredictionRow {
  row_index: number;
  quality_type: string;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  prediction: boolean;
  probability: number;
  risk_level: string;
  predicted_faults: string[];
}

export interface BatchPredictionResponse {
  total_processed: number;
  total_failures: number;
  failure_rate_pct: number;
  fault_breakdown: Record<string, number>;
  rows: BatchPredictionRow[];
}

export interface MaintenanceTicket {
  id: number;
  ticket_number: string;
  asset_id: number;
  asset_name?: string;
  prediction_id?: number;
  issue_summary: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_technician?: string;
  due_date?: string;
  resolution_notes?: string;
  actions_taken?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceAction {
  id: number;
  ticket_id: number;
  action_description: string;
  performed_by: string;
  performed_at: string;
}

export interface CostSimulateRequest {
  name: string;
  inspection_cost: number;
  repair_cost: number;
  spare_part_cost: number;
  labor_cost: number;
  downtime_hours: number;
  downtime_cost_per_hour: number;
}

export interface CostSimulateResponse {
  scenario_name: string;
  preventive_total_cost: number;
  reactive_total_cost: number;
  net_savings: number;
  roi_percent: number;
  cost_breakdown: {
    planned_downtime_hours: number;
    planned_downtime_cost: number;
    emergency_repair_cost: number;
    emergency_parts_cost: number;
    emergency_labor_cost: number;
    unplanned_downtime_cost: number;
  };
  formula_summary: string;
}

export interface CopilotChatResponse {
  reply: string;
  checklist: string[];
  technical_insights: string[];
  recommended_actions: string[];
}

export interface DashboardSummary {
  total_assets: number;
  critical_assets_count: number;
  total_predictions: number;
  recent_failure_rate_pct: number;
  active_alerts: number;
  open_tickets: number;
  in_progress_tickets: number;
  model_version: string;
  model_roc_auc: number;
  model_f1: number;
  recent_predictions: Array<{
    id: number;
    asset_id: number;
    quality_type: string;
    probability: number;
    prediction: boolean;
    risk_level: string;
    power_watts: number;
    temp_diff_k: number;
    created_at?: string;
  }>;
  fault_distribution: Record<string, number>;
  system_health: string;
}

export interface ModelMetrics {
  model_version: string;
  algorithm: string;
  trained_at: string;
  decision_threshold: number;
  input_features: string[];
  transformed_features: string[];
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    pr_auc: number;
    confusion_matrix: {
      true_negative: number;
      false_positive: number;
      false_negative: number;
      true_positive: number;
    };
    positive_class_prevalence: number;
    cv_roc_auc_mean: number;
    cv_roc_auc_std: number;
  };
  feature_importances: Record<string, number>;
  fault_models_metrics: Record<string, { roc_auc: number; f1: number; positive_count_in_test: number }>;
  baseline_comparison: {
    logistic_regression: { roc_auc: number; f1: number };
    random_forest: { roc_auc: number; f1: number };
  };
}
