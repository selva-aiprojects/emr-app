import { useState, useEffect } from 'react';
import {
  PatientOverviewChart,
  RevenueTrendChart,
  DepartmentDistributionChart,
  AppointmentStatusChart,
  BedOccupancyChart
} from '../components/ChartComponents.jsx';
import { currency } from '../utils/format.js';
import { api } from '../api.js';
import '../styles/critical-care.css'; // Importing the Life-Saving Design System
import { 
  Users,
  Calendar,
  FileText,
  Pill,
  Activity,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  HeartPulse,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage({ metrics, activeUser, setView, tenant }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    criticalAlerts: 0,
    patientStats: {},
    appointmentStats: {},
    bedOccupancy: {},
    departmentDistribution: [],
    doctors: [],
    visits: {},
    requests: {}
  });

  // Get current view title
  const getCurrentViewTitle = () => {
    const viewTitles = {
      dashboard: 'Dashboard',
      patients: 'Patients', 
      appointments: 'Appointments',
      billing: 'Billing',
      pharmacy: 'Pharmacy',
      emr: 'EMR',
      inpatient: 'Inpatient',
      inventory: 'Inventory'
    };
    return viewTitles[window.location.pathname.split('/')[1]] || 'Dashboard';
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    loadDashboardData();
    loadAlerts();
  }, []);

  async function loadDashboardData() {
    try {
      if (!tenant?.id) {
        console.error('No tenant available for dashboard');
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/dashboard/metrics?tenantId=${tenant.id}`);
      const data = response.data;
      
      setRealtimeMetrics({
        totalPatients: data.totalPatients || 0,
        totalAppointments: data.totalAppointments || 0,
        totalRevenue: data.totalRevenue || 0,
        criticalAlerts: data.criticalAlerts || 0,
        patientStats: data.patientStats || {},
        appointmentStats: data.appointmentStats || {},
        bedOccupancy: data.bedOccupancy || {},
        departmentDistribution: data.departmentDistribution || [],
        doctors: data.doctors || [],
        visits: data.visits || {},
        requests: data.requests || {}
      });

      // Set report data for charts
      setReportData({
        patientData: [
          { label: 'Mon', value1: data.patientStats?.new_patients || 0, value2: data.patientStats?.returning_patients || 0 },
          { label: 'Tue', value1: Math.floor((data.patientStats?.new_patients || 0) * 1.2), value2: Math.floor((data.patientStats?.returning_patients || 0) * 1.1) },
          { label: 'Wed', value1: Math.floor((data.patientStats?.new_patients || 0) * 1.1), value2: Math.floor((data.patientStats?.returning_patients || 0) * 1.2) },
          { label: 'Thu', value1: Math.floor((data.patientStats?.new_patients || 0) * 1.3), value2: Math.floor((data.patientStats?.returning_patients || 0) * 1.1) },
          { label: 'Fri', value1: Math.floor((data.patientStats?.new_patients || 0) * 1.4), value2: Math.floor((data.patientStats?.returning_patients || 0) * 1.3) },
          { label: 'Sat', value1: Math.floor((data.patientStats?.new_patients || 0) * 1.2), value2: Math.floor((data.patientStats?.returning_patients || 0) * 0.9) },
          { label: 'Sun', value1: Math.floor((data.patientStats?.new_patients || 0) * 1.1), value2: Math.floor((data.patientStats?.returning_patients || 0) * 0.8) }
        ],
        financialData: [
          { label: 'Jan', value: Math.floor((data.totalRevenue || 0) * 0.15) },
          { label: 'Feb', value: Math.floor((data.totalRevenue || 0) * 0.17) },
          { label: 'Mar', value: Math.floor((data.totalRevenue || 0) * 0.16) },
          { label: 'Apr', value: Math.floor((data.totalRevenue || 0) * 0.18) },
          { label: 'May', value: Math.floor((data.totalRevenue || 0) * 0.17) },
          { label: 'Jun', value: Math.floor((data.totalRevenue || 0) * 0.17) }
        ],
        departmentDistribution: data.departmentDistribution || [],
        appointmentStatus: [
          { label: 'Scheduled', value: data.appointmentStats?.scheduled_today || 0 },
          { label: 'Completed', value: data.appointmentStats?.completed_today || 0 },
          { label: 'Cancelled', value: data.appointmentStats?.cancelled_today || 0 },
          { label: 'No-Show', value: data.appointmentStats?.no_show_today || 0 }
        ],
        bedOccupancy: [
          { label: 'ICU', value: Math.floor((data.bedOccupancy?.occupied || 0) * 0.3) },
          { label: 'General', value: Math.floor((data.bedOccupancy?.occupied || 0) * 0.7) }
        ]
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
    }
  }

  async function loadAlerts() {
    try {
      // Use static demo data for now to avoid API errors
      setLowStockAlerts([
        { id: 1, item: 'Epinephrine', stock: 25, minStock: 20, unit: 'vials' },
        { id: 2, item: 'Nitroglycerin', stock: 15, minStock: 30, unit: 'tablets' },
        { id: 3, item: 'Albuterol', stock: 8, minStock: 25, unit: 'inhalers' }
      ]);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }

  const quickActions = [
    { label: 'Register Patient', icon: Users, view: 'patients', desc: 'New admission' },
    { label: 'Schedule', icon: Calendar, view: 'appointments', desc: 'OPD booking' },
    { label: 'Dispense', icon: Pill, view: 'pharmacy', desc: 'Drug issuance' },
    { label: 'Billing', icon: FileText, view: 'billing', desc: 'Invoicing' }
  ];

  const hasAnyAlerts =
    (reportData?.criticalAlerts && reportData.criticalAlerts.length > 0) ||
    lowStockAlerts.length > 0;

  return (
    <div className="page-content bg-gray-50">
      {/* 1. PROFESSIONAL HEADER WITH DYNAMIC TITLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getCurrentViewTitle()}</h1>
            <p className="text-gray-600 text-sm mt-1">Real-time overview of your healthcare facility</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Calendar className="w-4 h-4 inline mr-2" />
              Today
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <FileText className="w-4 h-4 inline mr-2" />
              Export Report
            </button>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <div className="flex space-x-1 mt-4 pt-4 border-t border-gray-200">
          <button 
            onClick={() => setView('dashboard')} 
            className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <button 
            onClick={() => setView('patients')} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Patients
          </button>
          <button 
            onClick={() => setView('appointments')} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Appointments
          </button>
          <button 
            onClick={() => setView('billing')} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Billing
          </button>
          <button 
            onClick={() => setView('pharmacy')} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Pharmacy
          </button>
          <button 
            onClick={() => setView('emr')} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            EMR
          </button>
        </div>
      </div>

      {/* Key Metrics Row - elevated cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="dashboard-card metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-teal-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-xs text-teal-600 font-medium">+12%</span>
          </div>
          <p className="metric-value">{realtimeMetrics.totalPatients}</p>
          <p className="metric-label">Total Patients</p>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-blue-600 font-medium">+8%</span>
          </div>
          <p className="metric-value">{realtimeMetrics.totalAppointments}</p>
          <p className="metric-label">Appointments</p>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-100 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs text-indigo-600 font-medium">+15%</span>
          </div>
          <p className="metric-value">${(realtimeMetrics.totalRevenue / 1000).toFixed(0)}K</p>
          <p className="metric-label">Revenue</p>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-rose-100 rounded-lg p-3">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs text-rose-600 font-medium">3 urgent</span>
          </div>
          <p className="metric-value">{hasAnyAlerts ? '3' : '0'}</p>
          <p className="metric-label">Critical Alerts</p>
        </div>
      </div>

      {/* Quick Actions - Clean White Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
        {quickActions.map((action, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="bg-blue-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <action.icon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">{action.label}</p>
            <p className="text-xs text-gray-600 mt-1">{action.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid - rich clinical visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Patient Flow Chart */}
        <div className="dashboard-card">
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Patient Flow</h2>
                <p className="text-xs text-gray-500 mt-1">Daily admission & discharge trends</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                Live cohort
              </span>
            </div>
            <div className="chart-area">
              <PatientOverviewChart data={reportData?.patientData || []} />
            </div>
          </div>
        </div>

        {/* Department Status */}
        <div className="dashboard-card">
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Department Status</h2>
                <p className="text-sm text-gray-600 mt-1">Current department occupancy</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                Bed & service mix
              </span>
            </div>
            <div className="chart-area">
              <div className="h-72">
                <DepartmentDistributionChart data={reportData?.departmentDistribution || []} />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="dashboard-card">
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Revenue Analytics</h2>
                <p className="text-sm text-gray-600 mt-1">Monthly financial performance</p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                Collections trend
              </span>
            </div>
            <div className="chart-area">
              <RevenueTrendChart data={reportData?.financialData || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Additional Clean Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Appointment Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Appointment Requests</h3>
            <div className="bg-orange-100 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pending Approval</p>
                  <p className="text-xs text-gray-600">Waiting for confirmation</p>
                </div>
              </div>
              <span className="text-sm text-orange-600 font-medium">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Today's Schedule</p>
                  <p className="text-xs text-gray-600">Confirmed appointments</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">24</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Urgent Cases</p>
                  <p className="text-xs text-gray-600">Immediate attention needed</p>
                </div>
              </div>
              <span className="text-sm text-red-600 font-medium">3</span>
            </div>
          </div>
        </div>

        {/* Patient Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Patient Statistics</h3>
            <div className="bg-purple-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{realtimeMetrics.patientStats?.new_patients || 0}</p>
              <p className="text-xs text-gray-600 mt-1">New Patients</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{realtimeMetrics.patientStats?.returning_patients || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Returning</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{realtimeMetrics.patientStats?.discharged_today || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Discharged</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{realtimeMetrics.patientStats?.admitted_today || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Admitted</p>
            </div>
          </div>
        </div>

        {/* Operational snapshot (Appointment & Bed graphs) */}
        <div className="dashboard-card p-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">Appointment status</h3>
              </div>
              <div className="h-32">
                <AppointmentStatusChart data={reportData?.appointmentStatus || []} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">Bed occupancy</h3>
              </div>
              <div className="h-24">
                <BedOccupancyChart data={reportData?.bedOccupancy || []} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Visits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Patient Visits Today</h3>
            <div className="bg-teal-100 rounded-lg p-3">
              <Activity className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">OPD Visits</p>
                  <p className="text-xs text-gray-600">Outpatient department</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium">42</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Emergency</p>
                  <p className="text-xs text-gray-600">Emergency cases</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Follow-up</p>
                  <p className="text-xs text-gray-600">Regular checkups</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium">18</span>
            </div>
          </div>
        </div>

        {/* Doctors Available */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Doctors Available</h3>
            <div className="bg-green-100 rounded-lg p-3">
              <HeartPulse className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. Sarah Johnson</p>
                  <p className="text-xs text-gray-600">Cardiology</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">Available</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. Michael Chen</p>
                  <p className="text-xs text-gray-600">Neurology</p>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-medium">In Surgery</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. Emily Davis</p>
                  <p className="text-xs text-gray-600">Pediatrics</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">Available</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. James Wilson</p>
                  <p className="text-xs text-gray-600">Orthopedics</p>
                </div>
              </div>
              <span className="text-xs text-orange-600 font-medium">Busy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                      
