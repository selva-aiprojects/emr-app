import React, { useState } from 'react';
import { 
  Building2, Hash, Globe, Palette, Star, 
  Loader2, CheckCircle, AlertCircle, Cpu, 
  Mail, ShieldCheck, Zap, Activity, Layers, 
  Box, Crown, Check, Shield, Server,
  Lock, ArrowRight, Dna, ArrowLeft
} from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import { superadminService } from '../services/superadmin.service.js';

const TIERS = [
  { value: 'Basic',        label: 'Basic',        color: 'slate',    icon: Box, price: '1999' },
  { value: 'Standard',     label: 'Standard',     color: 'blue',     icon: ShieldCheck, price: '4999' },
  { value: 'Professional', label: 'Professional', color: 'indigo',   icon: Zap, price: '7999' },
  { value: 'Enterprise',   label: 'Enterprise',   color: 'rose',     icon: Crown, price: '14999' },
];

const INITIAL = {
  name: '',
  code: '',
  subdomain: '',
  contactEmail: 'b.selvakumar@gmail.com',
  adminLoginEmail: '',
  subscriptionTier: 'Professional',
  primaryColor: '#6366f1',
  accentColor: '#f43f5e',
  heroColor: '#1e293b',
  textColor: '#334155',
};

export default function TenantCreationPage({ setView }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [errMsg, setErrMsg] = useState('');
  const [provisionedData, setProvisionedData] = useState(null);

  
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'name') {
        const slug = value.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase().split(/\s+/).map(w => w[0] || '').join('').slice(0, 5);
        const sub  = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
        if (!prev._codeManual)      next.code      = slug;
        if (!prev._subManual)       next.subdomain = sub;
      }
      if (name === 'subdomain' && !prev._adminEmailManual) {
        next.adminLoginEmail = `admin@${value.toLowerCase() || 'hospital'}.com`;
      }
      if (name === 'adminLoginEmail') next._adminEmailManual = true;
      if (name === 'code')      next._codeManual = true;
      if (name === 'subdomain') next._subManual  = true;
      return next;
    });
    setStatus(null);
  }

  const resetForm = () => {
    setForm(INITIAL);
    setStatus(null);
    setProvisionedData(null);
    setErrMsg('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrMsg('');
    setProvisionedData(null);

    try {
      const result = await superadminService.provisionTenant({
        ...form
      }, {
        email: form.adminLoginEmail || `admin@${form.subdomain}.com`,
        name: `${form.name} Admin`,
        password: "Medflow@2026"
      });
      setProvisionedData(result);
      setStatus('success');
      showToast({ message: `Tenant ${form.code} created successfully!`, type: 'success' });
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Failed to create tenant');
      showToast({ message: err.message || 'Failed to create tenant', type: 'error', title: 'Creation Failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('superadmin')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Control Center</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Dna size={16} />
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Institutional Shard Provisioning</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-12">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* SHARD IDENTITY SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="col-span-full space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Dna size={16} />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Nominal Identity</h4>
                  </div>
                  <input 
                    type="text" 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="E.G. MAYO CLINIC CENTRAL SHARD" 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-[14px] font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-300 uppercase tracking-tight transition-all" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Shard Code (Unique)</label>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-indigo-400" />
                    <input 
                      type="text" 
                      name="code" 
                      value={form.code} 
                      onChange={handleChange} 
                      placeholder="MAY-01" 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-[13px] font-black text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500/50 uppercase font-mono tracking-widest placeholder:text-slate-300 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Subdomain Route</label>
                  <div className="relative group flex items-center bg-slate-50 border border-slate-200 rounded-2xl pr-6 transition-all focus-within:ring-1 focus-within:ring-indigo-500/50">
                    <Globe className="ml-4 w-4 h-4 text-slate-700 group-focus-within:text-indigo-400" />
                    <input 
                      type="text" 
                      name="subdomain" 
                      value={form.subdomain} 
                      onChange={handleChange} 
                      placeholder="mayo-central" 
                      required 
                      className="flex-1 bg-transparent py-4 pl-4 text-[13px] font-black text-slate-800 outline-none lowercase font-mono placeholder:text-slate-300" 
                    />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">.emr.care</span>
                  </div>
                </div>
              </div>

              {/* GOVERNANCE SHARDS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Shield size={120} strokeWidth={1} />
                </div>
                
                <div className="space-y-4 relative z-10">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Board Dispatch (EMAIL)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <input 
                      type="email" 
                      name="contactEmail" 
                      value={form.contactEmail} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-[12px] font-black text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500/50" 
                    />
                  </div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.1em] italic">System credentials relay target</p>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] block">Root Identity (LOGIN)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <input 
                      type="email" 
                      name="adminLoginEmail" 
                      value={form.adminLoginEmail} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-[12px] font-black text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500/50" 
                    />
                  </div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.1em] italic">Primary authentication nexus</p>
                </div>
              </div>

              
              {/* SHARDING TIER SELECTION */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Deployment Capacity Shard</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {TIERS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, subscriptionTier: t.value }))}
                      className={`p-6 rounded-[2rem] border transition-all relative flex flex-col items-center text-center gap-3 group ${
                        form.subscriptionTier === t.value 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_25px_rgba(79,70,229,0.2)] scale-105 z-10' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        form.subscriptionTier === t.value ? 'bg-white/20 text-white' : 'bg-white/[0.03] text-slate-500 group-hover:text-indigo-400'
                      }`}>
                        <t.icon size={20} />
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-widest">{t.label}</div>
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${
                        form.subscriptionTier === t.value ? 'opacity-100 text-white' : 'opacity-40'
                      }`}>{t.price}</div>
                      {form.subscriptionTier === t.value && (
                        <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                          <Check size={12} className="text-white font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* VISUAL SHARDS */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Visual Identity Configuration</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="group bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col items-center hover:border-indigo-200 transition-all shadow-sm">
                    <div className="relative mb-4">
                      <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange} className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent relative z-10" />
                      <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" style={{ backgroundColor: form.primaryColor }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Primary</p>
                      <p className="text-[12px] font-black text-slate-900 uppercase tabular-nums tracking-widest">{form.primaryColor}</p>
                    </div>
                  </div>

                  <div className="group bg-white border border-slate-200 p-6 rounded-[2.5rem] flex flex-col items-center hover:border-rose-200 transition-all shadow-sm">
                    <div className="relative mb-4">
                      <input type="color" name="accentColor" value={form.accentColor} onChange={handleChange} className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent relative z-10" />
                      <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" style={{ backgroundColor: form.accentColor }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Accent</p>
                      <p className="text-[14px] font-black text-slate-900 uppercase tabular-nums tracking-widest">{form.accentColor}</p>
                    </div>
                  </div>

                  <div className="group bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col items-center hover:border-emerald-200 transition-all shadow-sm">
                    <div className="relative mb-4">
                      <input type="color" name="heroColor" value={form.heroColor} onChange={handleChange} className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent relative z-10" />
                      <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" style={{ backgroundColor: form.heroColor }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Hero</p>
                      <p className="text-[14px] font-black text-slate-900 uppercase tabular-nums tracking-widest">{form.heroColor}</p>
                    </div>
                  </div>

                  <div className="group bg-white border border-slate-200 p-6 rounded-[2.5rem] flex flex-col items-center hover:border-slate-400 transition-all shadow-sm">
                    <div className="relative mb-4">
                      <input type="color" name="textColor" value={form.textColor} onChange={handleChange} className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent relative z-10" />
                      <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" style={{ backgroundColor: form.textColor }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Text</p>
                      <p className="text-[14px] font-black text-slate-900 uppercase tabular-nums tracking-widest">{form.textColor}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBMISSION BLOCK */}
              <div className="pt-10 border-t border-slate-200 flex flex-col gap-6">
                {status === 'success' && provisionedData ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-10 animate-in zoom-in-95 duration-500 shadow-sm">
                    <header className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-emerald-500" />
                        <span className="text-[14px] font-black text-emerald-600 uppercase tracking-[0.2em] italic">Shard Activated</span>
                      </div>
                    </header>
                    <div className="grid grid-cols-2 gap-10 mb-8">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Root ID</p>
                        <p className="text-[14px] font-black text-slate-900 font-mono break-all">{provisionedData.adminLoginEmail}</p>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credential Token</p>
                        <code className="text-[14px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">MedFlow@2024</code>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={resetForm}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-md"
                      >
                        Create Another Shard
                      </button>
                      <button 
                        onClick={() => setView('superadmin')}
                        className="flex-1 py-4 bg-slate-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-500 transition-all shadow-md"
                      >
                        Return to Control Center
                      </button>
                    </div>
                  </div>
                ) : status === 'error' ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 animate-in slide-in-from-top-4 duration-300 shadow-sm">
                    <div className="flex items-center gap-4 text-rose-600">
                      <AlertCircle size={24} />
                      <div>
                        <h4 className="text-[14px] font-black uppercase tracking-tighter italic">Deployment Intercepted</h4>
                        <p className="text-[11px] font-bold text-rose-500/80 leading-tight mt-1">{errMsg}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full py-6 rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn ${
                      loading 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-xl shadow-indigo-100 border border-slate-900'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span className="relative z-10 italic">Initializing Shard Protocol...</span>
                      </>
                    ) : (
                      <>
                        <Box size={22} className="group-hover/btn:rotate-12 transition-transform" />
                        <span className="relative z-10">Deploy Institutional Shard</span>
                        <ArrowRight size={22} className="group-hover/btn:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
