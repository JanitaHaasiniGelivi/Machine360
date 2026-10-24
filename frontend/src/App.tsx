import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

import { LoginPage } from './pages/LoginPage';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MachinesPage } from './pages/MachinesPage';
import { PredictionPage } from './pages/PredictionPage';
import { FaultDiagnosisPage } from './pages/FaultDiagnosisPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { BatchAnalysisPage } from './pages/BatchAnalysisPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { CostSimulatorPage } from './pages/CostSimulatorPage';
import { CopilotPage } from './pages/CopilotPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="machines" element={<MachinesPage />} />
                <Route path="predict" element={<PredictionPage />} />
                <Route path="diagnosis" element={<FaultDiagnosisPage />} />
                <Route path="digital-twin" element={<DigitalTwinPage />} />
                <Route path="simulator" element={<WhatIfSimulatorPage />} />
                <Route path="batch" element={<BatchAnalysisPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="cost-simulator" element={<CostSimulatorPage />} />
                <Route path="copilot" element={<CopilotPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Fallback to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
