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
import '../styles/design-system.css';
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
    <div className="bg-[var(--page-bg)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
       <header className="p-4 bg-[var(--page-bg)] border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-strong)] flex items-center gap-2">
             <Activity className="w-3.5 h-3.5 text-[var(--clinical-blue)]" /> Patients Waiting
          </h3>
          <span className="text-[10px] bg-[var(--success)] text-white px-2.5 py-1 rounded-full font-bold shadow-sm">{queue.length} Total</span>
       </header>
       <div className="max-h-[300px] overflow-y-auto divide-y divide-[var(--border)]">
          {queue.length === 0 ? (
            <div className="p-10 text-center">
               <Activity className="w-8 h-8 text-[var(--border)] mx-auto mb-2" />
               <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">No patients waiting right now</p>
            </div>
          ) : (
            queue.map((a, idx) => {
              const patientId = a.patientId || a.patient_id;
              const p = patients.find(p => p.id === patientId);
              return (
                <div key={a.id} className="p-3 flex items-center gap-3 hover:bg-[var(--accent-soft)]/20 transition-colors group">
                   <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] text-[var(--clinical-blue)] flex items-center justify-center font-black text-[10px]">
                      {idx + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-[var(--text-strong)] truncate leading-relaxed mb-1">{p?.firstName} {p?.lastName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wide">{a.reason || 'General Visit'}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-normal ${a.status === 'triaged' ? 'bg-[var(--primary-soft)] text-[var(--clinical-blue)]' : 'bg-[var(--accent-soft)] text-[var(--clinical-blue)]'}`}>
                         {a.status}
                      </span>
                      <button 
                         onClick={() => { setActivePatientId?.(patientId); setView('emr'); }}
                         className="p-1.5 rounded-lg bg-[var(--primary)] text-white opacity-0 group-hover:opacity-100 transition-all shadow-sm"
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
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary)] shadow-2xl shadow-[var(--clinical-blue)]/20 flex items-center justify-center animate-pulse">
             <HeartPulse className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-4 border-2 border-[var(--clinical-blue)]/20 rounded-full animate-ping"></div>
          <div className="absolute -inset-8 border border-[var(--clinical-blue)]/10 rounded-full animate-ping [animation-delay:0.5s]"></div>
       </div>
       <div className="mt-10 text-center">
          <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--text-strong)] mb-2">Platform Intelligence</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest animate-pulse">Synchronizing Clinical Data Nodes...</p>
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


  async function loadDashboardData() { // Refactored for Stability
    try {
      if (!tenant?.id) {
        console.error('No tenant available for dashboard');
        setLoading(false);
        return;
      }
      
      const data = await api.get(`/reports/dashboard/metrics?tenantId=${tenant.id}&timeFilter=${timeFilter}`);
      
      const hasData = (data.totalPatients > 0 || data.totalAppointments > 0 || data.totalRevenue > 0);
      
      if (!hasData) {
        setLoading(false);
        return;
      }
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
      console.error('Failed to sync dashboard metrics:', err);
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
      ['HOSPITAL BUSINESS REPORT'],
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
      
      {/* 1. CLINICAL GOVERNANCE HERO BANNER */}
      <div className="page-header-premium stagger-entrance flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="animate-slide-down text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <span className="live-indicator"></span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Active Ecosystem Sync: {secondsSinceSync}s ago</span>
           </div>
           <h1 className="flex flex-col md:flex-row items-center gap-3 text-3xl font-black text-white">
              <span className="opacity-90">{getGreeting()},</span>
              <span>{activeUser?.name?.split(' ')[0] || 'Admin'}</span>
              <span className="text-[11px] bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/20 uppercase tracking-widest font-black shadow-lg backdrop-blur-md">
                Institutional Control Plane
              </span>
           </h1>
           <p className="text-[14px] mt-3 font-medium text-white/70 max-w-xl">
             Daily Clinical Summary & Operational Intelligence for <span className="text-white font-bold">{tenant?.name || 'Authorized Centre'}</span>
           </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-4 animate-slide-left">
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
             {['daily', 'weekly', 'monthly', 'yearly'].map(filter => (
               <button
                 key={filter}
                 onClick={() => setTimeFilter(filter)}
                 disabled={loading}
                 className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === filter ? 'btn-premium h-8 !px-4 !rounded-xl !text-[10px]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
               >
                 {filter}
               </button>
             ))}
          </div>
          <button 
            onClick={handleExportReport}
            className="btn-premium group"
          >
            <FileText className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            Generate Executive Report
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION OVERLAYS */}
      <div className="mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex bg-[var(--accent-soft)]/60 backdrop-blur-sm p-1.5 rounded-[22px] border border-[var(--accent-soft)] w-fit gap-1 min-w-max">
          {['dashboard', 'patients', 'appointments', 'billing', 'pharmacy', 'emr'].map((v) => (
             <button
                key={v}
                data-testid={`dash-nav-${v}`}
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
                <div className={`text-[11px] font-black uppercase tracking-widest leading-none ${realtimeMetrics.growth?.revenue >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                   {realtimeMetrics.growth?.revenue >= 0 ? 'Surge' : 'Dip'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-black mt-1 uppercase tracking-tighter">{realtimeMetrics.growth?.revenue}% vs Prev</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className="metric-value">{currency(realtimeMetrics.totalRevenue)}</div>
             <div className="metric-title">Total Income</div>
             <div className="metric-subtitle">Total money collected today</div>
          </div>
        </div>

        {/* Metric Card 2: Appointments */}
        <div className="platform-metric-card group hover:scale-[1.02] transition-transform duration-500">
          <div className="metric-header text-right">
             <div className="metric-icon blue shadow-lg shadow-blue-100">
                <Calendar className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className="text-[10px] font-black text-[var(--clinical-blue)] uppercase tracking-widest leading-none">Active</div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold">In Local Registry</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className="metric-value">{appointments.length || realtimeMetrics.totalAppointments}</div>
             <div className="metric-title">Check-up Bookings</div>
             <div className="metric-subtitle">Scheduled doctor visits found</div>
          </div>
        </div>

        {/* Metric Card 3: Patients */}
        <div className="platform-metric-card group hover:scale-[1.02] transition-transform duration-500">
          <div className="metric-header text-right">
             <div className="metric-icon green shadow-lg shadow-green-100">
                <Users className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-widest leading-none ${realtimeMetrics.growth?.patients >= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                   {realtimeMetrics.growth?.patients >= 0 ? 'Growing' : 'Stable'}
                </div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold">Live Patient Shards</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className="metric-value">{patients.length || realtimeMetrics.totalPatients}</div>
             <div className="metric-title">Total Registered Patients</div>
             <div className="metric-subtitle">All patient records in system</div>
          </div>
        </div>

        {/* Metric Card 4: Critical Alerts */}
        <div className={`platform-metric-card group transition-all duration-500 ${realtimeMetrics.criticalAlerts > 0 ? 'bg-[var(--danger)]/5 animate-alert-pulse border-[var(--danger)]/20' : ''}`}>
          <div className="metric-header text-right">
             <div className={`metric-icon red shadow-lg ${realtimeMetrics.criticalAlerts > 0 ? 'shadow-[var(--danger)]/20 animate-pulse' : 'shadow-[var(--danger)]/10'}`}>
                <AlertCircle className="w-6 h-6" />
             </div>
             <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-widest leading-none ${realtimeMetrics.criticalAlerts > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                   {realtimeMetrics.criticalAlerts > 0 ? 'Attention' : 'Stable'}
                </div>
                <div className="text-[9px] text-[var(--text-soft)] font-bold">Critical Node Detection</div>
             </div>
          </div>
          <div className="metric-content mt-4">
             <div className={`metric-value ${realtimeMetrics.criticalAlerts > 0 ? 'text-[var(--danger)]' : ''}`}>{realtimeMetrics.criticalAlerts}</div>
             <div className="metric-title">System Alerts</div>
             <div className="metric-subtitle">Shortages or Issues</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row - User Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="dashboard-card metric-card">
          <div className="flex justify-center mb-3">
            <div className="bg-[var(--danger)]/10 rounded-lg p-3">
              <Droplet className="w-6 h-6 text-[var(--danger)]" />
            </div>
          </div>
          <p className="metric-value">{realtimeMetrics.bloodBank?.value || 0} {realtimeMetrics.bloodBank?.label || 'Units'}</p>
          <p className="metric-label">Blood Bank Stock</p>
          <span className="text-xs text-[var(--danger)] font-medium font-bold">
            {(realtimeMetrics.bloodBank?.value || 0) < 10 ? 'Urgent Restock' : 'Safe Levels'}
          </span>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex justify-center mb-3">
            <div className="bg-[var(--primary-soft)] rounded-lg p-3">
              <FlaskConical className="w-6 h-6 text-[var(--clinical-blue)]" />
            </div>
          </div>
          <p className="metric-value">{realtimeMetrics.labProgress?.value || 0}%</p>
          <p className="metric-label">Lab Progress</p>
          <span className="text-xs text-[var(--clinical-blue)] font-medium font-bold">{realtimeMetrics.labProgress?.pending || 0} pending</span>
        </div>

        <div className="dashboard-card metric-card">
          <div className="flex justify-center mb-3">
            <div className="bg-[var(--success)]/10 rounded-lg p-3">
              <Truck className="w-6 h-6 text-[var(--success)]" />
            </div>
          </div>
          <p className="metric-value">{realtimeMetrics.fleetStatus?.available || 0} / {realtimeMetrics.fleetStatus?.total || 0}</p>
          <p className="metric-label">Fleet Available</p>
          <span className="text-xs text-[var(--success)] font-medium font-bold">{realtimeMetrics.fleetStatus?.active || 0} En Route</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {quickActions.map((action, index) => (
          <div key={index} 
               data-testid={`quick-action-${action.view}`}
               onClick={() => setView?.(action.view)}
               className="bg-[var(--page-bg)] rounded-xl shadow-sm border border-[var(--border)] p-6 text-center cursor-pointer hover:shadow-md transition-all group">
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
        <div className="dashboard-card border border-[var(--border)] bg-[var(--page-bg)] rounded-xl shadow-sm p-0 flex flex-col h-full overflow-hidden">
          <div className="chart-container flex-1 flex flex-col p-4">
            <div className="chart-header flex justify-between items-start mb-4">
              <div>
                <h2 className="chart-title text-lg font-semibold text-[var(--text-strong)]">Patient Flow</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Daily admission & discharge trends</p>
              </div>
              <span className="text-[10px] font-semibold text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-full px-3 py-1">
                Live cohort
              </span>
            </div>
            <div className="chart-area flex-1 min-h-[250px] relative w-full">
              <PatientOverviewChart data={reportData?.patientData || []} />
            </div>
          </div>
        </div>

        {/* Department Status */}
        <div className="dashboard-card border border-[var(--border)] bg-[var(--page-bg)] rounded-xl shadow-sm p-0 flex flex-col h-full overflow-hidden">
          <div className="chart-container flex-1 flex flex-col p-4">
            <div className="chart-header flex justify-between items-start mb-4">
              <div>
                <h2 className="chart-title text-lg font-semibold text-[var(--text-strong)]">Department Status</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Current department occupancy</p>
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-strong)] bg-[var(--accent-soft)] border border-[var(--border)] rounded-full px-3 py-1">
                Bed & service mix
              </span>
            </div>
            <div className="chart-area flex-1 min-h-[250px] relative w-full">
              <DepartmentDistributionChart data={reportData?.departmentDistribution || []} />
            </div>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="dashboard-card border border-[var(--border)] bg-[var(--page-bg)] rounded-xl shadow-sm p-0 flex flex-col h-full overflow-hidden">
          <div className="chart-container flex-1 flex flex-col p-4">
            <div className="chart-header flex justify-between items-start mb-4">
              <div>
                <h2 className="chart-title text-lg font-semibold text-[var(--text-strong)]">Revenue Analytics</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Monthly financial performance</p>
              </div>
              <span className="text-[10px] font-semibold text-[var(--clinical-blue)] bg-[var(--clinical-blue)]/10 border border-[var(--clinical-blue)]/20 rounded-full px-3 py-1">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Top Diagnoses */}
        <div className="dashboard-card border border-[var(--border)] bg-[var(--page-bg)] rounded-xl shadow-sm p-4 h-[350px] overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-strong)]">Top 10 Diagnoses</h3>
              <FileText className="w-4 h-4 text-[var(--clinical-blue)]" />
           </div>
           <div className="h-[280px]">
              <TopDiagnosesChart data={realtimeMetrics.topDiagnoses} />
           </div>
        </div>

        {/* Top Services (Revenue Mix) */}
        <div className="dashboard-card border border-[var(--border)] bg-[var(--page-bg)] rounded-xl shadow-sm p-4 h-[350px] overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-strong)]">Revenue Mix by Service</h3>
              <span className="text-2xl font-bold text-[var(--success)]">₹</span>
           </div>
           <div className="h-[280px]">
              <TopServicesChart data={realtimeMetrics.topServices} />
           </div>
        </div>
      </div>

      {/* NEW: STAFF & JOURNEY METRICS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Staff Distribution */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[400px] overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Staffing Distribution</h3>
              <Users className="w-4 h-4 text-indigo-500" />
           </div>
           <div className="h-[330px]">
              <StaffDistributionChart data={realtimeMetrics.staffStats} />
           </div>
        </div>

        {/* Patient Journey Lifecycle */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[400px] overflow-hidden">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* No-Show Rate Analysis */}
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[350px] overflow-hidden">
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
        <div className="dashboard-card border border-gray-200 bg-white rounded-xl shadow-sm p-4 h-[350px] overflow-hidden">
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
                      
