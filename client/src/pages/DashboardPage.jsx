import { useState, useEffect } from 'react';
import {
  PatientOverviewChart,
  RevenueTrendChart,
  DepartmentDistributionChart,
  AppointmentStatusChart,
  BedOccupancyChart,
  StaffDistributionChart,
  PatientJourneyChart,
  NoShowRateChart,
  DoctorPerformanceChart
} from '../components/EChartsComponents.jsx';
import { currency } from '../utils/format.js';
import { api } from '../api.js';
import { exportToCSV } from '../utils/export.js';
import '../styles/critical-care.css'; // Importing the Life-Saving Design System
import { 
  Users,
  Calendar,
  FileText,
  Pill,
  Activity,
  AlertCircle,
  ShieldCheck,
  HeartPulse,
  TrendingUp,
  Stethoscope,
  ChevronRight,
  Droplet,
  FlaskConical,
  Truck,
  Zap,
  Gift
} from 'lucide-react';
import OfferAnnouncement from '../components/OfferAnnouncement.jsx';
import { 
  TopDiagnosesChart, 
  TopServicesChart 
} from '../components/EChartsComponents.jsx';


/* ─── LIVE PATIENT QUEUE COMPONENT ────────────────────────────────── */
function LiveQueue({ appointments = [], patients = [], setView, setActivePatientId }) {
  const queue = appointments
    .filter(a => ['checked_in', 'triaged'].includes(a.status))
    .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--accent-soft)] overflow-hidden">
       <header className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
             <Activity className="w-3.5 h-3.5 text-indigo-500" /> Live Patient Queue
          </h3>
          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">{queue.length} Pulse</span>
       </header>
       <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
          {queue.length === 0 ? (
            <div className="p-10 text-center">
               <Activity className="w-8 h-8 text-slate-100 mx-auto mb-2" />
               <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">No active consultations</p>
            </div>
          ) : (
            queue.map((a, idx) => {
              const patientId = a.patientId || a.patient_id;
              const p = patients.find(p => p.id === patientId);
              return (
                <div key={a.id} className="p-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors group">
                   <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                      {idx + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate leading-none mb-1">{p?.firstName} {p?.lastName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">{a.reason || 'General Visit'}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${a.status === 'triaged' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                         {a.status}
                      </span>
                      <button 
                         onClick={() => { setActivePatientId?.(patientId); setView('emr'); }}
                         className="p-1.5 rounded-lg bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                         <ChevronRight className="w-3 h-3" />
                      </button>
                   </div>
                </div>
              );
            })
          )}
       </div>
    </div>
  );
}

/* ─── PREMIUM DASHBOARD LOADER ────────────────────────────────────────── */
function DashboardLoader() {
  return (
    <div className="fixed inset-0 z-[999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
       <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary)] shadow-2xl shadow-indigo-200 flex items-center justify-center animate-pulse">
             <HeartPulse className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-full animate-ping"></div>
          <div className="absolute -inset-8 border border-indigo-500/10 rounded-full animate-ping [animation-delay:0.5s]"></div>
       </div>
       <div className="mt-10 text-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 mb-2">NHGL Intelligence</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing Clinical Data Nodes...</p>
       </div>
    </div>
  );
}

