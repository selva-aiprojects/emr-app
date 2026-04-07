import React, { useState } from 'react';
import { 
  Building2, 
  UserPlus, 
  Key, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  X,
  History,
  Lock
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { superadminService } from '../../services/superadmin.service.js';
import TenantCreationForm from './TenantCreationForm.jsx';

const TIERS = [
  { value: 'Free', color: 'slate', icon: '🆓' },
  { value: 'Basic', color: 'indigo', icon: '🩺' },
  { value: 'Professional', color: 'emerald', icon: '⭐' },
  { value: 'Enterprise', color: 'rose', icon: '🏢' },
];

export default function TenantControlCenter({ tenants = [], onRefresh }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('active_tenants');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const stats = [
    { label: 'Network Nodes', value: tenants.length, icon: Building2, color: 'indigo' },
    { label: 'Identity Clusters', value: tenants.length * 2, icon: ShieldCheck, color: 'emerald' },
    { label: 'Pending Shards', value: 3, icon: AlertTriangle, color: 'amber' },
  ];

  const handleResetPassword = async (t) => {
    const password = prompt("Enter new master password for " + t.name);
    if (!password) return;

    try {
      showToast({ message: `Initiating secure master password reset for ${t.name}...`, type: 'info' });
      await superadminService.resetUserPassword(t.code, `admin@${t.subdomain}.com`, password);
      showToast({ message: `Identity vault reset successful for ${t.name}.`, type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Reset Failed' });
    }
  };

  const handleAddAdmin = async (t) => {
    const name = prompt("Enter new admin name for " + t.name);
    const email = prompt("Enter new admin email (e.g. support@" + t.subdomain + ".com)");
    const password = prompt("Enter password");
    if (!name || !email || !password) return;

    try {
       showToast({ message: `Provisioning new identity for ${t.name}...`, type: 'info' });
       await superadminService.provisionAdmin(t.code, { name, email, password, roleName: 'Admin' });
       showToast({ message: `Admin identity successfully mapped to ${t.name}.`, type: 'success' });
    } catch (err) {
       showToast({ message: err.message, type: 'error', title: 'Identity Fail' });
    }
  }

  const handleProvision = async (data) => {
    try {
      showToast({ 
        message: `Initializing Shard [${data.code}] on Cluster Node...`, 
        type: 'info' 
      });

      const result = await superadminService.provisionTenant({
        name: data.name,
        code: data.code,
        subdomain: data.subdomain,
        contactEmail: data.contactEmail,
        adminLoginEmail: data.adminLoginEmail,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
      }, {
        email: data.adminLoginEmail || `admin@${data.subdomain}.com`,
        name: `${data.name} Admin`,
        password: "Medflow@2026" // Default protocol
      });

      showToast({ 
        message: `Healthcare Grid Shard [${data.code}] successfully provisioned and registry linked!`, 
        type: 'success',
        title: 'Sharding Complete'
      });

      setIsProvisioning(false);
      onRefresh?.();
      return result;
    } catch (err) {
      showToast({ 
        message: err.message, 
        type: 'error', 
        title: 'Provisioning Failed' 
      });
      throw err;
    }
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Metrics Row */}
      <header className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
               <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center`}>
                  <s.icon size={28} />
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</h4>
                  <p className="text-3xl font-black text-slate-900 tabular-nums">{s.value}</p>
               </div>
            </div>
         ))}
      </header>

      {/* Control Tabs */}
      <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <header className="px-10 py-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-50/10">
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
               {[
                  { id: 'active_tenants', label: 'Nodes List', icon: Building2 },
                  { id: 'admin_users', label: 'Identity Access', icon: Lock },
                  { id: 'reset_protocol', label: 'Reset Vault', icon: History }
               ].map((tab) => (
                  <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                           ? 'bg-white text-indigo-600 shadow-md' 
                           : 'text-slate-500 hover:bg-white/50'
                     }`}
                  >
                     <tab.icon size={12} /> {tab.label}
                  </button>
               ))}
            </div>
            <button 
               onClick={() => setIsProvisioning(true)}
               className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-2"
            >
               <Plus size={14} /> Provision New Hospital Shard
            </button>
         </header>

         {/* Content Table Area */}
         <div className="p-4 md:p-10">
            {activeTab === 'active_tenants' && (
               <div className="overflow-x-auto min-w-[800px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {tenants.map((t, idx) => {
                        const tier = TIERS.find(tier => tier.value === t.subscriptionTier) || TIERS[0];
                        return (
                           <div key={t.id || idx} className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500 relative">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black text-indigo-600 shadow-sm uppercase group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    {t.name?.slice(0, 2)}
                                 </div>
                                 <div className={`px-3 py-1 rounded-full bg-${tier.color}-100 text-${tier.color}-600 text-[8px] font-black uppercase tracking-widest border border-${tier.color}-200`}>
                                    {tier.icon} {t.subscriptionTier || 'Standard'}
                                 </div>
                              </div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{t.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-8">{t.subdomain}.healthezee.app</p>
                              
                              <div className="flex items-center gap-2 pt-4 border-t border-white/50">
                                 <button onClick={() => handleResetPassword(t)} className="flex-1 py-3 bg-white text-slate-600 hover:text-indigo-600 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-md flex items-center justify-center gap-2">
                                    <Key size={12} /> Reset PWD
                                 </button>
                                 <button className="flex-1 py-3 bg-white text-slate-600 hover:text-emerald-600 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-md flex items-center justify-center gap-2">
                                    <UserPlus size={12} /> Add Admin
                                 </button>
                                 <button className="p-3 bg-white text-slate-300 hover:text-rose-500 border border-slate-100 rounded-xl transition-all">
                                    <Trash2 size={14} />
                                 </button>
                              </div>

                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ArrowUpRight size={16} className="text-slate-300" />
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}
            
            {activeTab === 'admin_users' && (
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="border-b border-slate-50">
                              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Admin Entity</th>
                              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Identity Node</th>
                              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Access Level</th>
                              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {tenants.slice(0, 5).map((t, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                 <td className="p-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                          <UserPlus size={16} className="text-slate-400" />
                                       </div>
                                       <div>
                                          <p className="text-xs font-black text-slate-900 uppercase">Hospital Admin - {i+1}</p>
                                          <p className="text-[10px] font-bold text-slate-400 lowercase">admin.{t.code || 'SYS'}@healthezee.app</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-6 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">{t.code || 'SYS'}</span>
                                 </td>
                                 <td className="p-6 text-right">
                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Root Authority</span>
                                 </td>
                                 <td className="p-6 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                       <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="space-y-6">
                     <div className="bg-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Identity Protocol</h4>
                        <p className="text-sm font-medium text-indigo-100 leading-relaxed mb-6">Provisioning an Admin generates a unique key assigned to the hospital shard.</p>
                        <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors">Start Key Gen</button>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'reset_protocol' && (
               <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 rounded-[32px] bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-100 group hover:rotate-6 transition-transform">
                     <History size={40} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Global Identity Reset Vault</h3>
                     <p className="text-sm text-slate-500 font-medium max-w-[400px] mx-auto leading-relaxed">System-wide reset of admin credentials for specific healthcare nodes. Logs are permanently recorded in the immutable audit shard.</p>
                  </div>
                  <div className="flex flex-col gap-3 max-w-[320px] mx-auto">
                     <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors shadow-xl">Protocol Force-Reset</button>
                     <button className="w-full py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all">Audit Reset Records</button>
                  </div>
               </div>
            )}
         </div>
      </section>

      {/* Provisioning Modal */}
      {isProvisioning && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 rounded-[48px] w-full max-w-4xl relative shadow-2xl animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
               <div className="flex justify-between items-center p-8 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                        <Plus size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Shard Provisioning</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Initialization: AP-SOUTH-1-CLUSTER</p>
                     </div>
                  </div>
                  <button onClick={() => setIsProvisioning(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                     <X size={20} className="text-slate-400" />
                  </button>
               </div>
               
               <div className="p-8 max-h-[85vh] overflow-y-auto">

                  <TenantCreationForm onCreate={handleProvision} />
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
