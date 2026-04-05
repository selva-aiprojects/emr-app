import { useMemo, useState } from 'react';
import { BRAND } from '../config/branding.js';
import { 
  AlertCircle, 
  ArrowRight, 
  Activity, 
  Database, 
  Mail, 
  Lock, 
  ChevronRight, 
  HeartPulse, 
  ShieldCheck, 
  Zap, 
  Globe,
  Plus
} from 'lucide-react';

export default function LoginPage({ onLogin, tenants, loading: propLoading, error: propError }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const isLoading = propLoading || internalLoading;
  const error = propError || internalError;

  const tenantOptions = useMemo(() => tenants || [], [tenants]);

  const demoCredentials = {
    superadmin: {
      label: 'Platform Governance',
      email: 'superadmin@emr.local',
      password: 'Admin@123'
    },
    nah: {
      label: 'New Age Hospital',
      email: 'admin@nah.local',
      password: 'Admin@123'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInternalLoading(true);
    setInternalError('');

    if (!credentials.tenantId) {
      setInternalError('Please select a facility to continue.');
      setInternalLoading(false);
      return;
    }

    try {
      const { api } = await import('../api.js');
      const data = await api.login(credentials.tenantId, credentials.email, credentials.password);
      onLogin(data);
    } catch (err) {
      setInternalError(err.message || 'Sign in failed. Please verify your credentials.');
    } finally {
      setInternalLoading(false);
    }
  };

  const setDemoCreds = (key, demo) => {
    const matchedTenant = tenantOptions.find(t =>
      t.name.toLowerCase().includes('new age') ||
      t.code?.toLowerCase() === 'nah' ||
      t.id?.toLowerCase() === 'nah'
    );

    setCredentials({
      tenantId: key === 'superadmin' ? 'superadmin' : (matchedTenant ? (matchedTenant.code || matchedTenant.id) : key),
      email: demo.email,
      password: demo.password
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      {/* Immersive Background Shards */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full" />
        {/* Animated Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-[40px] shadow-2xl shadow-indigo-500/10 border border-white/5 bg-slate-900/40 backdrop-blur-3xl h-full lg:h-[800px]">
        
        {/* Left Side: Brand & Visuals */}
        <div className="lg:col-span-7 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-12">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                 <ShieldCheck className="text-white" size={24} />
               </div>
               <span className="text-xl font-black text-white tracking-tighter uppercase">{BRAND.name}</span>
             </div>

             <div className="space-y-8">
               <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter">
                PRECISION<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-blue-500">OPERATIONS</span><br/>
                MATRIX.
               </h1>
               <p className="text-lg text-slate-400 max-w-md font-medium leading-relaxed">
                Connect to the unified management plane for next-generation clinical workflows and platform governance.
               </p>
             </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-6 pt-12">
             {[
               { icon: Activity, label: 'Real-time Sync', color: 'emerald' },
               { icon: Zap, label: 'High Velocity', color: 'indigo' },
               { icon: Globe, label: 'Cloud Native', color: 'blue' }
             ].map((feature, i) => (
               <div key={i} className="flex flex-col gap-3">
                 <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-${feature.color}-400 border border-white/5 shadow-inner`}>
                   <feature.icon size={20} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{feature.label}</span>
               </div>
             ))}
          </div>

          {/* Decorative Floating Card */}
          <div className="absolute top-1/4 right-0 translate-x-1/2 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl rounded-full" />
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-5 bg-white p-8 lg:p-16 flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto space-y-10">
             <div className="text-center lg:text-left">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none mb-3">Initialize.<br/>Session()</h2>
               <p className="text-sm text-slate-500 font-medium">Verify your administrative identity to proceed.</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Infrastructure Node</label>
                 <div className="relative group">
                   <select
                    name="tenantId"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                    value={credentials.tenantId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, tenantId: e.target.value }))}
                   >
                     <option value="">Select Hospital Node...</option>
                     <option value="superadmin">PLATFORM_ROOT_ADMIN</option>
                     {tenantOptions.map((tenant) => (
                      <option key={tenant.id} value={tenant.code || tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                   </select>
                   <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                   <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" size={16} />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Admin Identity</label>
                 <div className="relative group">
                   <input
                    type="email"
                    placeholder="admin.id@healthezee.core"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    required
                   />
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Secure Key</label>
                 <div className="relative group">
                   <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                   />
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                 </div>
               </div>

               {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight leading-tight">{error}</p>
                </div>
               )}

               <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden relative group"
               >
                 <span className="relative z-10 flex items-center gap-2">
                   {isLoading ? 'Decrypting Access Shard...' : 'Authenticate Protocol'}
                   {!isLoading && <ArrowRight size={16} />}
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
               </button>
             </form>

             <div className="pt-6">
                <button 
                  onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                  className="w-full py-4 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={12} /> Fast Identity Select
                </button>

                {showDemoCredentials && (
                  <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                    {Object.entries(demoCredentials).map(([key, demo]) => (
                      <button
                        key={key}
                        onClick={() => setDemoCreds(key, demo)}
                        className="bg-slate-50 hover:bg-white border border-slate-100 p-4 rounded-xl text-left transition-all hover:shadow-lg group shadow-sm"
                      >
                        <p className="text-[9px] font-black text-slate-900 uppercase leading-none mb-1 group-hover:text-indigo-600">{demo.label}</p>
                        <p className="text-[8px] text-slate-400 truncate">{demo.email}</p>
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <div className="text-center pt-8">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                 © 2026 {BRAND.name} CORE. AP-SOUTH-1. SHARD_4
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
