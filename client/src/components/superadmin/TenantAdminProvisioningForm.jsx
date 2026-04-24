import React, { useState } from 'react';
import { UserPlus, Mail, Lock, Shield, Loader2, CheckCircle, AlertCircle, Building } from 'lucide-react';

const INITIAL = {
  tenantId: '',
  name: '',
  email: '',
  password: 'Healthezee@2026', // Requested default
};

export default function TenantAdminProvisioningForm({ tenants = [], onProvision }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [errMsg, setErrMsg] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setStatus(null);
  }

  const [provisionedData, setProvisionedData] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tenantId) return;

    setLoading(true);
    setStatus(null);
    setErrMsg('');
    setProvisionedData(null);

    try {
      const result = await onProvision(form.tenantId, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setProvisionedData(result);
      setStatus('success');
      // Keep tenant selected but clear user details
      setForm(prev => ({ ...prev, name: '', email: '', password: 'Healthezee@2026' }));
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Failed to provision admin');
    } finally {
      setLoading(false);
    }
  }

  const selectedTenant = tenants.find(t => t.id === form.tenantId);

  return (
    <section className="clinical-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Admin Provisioning</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Manual root access for hospital nodes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Tenant Selection */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            Select Hospital Node *
          </label>
          <div className="relative">
             <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <select
               name="tenantId"
               value={form.tenantId}
               onChange={handleChange}
               required
               className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 appearance-none font-bold"
             >
               <option value="">-- Choose Tenant --</option>
               {tenants.map(t => (
                 <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
               ))}
             </select>
          </div>
        </div>

        {/* Admin Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                 <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input
                   type="text"
                   name="name"
                   value={form.name}
                   onChange={handleChange}
                   placeholder="e.g. Dr. Jane Smith"
                   required
                   className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                 />
              </div>
           </div>
           <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Auth Email *
              </label>
              <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input
                   type="email"
                   name="email"
                   value={form.email}
                   onChange={handleChange}
                   placeholder="admin@hospital.com"
                   required
                   className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                 />
              </div>
           </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
            <span>Root Password</span>
            <span className="text-indigo-600 lowercase font-bold tracking-tight">Active Policy: Fixed for EMR Waves</span>
          </label>
          <div className="relative">
             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               name="password"
               value={form.password}
               onChange={handleChange}
               required
               className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-mono font-bold text-indigo-700"
             />
          </div>
          <p className="text-[9px] text-slate-400 mt-1 italic font-medium">
            * Shared with tenant admin manually until notification service is restored.
          </p>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold text-xs tracking-tight">Access provisioned for {selectedTenant?.name}!</span>
            </div>
            
            {provisionedData && (
              <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xl animate-in fade-in zoom-in duration-300">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                  Manual Provisioning Result
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Name:</span>
                      <span className="text-xs font-bold text-slate-100">{provisionedData.user?.name}</span>
                   </div>
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Email:</span>
                      <span className="text-xs font-mono font-bold text-slate-100">{provisionedData.user?.email}</span>
                   </div>
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Password:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{provisionedData.defaultPassword}</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="font-semibold text-xs">{errMsg}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.tenantId || !form.name || !form.email}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning Node...</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Finalize Provisioning</>
          )}
        </button>
      </form>
    </section>
  );
}
