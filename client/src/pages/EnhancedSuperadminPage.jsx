import React, { useState, useEffect } from 'react';
import { 
  Server
} from 'lucide-react';

// New Core Modules
import GlobalDashboard from '../components/superadmin/GlobalDashboard.jsx';
import SubscriptionEngine from '../components/superadmin/SubscriptionEngine.jsx';
import TenantControlCenter from '../components/superadmin/TenantControlCenter.jsx';
import InfraOpsManager from '../components/superadmin/InfraOpsManager.jsx';
import FiscalGovernance from '../components/superadmin/FiscalGovernance.jsx';
import CommunicationCenter from '../components/superadmin/CommunicationCenter.jsx';

import '../styles/superadmin.css';

export default function EnhancedSuperadminPage({ 
  view: initialView = 'superadmin', 
  tenants = [], 
  users = [],
  superOverview = {},
  onRefresh
}) {
  const [activeView, setActiveView] = useState(initialView);

  // Sync active view with parent initial choice if needed
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const renderContent = () => {
    switch (activeView) {
      case 'superadmin':
        return <GlobalDashboard tenants={tenants} overview={superOverview} />;
      case 'subscription_mgmt':
        return <SubscriptionEngine tenants={tenants} />;
      case 'tenant_management':
        return <TenantControlCenter tenants={tenants} onRefresh={onRefresh} />;
      case 'infra_health':
        return <InfraOpsManager tenants={tenants} overview={superOverview} />;
      case 'financial_control':
        return <FiscalGovernance tenants={tenants} />;
      case 'communication':
        return <CommunicationCenter tenants={tenants} />;
      default:
        return <GlobalDashboard tenants={tenants} overview={superOverview} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Dynamic View Zone */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-20">
           {renderContent()}
        </section>

        {/* Live Metrics Floor (Fixed at bottom of page) */}
        <footer className="h-10 bg-slate-900 flex items-center px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] justify-between z-30 shrink-0">
           <div className="flex gap-6">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Platform Logic Active</span>
              <span className="flex items-center gap-2 text-indigo-400"><Server size={10} /> Cluster Shard: AP-SOUTH-1</span>
           </div>
           <div className="flex gap-4">
              <span>{new Date().toLocaleTimeString()}</span>
              <span className="text-slate-600">v4.5.1-CORE</span>
           </div>
        </footer>
      </main>
    </div>
  );
}
