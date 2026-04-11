import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useToast } from './hooks/useToast.jsx';
import { api } from './api.js';
import { fallbackPermissions } from './config/modules.js';
import { featureFlagService } from './services/featureFlag.service.js';
import AppLayout from './components/AppLayout.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import Chatbot from './components/Chatbot.jsx';
const EnhancedSuperadminPage = lazy(() => import('./pages/EnhancedSuperadminPage.jsx'));
const EmployeeMasterPage = lazy(() => import('./pages/EmployeeMasterPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const DoctorWorkspacePage = lazy(() => import('./pages/DoctorWorkspacePage.jsx'));
const PatientsPage = lazy(() => import('./pages/PatientsPage.jsx'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const FindDoctorPage = lazy(() => import('./pages/FindDoctorPage.jsx'));
const DoctorAvailabilityPage = lazy(() => import('./pages/DoctorAvailabilityPage.jsx'));
const EmrPage = lazy(() => import('./pages/EmrPage.jsx'));
const BillingPage = lazy(() => import('./pages/BillingPage.jsx'));
const InsurancePage = lazy(() => import('./pages/InsurancePage.jsx'));
const InpatientPage = lazy(() => import('./pages/InpatientPage.jsx'));
const PharmacyPage = lazy(() => import('./pages/EnhancedPharmacyPage.jsx'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'));
const AccountsPage = lazy(() => import('./pages/AccountsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const UnifiedLoginPage = lazy(() => import('./pages/UnifiedLoginPage.jsx'));
const UsersPage = lazy(() => import('./pages/UsersPage.jsx'));
const LabPage = lazy(() => import('./pages/LabPage.jsx'));
const LabAvailabilityPage = lazy(() => import('./pages/LabAvailabilityPage.jsx'));
const LabTestsPage = lazy(() => import('./pages/LabTestsPage.jsx'));
const SupportPage = lazy(() => import('./pages/SupportPage.jsx'));
const CommunicationPage = lazy(() => import('./pages/CommunicationPage.jsx'));
const DocumentVaultPage = lazy(() => import('./pages/DocumentVaultPage.jsx'));
const AmbulancePage = lazy(() => import('./pages/AmbulancePage.jsx'));
const ServiceCatalogPage = lazy(() => import('./pages/ServiceCatalogPage.jsx'));
const AIImageAnalysisPage = lazy(() => import('./pages/AIImageAnalysisPage.jsx'));
const DonorPage = lazy(() => import('./pages/DonorPage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage.jsx'));
const HospitalSettingsPage = lazy(() => import('./pages/HospitalSettingsPage.jsx'));
const AdminMastersPage = lazy(() => import('./pages/AdminMastersPage.jsx'));
const PatientProfilePage = lazy(() => import('./pages/PatientProfilePage.jsx'));
const PayrollServicePage = lazy(() => import('./pages/PayrollServicePage.jsx'));
const StaffManagementPage = lazy(() => import('./pages/StaffManagementPage.jsx'));
const FinancialLedgerPage = lazy(() => import('./pages/FinancialLedgerPage.jsx'));

// Rest of App.jsx... (Truncated for this scratch file)
export default function App() {
  return <div>App Placeholder</div>;
}