export default function DashboardPage({ metrics, activeUser, setView, tenant, view, appointments = [], patients = [], setActivePatientId }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [timeFilter, setTimeFilter] = useState('daily');
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
    requests: {},
    topDiagnoses: [],
    topServices: [],
    staffStats: [],
    patientJourney: [],
    masterStats: {},
    noShowTrend: []
  });
  const [secondsSinceSync, setSecondsSinceSync] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceSync(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    setSecondsSinceSync(0);
  }, [timeFilter]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  async function loadDashboardData() {
    try {
      if (!tenant?.id) {
        console.error('No tenant available for dashboard');
        setLoading(false);
        return;
      }
      
      const data = await api.get(`/reports/dashboard/metrics?tenantId=${tenant.id}&timeFilter=${timeFilter}`);
      
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
        requests: data.requests || {},
        topDiagnoses: data.topDiagnoses || [],
        topServices: data.topServices || [],
        staffStats: data.staffStats || data.staffDistribution || [],
        patientJourney: data.patientJourney || [],
        masterStats: data.masterStats || data.masterCounts || {},
        noShowTrend: data.noShowTrend || [],
        bloodBank: data.bloodBank || { value: 0, label: 'Units' },
        labProgress: data.labProgress || { value: 0, label: '%' },
        fleetStatus: data.fleetStatus || { available: 0, total: 0 },
        growth: data.growth || { revenue: 0, patients: 0 }
      });

      setSecondsSinceSync(0);

      // Set report data for charts - use real historical data
      setReportData({
        patientData: data.patientTrend || [],
        financialData: data.revenueTrend || [],
        departmentDistribution: data.departmentDistribution || [],
        appointmentStatus: [
          { label: 'Scheduled', value: data.appointmentStats?.scheduled_today || 0 },
          { label: 'Completed', value: data.appointmentStats?.completed_today || 0 },
          { label: 'Cancelled', value: data.appointmentStats?.cancelled_today || 0 },
          { label: 'No-Show', value: data.appointmentStats?.no_show_today || 0 }
        ],
        bedOccupancy: [
          { label: 'Occupied', value: data.bedOccupancy?.occupied || 0 },
          { label: 'Available', value: data.bedOccupancy?.available || 0 }
        ],
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

  function handleTodayFilter() {
    setLoading(true);
    loadDashboardData().then(() => {
      // Small delay for visual feedback that it's refreshing
      setTimeout(() => setLoading(false), 500);
    });
  }

  function handleExportReport() {
    const todayStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const csvData = [
      ['HEALTHEZEE EMR CARE - CLINICAL EXECUTIVE REPORT'],
      [`Generated on: ${todayStr}`],
      ['Facility:', tenant?.name || 'Authorized Facility'],
      [''],
      ['--- CORE OPERATIONAL SUMMARY ---'],
      ['Metric', 'Value', 'Status'],
      ['Total Patients Registered', realtimeMetrics.totalPatients, 'N/A'],
      ['Appointments (Today)', realtimeMetrics.totalAppointments, 'Action Required'],
      ['Gross Revenue Generated', currency(realtimeMetrics.totalRevenue), 'N/A'],
      ['Critical System Alerts', realtimeMetrics.criticalAlerts, realtimeMetrics.criticalAlerts > 0 ? 'FAIL' : 'PASS'],
      [''],
      ['--- PATIENT LIFECYCLE (TODAY) ---'],
      ['Metric', 'Count'],
      ['New Admissions', realtimeMetrics.patientStats?.new_patients || 0],
      ['Returning Patients', realtimeMetrics.patientStats?.returning_patients || 0],
      ['Inpatient Admissions', realtimeMetrics.patientStats?.admitted_today || 0],
      ['Successful Discharges', realtimeMetrics.patientStats?.discharged_today || 0],
      [''],
      ['--- APPOINTMENT FLOW STATUS ---'],
      ['Status', 'Count'],
      ['Scheduled', realtimeMetrics.appointmentStats?.scheduled_today || 0],
      ['Completed', realtimeMetrics.appointmentStats?.completed_today || 0],
      ['Cancelled', realtimeMetrics.appointmentStats?.cancelled_today || 0],
      ['No-Show', realtimeMetrics.appointmentStats?.no_show_today || 1],
      [''],
      ['--- INFRASTRUCTURE & CAPACITY ---'],
      ['Asset Type', 'Total Records'],
      ['Departments Configured', realtimeMetrics.masterStats?.departments || 0],
      ['Total Wards', realtimeMetrics.masterStats?.wards || 0],
      ['Total Bed Inventory', realtimeMetrics.masterStats?.beds || 0],
      ['Service Catalog Items', realtimeMetrics.masterStats?.services || 0],
      ['Active Workforce (Sync)', realtimeMetrics.masterStats?.total_staff || 0],
      [''],
      ['--- DEPARTMENTAL OCCUPANCY BREAKDOWN ---'],
      ['Department Name', 'Total Patients / Value'],
      ...realtimeMetrics.departmentDistribution.map(d => [d.name, d.value]),
      [''],
      ['--- REVENUE MIX BY SERVICE ---'],
      ['Service Stream', 'Revenue Contribution'],
      ...realtimeMetrics.topServices.map(s => [s.name, currency(s.value)]),
      [''],
      ['--- CLINICAL DIAGNOSTICS (TOP 5) ---'],
      ['Diagnosis Name', 'Encounter Frequency'],
      ...realtimeMetrics.topDiagnoses.slice(0, 5).map(d => [d.name, d.value]),
      [''],
      ['--- END OF REPORT ---']
    ];
    
    const filename = `ClinicalExecutiveReport_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(csvData, filename);
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
    <div className="page-shell-premium animate-fade-in overflow-x-hidden">
      {loading && <DashboardLoader />}
      
      {/* 1. CLINICAL GOVERNANCE HEADER */}
      <header className="page-header-premium mb-10 pb-6 border-b border-[var(--accent-soft)] flex justify-between items-end">
        <div className="animate-slide-down">
           <div className="flex items-center gap-2 mb-2">
              <span className="live-indicator"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Active Sync: {secondsSinceSync}s ago</span>
           </div>
           <h1 className="flex items-center gap-3">
              {getGreeting()}, {activeUser?.name?.split(' ')[0] || 'Admin'}
              <span className="text-[9px] bg-[var(--clinical-primary)] text-white px-2 py-0.5 rounded-lg border border-white/10 uppercase tracking-tighter font-black">Institutional Console</span>
           </h1>
           <p className="dim-label text-xs">Facility Health Overview for {tenant?.name || 'Authorized Centre'}</p>
        </div>
        <div className="flex items-center gap-4 animate-slide-left">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
             {['daily', 'weekly', 'monthly', 'yearly'].map(filter => (
               <button
                 key={filter}
                 onClick={() => setTimeFilter(filter)}
                 disabled={loading}
                 className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === filter ? 'bg-white shadow-sm text-[var(--clinical-primary)]' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {filter}
               </button>
             ))}
          </div>
          <button 
            onClick={handleExportReport}
            className="px-6 py-2.5 bg-white border border-[var(--accent-soft)] rounded-2xl hover:bg-[var(--accent-soft)]/40 transition-all text-xs font-black uppercase tracking-widest text-[var(--clinical-secondary)] shadow-sm flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </header>

      {/* 2. NAVIGATION OVERLAYS */}
      <div className="mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex bg-[var(--accent-soft)]/60 backdrop-blur-sm p-1.5 rounded-[22px] border border-[var(--accent-soft)] w-fit gap-1 min-w-max">
          {['dashboard', 'patients', 'appointments', 'billing', 'pharmacy', 'emr'].map((v) => (
             <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 sm:px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-[var(--clinical-primary)] text-white shadow-sm' : 'text-[var(--clinical-secondary)] hover:text-[var(--clinical-primary)]'}`}
             >
                {v}
             </button>
          ))}
        </div>
      </div>

      {/* ── MISSING FLOW: Offer Announcement for Tenant Scaling ── */}
      <OfferAnnouncement tenant={tenant} />



      {/* 2. CORE METRICS GRID (Lively & Analytical) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 stagger-entrance">
        {/* Metric Card 1: Revenue */}
        <div className="platform-metric-card group hover:scale-[1.02] transition-transform duration-500">
          <div className="metric-header text-right">
             <div className="metric-icon emerald shadow-lg shadow-emerald-100">
                <TrendingUp className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-widest leading-none ${realtimeMetrics.growth?.revenue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                   {realtimeMetrics.growth?.revenue >= 0 ? 'Surge' : 'Dip'}
                </div>
                <div className="text-[9px] text-slate-400 font-bold">{realtimeMetrics.growth?.revenue}% vs Prev</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className="metric-value">{currency(realtimeMetrics.totalRevenue)}</div>
             <div className="metric-title">Gross Revenue</div>
             <div className="metric-subtitle">Total collections processed</div>
          </div>
        </div>

        {/* Metric Card 2: Appointments */}
        <div className="platform-metric-card group hover:scale-[1.02] transition-transform duration-500">
          <div className="metric-header text-right">
             <div className="metric-icon blue shadow-lg shadow-blue-100">
                <Calendar className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Active</div>
                <div className="text-[9px] text-slate-400 font-bold">Planned Today</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className="metric-value">{realtimeMetrics.totalAppointments}</div>
             <div className="metric-title">OPD Appointments</div>
             <div className="metric-subtitle">Scheduled consultations</div>
          </div>
        </div>

        {/* Metric Card 3: Patients */}
        <div className="platform-metric-card group hover:scale-[1.02] transition-transform duration-500">
          <div className="metric-header text-right">
             <div className="metric-icon green shadow-lg shadow-green-100">
                <Users className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-widest leading-none ${realtimeMetrics.growth?.patients >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                   {realtimeMetrics.growth?.patients >= 0 ? 'Growing' : 'Stable'}
                </div>
                <div className="text-[9px] text-slate-400 font-bold">{realtimeMetrics.growth?.patients}% MoM Growth</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className="metric-value">{realtimeMetrics.totalPatients}</div>
             <div className="metric-title">Total Patients</div>
             <div className="metric-subtitle">Registered clinical files</div>
          </div>
        </div>

        {/* Metric Card 4: Critical Alerts */}
        <div className={`platform-metric-card group transition-all duration-500 ${realtimeMetrics.criticalAlerts > 0 ? 'bg-red-50/30 animate-alert-pulse border-red-200' : ''}`}>
          <div className="metric-header text-right">
             <div className={`metric-icon red shadow-lg ${realtimeMetrics.criticalAlerts > 0 ? 'shadow-red-200 animate-pulse' : 'shadow-red-100'}`}>
                <AlertCircle className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-widest leading-none ${realtimeMetrics.criticalAlerts > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                   {realtimeMetrics.criticalAlerts > 0 ? 'Attention' : 'Stable'}
                </div>
                <div className="text-[9px] text-slate-400 font-bold">Critical Node Detection</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className={`metric-value ${realtimeMetrics.criticalAlerts > 0 ? 'text-red-700' : ''}`}>{realtimeMetrics.criticalAlerts}</div>
             <div className="metric-title">Critical Alerts</div>
             <div className="metric-subtitle">Shortages / Absences</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row - User Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="dashboard-card metric-card">
          <div className="flex justify-center mb-3">
            <div className="bg-red-50 rounded-lg p-3">
              <Droplet className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="metric-value">{realtimeMetrics.bloodBank?.value || 0} {realtimeMetrics.bloodBank?.label || 'Units'}</p>
          <p className="metric-label">Blood Bank Stock</p>
          <span className="text-xs text-red-600 font-medium font-bold">
            {(realtimeMetrics.bloodBank?.value || 0) < 10 ? 'Urgent Restock' : 'Safe Levels'}
          </span>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex justify-center mb-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <FlaskConical className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="metric-value">{realtimeMetrics.labProgress?.value || 0}%</p>
          <p className="metric-label">Lab Progress</p>
          <span className="text-xs text-purple-600 font-medium font-bold">{realtimeMetrics.labProgress?.pending || 0} pending</span>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex justify-center mb-3">
            <div className="bg-emerald-50 rounded-lg p-3">
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="metric-value">{realtimeMetrics.fleetStatus?.available || 0} / {realtimeMetrics.fleetStatus?.total || 0}</p>
          <p className="metric-label">Fleet Available</p>
          <span className="text-xs text-emerald-600 font-medium font-bold">{realtimeMetrics.fleetStatus?.active || 0} En Route</span>
        </div>
      </div>

      {/* Quick Actions - Clean White Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {quickActions.map((action, index) => (
          <div key={index} 
               onClick={() => setView?.(action.view)}
               className="bg-white rounded-xl shadow-sm border border-[var(--accent-soft)] p-6 text-center cursor-pointer hover:shadow-md transition-all group">
            <div className="bg-[var(--accent-soft)] group-hover:bg-[var(--primary-soft)] rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center transition-colors">
              <action.icon className="w-6 h-6 text-[var(--clinical-blue)]" />
            </div>
            <p className="text-sm font-medium text-[var(--clinical-primary)]">{action.label}</p>
            <p className="text-xs text-[var(--clinical-secondary)] mt-1">{action.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid - rich clinical visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Patient Flow Chart */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-0 flex flex-col h-full overflow-hidden">
          <div className="chart-container flex-1 flex flex-col p-4">
            <div className="chart-header flex justify-between items-start mb-4">
              <div>
                <h2 className="chart-title text-lg font-semibold text-gray-900">Patient Flow</h2>
                <p className="text-xs text-gray-500 mt-1">Daily admission & discharge trends</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                Live cohort
              </span>
            </div>
            <div className="chart-area flex-1 min-h-[250px] relative w-full">
              <PatientOverviewChart data={reportData?.patientData || []} />
            </div>
          </div>
        </div>

        {/* Department Status */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-0 flex flex-col h-full overflow-hidden">
          <div className="chart-container flex-1 flex flex-col p-4">
            <div className="chart-header flex justify-between items-start mb-4">
              <div>
                <h2 className="chart-title text-lg font-semibold text-gray-900">Department Status</h2>
                <p className="text-sm text-gray-600 mt-1">Current department occupancy</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                Bed & service mix
              </span>
            </div>
            <div className="chart-area flex-1 min-h-[250px] relative w-full">
              <DepartmentDistributionChart data={reportData?.departmentDistribution || []} />
            </div>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-0 flex flex-col h-full overflow-hidden">
          <div className="chart-container flex-1 flex flex-col p-4">
            <div className="chart-header flex justify-between items-start mb-4">
              <div>
                <h2 className="chart-title text-lg font-semibold text-gray-900">Revenue Analytics</h2>
                <p className="text-sm text-gray-600 mt-1">Monthly financial performance</p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                Collections trend
              </span>
            </div>
            <div className="chart-area flex-1 min-h-[250px] relative w-full">
              <RevenueTrendChart data={reportData?.financialData || []} />
            </div>
          </div>
        </div>
      </div>

      {/* NEW: TOP METRICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top Diagnoses */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[350px]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Top 10 Diagnoses</h3>
              <FileText className="w-4 h-4 text-purple-500" />
           </div>
           <div className="h-[280px]">
              <TopDiagnosesChart data={realtimeMetrics.topDiagnoses} />
           </div>
        </div>

        {/* Top Services (Revenue Mix) */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[350px]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Revenue Mix by Service</h3>
              <span className="text-2xl font-bold text-emerald-500">₹</span>
           </div>
           <div className="h-[280px]">
              <TopServicesChart data={realtimeMetrics.topServices} />
           </div>
        </div>
      </div>

      {/* NEW: STAFF & JOURNEY METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Staff Distribution */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[400px]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Staffing Distribution</h3>
              <Users className="w-4 h-4 text-indigo-500" />
           </div>
           <div className="h-[330px]">
              <StaffDistributionChart data={realtimeMetrics.staffStats} />
           </div>
        </div>

        {/* Patient Journey Lifecycle */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[400px]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Clinical Workflow Funnel</h3>
              <Activity className="w-4 h-4 text-emerald-500" />
           </div>
           <div className="h-[330px]">
              <PatientJourneyChart data={realtimeMetrics.patientJourney} />
           </div>
        </div>
      </div>

      {/* NEW: ANALYTICS ROW - No-Show Rate + Doctor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* No-Show Rate Analysis */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[350px]">
           <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">No-Show Rate Analysis</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Daily missed appointments & rate trend</p>
              </div>
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-3 py-1">Risk Metric</span>
           </div>
           <div className="h-[270px]">
              <NoShowRateChart data={realtimeMetrics.noShowTrend || []} />
           </div>
        </div>

        {/* Doctor Performance */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[350px]">
           <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Doctor Performance</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Consultations · Avg time · Satisfaction</p>
              </div>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-3 py-1">Workforce KPI</span>
           </div>
           <div className="h-[270px]">
              <DoctorPerformanceChart data={realtimeMetrics.doctors?.filter(d => d.consultations !== undefined) || []} />
           </div>
        </div>
      </div>

      {/* NEW: MASTER TABLE HEALTH STATUS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
         <div className="dashboard-card bg-slate-50 border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Departments</p>
            <p className="text-xl font-black text-slate-800">{realtimeMetrics.masterStats?.departments || 0}</p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
               <div className="bg-indigo-500 h-full" style={{ width: `${Math.min((realtimeMetrics.masterStats?.departments || 0) * 10, 100)}%` }}></div>
            </div>
         </div>
         <div className="dashboard-card bg-slate-50 border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Ward Config</p>
            <p className="text-xl font-black text-slate-800">{realtimeMetrics.masterStats?.wards || 0}</p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
               <div className="bg-emerald-500 h-full" style={{ width: `${Math.min((realtimeMetrics.masterStats?.wards || 0) * 20, 100)}%` }}></div>
            </div>
         </div>
         <div className="dashboard-card bg-slate-50 border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Bed Registry</p>
            <p className="text-2xl font-black text-slate-800">{(realtimeMetrics.masterStats?.beds || 0).toLocaleString('en-IN')}</p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
               <div className="bg-rose-500 h-full" style={{ width: `${Math.min((realtimeMetrics.masterStats?.beds || 0) * 5, 100)}%` }}></div>
            </div>
         </div>
         <div className="dashboard-card bg-slate-50 border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Service Catalog</p>
            <p className="text-2xl font-black text-slate-800">{(realtimeMetrics.masterStats?.services || 0).toLocaleString('en-IN')}</p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
               <div className="bg-amber-500 h-full" style={{ width: `${Math.min((realtimeMetrics.masterStats?.services || 0) * 2, 100)}%` }}></div>
            </div>
         </div>
         <div className="dashboard-card bg-slate-50 border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Active Staff</p>
            <p className="text-xl font-black text-slate-800">{realtimeMetrics.masterStats?.total_staff || 0}</p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
               <div className="bg-blue-500 h-full" style={{ width: `${Math.min((realtimeMetrics.masterStats?.total_staff || 0) * 2, 100)}%` }}></div>
            </div>
         </div>
      </div>

      {/* Bottom Section - Additional Clean Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Live Queue (Replacing Appointment Requests for Admin) */}
        <LiveQueue 
           appointments={appointments} 
           patients={patients} 
           setView={setView} 
           setActivePatientId={setActivePatientId} 
        />

        {/* Patient Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Patient Statistics</h3>
            <div className="bg-purple-100 rounded-lg p-3 w-12 h-12 mx-auto flex items-center justify-center mt-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="stat-value text-purple-600">{realtimeMetrics.patientStats?.new_patients || 0}</p>
              <p className="stat-label mt-2">New Patients</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="stat-value text-blue-600">{realtimeMetrics.patientStats?.returning_patients || 0}</p>
              <p className="stat-label mt-2">Returning</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="stat-value text-emerald-600">{realtimeMetrics.patientStats?.discharged_today || 0}</p>
              <p className="stat-label mt-2">Discharged</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="stat-value text-orange-600">{realtimeMetrics.patientStats?.admitted_today || 0}</p>
              <p className="stat-label mt-2">Admitted</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <p className="text-sm font-medium text-gray-900">Total Visits</p>
                  <p className="text-xs text-gray-600">All departments</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium">{realtimeMetrics.totalAppointments || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Patients</p>
                  <p className="text-xs text-gray-600">First time registrations</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium">{realtimeMetrics.patientStats?.new_patients || 0}</span>
            </div>
          </div>
        </div>

        {/* Doctors Available */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Workforce Status</h3>
            <div className="bg-green-100 rounded-lg p-3">
              <HeartPulse className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
            {realtimeMetrics.doctors?.length > 0 ? (
              realtimeMetrics.doctors.map((doctor, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                      <p className="text-xs text-gray-600">{doctor.specialization || 'Staff'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 italic text-xs">
                No active staff records found for this facility.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
                      
