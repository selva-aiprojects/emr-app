import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings, 
  Activity, 
  Package, 
  CreditCard, 
  Database,
  ChevronRight,
  Plus,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Box,
  LayoutGrid,
  Menu,
  X,
  Globe,
  ShieldCheck,
  Zap,
  Crown
} from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';

// Real Superadmin Components
import GlobalDashboard from '../components/superadmin/GlobalDashboard.jsx';
import TenantControlCenter from '../components/superadmin/TenantControlCenter.jsx';
import SubscriptionEngine from '../components/superadmin/SubscriptionEngine.jsx';

export default function UnifiedAdminPage({ tenant, userRole = 'superadmin' }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [overview, setOverview] = useState({});

  const adminTabs = [
    { id: 'overview', name: 'Overview', icon: Activity, color: 'indigo' },
    { id: 'tenants', name: 'Nodes Control', icon: Building2, color: 'blue' },
    { id: 'offers', name: 'Plan Registry', icon: Package, color: 'emerald' },
    { id: 'billing', name: 'Fiscal Ledger', icon: CreditCard, color: 'rose' },
    { id: 'system', name: 'Core Config', icon: Settings, color: 'slate' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, tn] = await Promise.all([
        api.getSuperadminOverview(),
        api.getTenants()
      ]);
      setOverview(ov || {});
      setTenants(tn || []);
    } catch (error) {
       console.error('Data sync failed:', error);
       showToast({ title: 'Sync Error', message: 'Platform data is temporarily unavailable.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
         <Activity className="animate-spin text-indigo-600" size={32} />
         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Synchronizing Cluster...</p>
      </div>
    );

    switch (activeTab) {
      case 'overview':
        return <GlobalDashboard tenants={tenants} overview={overview} />;
      case 'tenants':
        return <TenantControlCenter tenants={tenants} onRefresh={loadData} />;
      case 'offers':
        return <SubscriptionEngine tenants={tenants} />;
      case 'billing':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center space-y-4">
             <CreditCard className="mx-auto text-slate-100" size={80} />
             <h3 className="text-sm font-black uppercase tracking-widest">Global Fiscal Ledger</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase">Consolidated platform revenue & institutional receivables.</p>
          </div>
        );
      case 'system':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center space-y-4">
             <Settings className="mx-auto text-slate-100" size={80} />
             <h3 className="text-sm font-black uppercase tracking-widest">Infrastructure Config</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase">Low-level platform orchestration & governance keys.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 sm:p-4 lg:p-8 animate-fade-in relative overflow-hidden">
      {/* Background Subtle Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/30 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-50/30 blur-[120px] rounded-full -z-10" />

      {/* Modern Compact Header */}
      <header className="max-w-[1400px] mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 group hover:rotate-12 transition-transform">
               <Shield size={24} />
            </div>
            <div>
               <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                  Unified Admin Console
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-black not-italic uppercase tracking-widest">Active</span>
               </h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Platform Governance · Cluster Shards: {tenants.length}</p>
            </div>
         </div>

         {/* Navigation Tab Bar */}
         <nav className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1 shadow-sm overflow-x-auto no-scrollbar">
            {adminTabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                     activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'
                  }`}
               >
                  <tab.icon size={14} /> {tab.name}
               </button>
            ))}
         </nav>
      </header>

      {/* Main Viewport */}
      <main className="max-w-[1400px] mx-auto pb-20">
         {renderContent()}
      </main>

      {/* Floating Status Bar */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-200 shadow-2xl flex items-center gap-6 z-50">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${overview.health === 'critical' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Core Engine: Stable</span>
         </div>
         <div className="w-px h-3 bg-slate-200" />
         <div className="flex items-center gap-2">
            <Activity size={12} className="text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Yield: Optimized</span>
         </div>
         <div className="w-px h-3 bg-slate-200" />
         <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Node: AP-SOUTH-1-EMR
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
