import React from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Building2, 
  Bed, 
  Truck, 
  Droplet, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Activity,
  Layers,
  Settings,
  ChevronRight,
  Database
} from 'lucide-react';
import '../styles/critical-care.css';

export default function AdminMastersPage({ tenant, onViewChange }) {
  const { showToast } = useToast();

  const masterModules = [
    {
      id: 'departments',
      name: 'Department Shards',
      description: 'Clinical specialties, operational HODs, and ward assignments.',
      icon: Building2,
      color: 'indigo',
      count: 'Master Registry',
      path: 'departments'
    },
    {
      id: 'bed_management',
      name: 'Bed & Ward Matrix',
      description: 'Physical infrastructure layout, occupancy tracking, and ward rates.',
      icon: Bed,
      color: 'emerald',
      count: 'Infrastructure',
      path: 'bed_management'
    },
    {
      id: 'service_catalog',
      name: 'Global Service Catalog',
      description: 'Standardized pricing for labs, procedures, and clinical consults.',
      icon: CreditCard,
      color: 'blue',
      count: 'Revenue Cycle',
      path: 'service_catalog'
    },
    {
      id: 'ambulance',
      name: 'Ambulance Fleet',
      description: 'Vehicle dispatch, fleet status, and emergency response logistics.',
      icon: Truck,
      color: 'amber',
      count: 'Logistics',
      path: 'ambulance'
    },
    {
      id: 'donor_management',
      name: 'Blood Bank Registry',
      description: 'Inventory management of blood units, donor screening, and requests.',
      icon: Droplet,
      color: 'rose',
      count: 'Clinical Reserve',
      path: 'donor_management'
    },
    {
      id: 'insurance',
      name: 'Insurance Providers',
      description: 'TPA management, coverage policies, and claim bridge configuration.',
      icon: ShieldCheck,
      color: 'cyan',
      count: 'Financial Ease',
      path: 'insurance'
    }
  ];

  return (
    <div className="page-shell-premium slide-up">
      <header className="page-header-premium mb-12 border-b border-slate-100 pb-8">
        <div>
          <h1 className="page-title-rich flex items-center gap-3">
             <Database className="w-8 h-8 text-slate-900" />
             Institutional Master Data Hub
          </h1>
          <p className="dim-label italic">Centralized control center for {tenant?.name}'s core operational constraints and master registries.</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
           <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
           Live Data Synchronization Active
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {masterModules.map((module) => {
          const Icon = module.icon;
          return (
            <article 
              key={module.id} 
              className="clinical-card group hover:bg-slate-900 hover:scale-[1.02] transition-all relative overflow-hidden flex flex-col cursor-pointer"
              onClick={() => onViewChange(module.path)}
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${module.color}-50 group-hover:bg-white/5 rounded-full -mr-16 -mt-16 transition-all duration-700`}></div>
              
              <div className="relative z-10 flex-1">
                <header className="flex items-start justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl bg-${module.color}-50 text-${module.color}-600 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center shadow-sm transition-all duration-500`}>
                    <Icon size={28} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-${module.color}-50 text-${module.color}-700 group-hover:bg-white/5 group-hover:text-white/60 transition-all`}>
                    {module.count}
                  </span>
                </header>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                    {module.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-sm font-medium text-slate-500 group-hover:text-slate-400 leading-relaxed mb-8">
                    {module.description}
                  </p>
                </div>
              </div>

              <footer className="relative z-10 flex items-center justify-between pt-6 border-t border-slate-50 group-hover:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white/40">
                  Configure Standards
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white/80 transition-all" />
              </footer>
            </article>
          );
        })}
      </div>

      {/* Analytics Insight Card */}
      <footer className="mt-16 bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col md:flex-row items-center gap-10">
         <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-900 shrink-0">
            <Layers className="w-10 h-10" />
         </div>
         <div className="flex-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Architectural Integrity</h4>
            <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">
              Master data defines the structural constraints of your facility. Ensure all departments, wards, and services are accurately mapped to maintain clinical reporting accuracy and billing consistency.
            </p>
         </div>
         <button className="clinical-btn bg-slate-900 text-white px-8 h-14 rounded-2xl whitespace-nowrap uppercase text-[10px] font-black tracking-widest hover:bg-slate-700 transition-all shadow-xl">
            <Settings className="w-4 h-4 mr-2" /> Global System Config
         </button>
      </footer>
    </div>
  );
}
