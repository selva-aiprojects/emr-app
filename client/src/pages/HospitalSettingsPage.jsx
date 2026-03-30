import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Settings, Palette, Image as ImageIcon, Globe, ShieldCheck, Save, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../api.js';

// Error boundary wrapper
export default function HospitalSettingsPage({ tenant, onUpdateTenant }) {
  const { showToast } = useToast();

  try {

  const [form, setForm] = useState({
    displayName: tenant?.name || '',
    primaryColor: tenant?.theme?.primary || '#0f5a6e',
    accentColor: tenant?.theme?.accent || '#f57f17',
    logo_url: tenant?.logo_url || '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tenant) {
      setForm({
        displayName: tenant.name,
        primaryColor: tenant.theme?.primary || '#0f5a6e',
        accentColor: tenant.theme?.accent || '#f57f17',
        logo_url: tenant.logo_url || '',
      });
    }
  }, [tenant]);

  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast({ message: 'Logo must be smaller than 2MB', type: 'error', title: 'File Size' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, logo_url: reader.result });
      showToast({ message: 'Logo processed successfully!', type: 'success', title: 'Branding' });
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError('');

    try {
      const updated = await api.updateTenantSettings(tenant.id, form);
      showToast({ message: 'Institutional Branding Updated Successfully!', type: 'success', title: 'Branding Configuration' });
      console.log('DIAGNOSTIC: showToast called successfully');
      if (onUpdateTenant) onUpdateTenant(updated);
      setStatus('success');
      
      // Update CSS variables real-time
      if (form.primaryColor) {
        document.documentElement.style.setProperty('--clinical-primary', form.primaryColor);
        document.documentElement.style.setProperty('--medical-navy', form.primaryColor);
      }
    } catch (error) {
      console.error('HospitalSettingsPage error:', error);
      setError('Failed to update settings');
      setStatus('error');
      showToast({ message: 'Failed to update hospital settings', type: 'error', title: 'Error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell-premium slide-up">
      <header className="page-header-premium mb-8">
        <div>
          <h1 className="page-title-rich flex items-center gap-3 text-slate-900">
             <Settings className="w-8 h-8 text-[#0077B6]" />
             Institutional Branding & Settings
          </h1>
          <p className="dim-label italic">Customize your hospital's digital identity, theme, and operational configurations.</p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <main className="col-span-12 lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Identity */}
            <section className="clinical-card p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0077B6]">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Facility Identity</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Institutional Display Labels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Facility Display Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={form.displayName}
                    onChange={e => setForm({...form, displayName: e.target.value})}
                    placeholder="e.g. New Age Hospital"
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest leading-none">Institutional Logo</label>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Upload Dropzone */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 w-full p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 hover:border-[#0077B6]/30 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        accept="image/*"
                      />
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-[#0077B6] group-hover:scale-110 transition-all mb-3">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight mb-1">Click to upload logo</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PNG, SVG or JPG (Max 2MB)</p>
                      </div>
                    </div>

                    {/* Preview Area */}
                    <div className="w-full md:w-[200px] flex flex-col items-center">
                      <div className="w-[120px] h-[120px] rounded-3xl border border-slate-100 bg-white p-4 flex items-center justify-center shadow-xl mb-3 overflow-hidden relative group">
                        {form.logo_url ? (
                          <img src={form.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center opacity-20">
                             <ImageIcon size={32} />
                             <span className="text-[9px] font-black uppercase mt-1">No logo</span>
                          </div>
                        )}
                        {form.logo_url && (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setForm({...form, logo_url: ''}); }}
                            className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                        This logo will appear in your sidebar, reports, and invoices.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Or specify a remote URL:</p>
                    <input 
                      type="url" 
                      className="input-field text-xs py-2 bg-slate-50/50"
                      value={form.logo_url?.startsWith('data:') ? '' : form.logo_url}
                      onChange={e => setForm({...form, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="clinical-btn bg-slate-900 text-white px-10 py-4 rounded-2xl shadow-2xl hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Synchronizing...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Persist Changes</>
                    )}
                  </button>
                </div>
              </form>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Theme Colors & Primary Tones</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl border-2 border-slate-50 relative overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Primary Color</label>
                      <input 
                        type="color" 
                        value={form.primaryColor}
                        onChange={e => setForm({...form, primaryColor: e.target.value})}
                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                      />
                   </div>
                   <div 
                    className="h-2 rounded-full w-full opacity-20 mb-2" 
                    style={{ backgroundColor: form.primaryColor }}
                   ></div>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Used for buttons, headers, and UI focal points.</p>
                </div>

                <div className="p-6 rounded-2xl border-2 border-slate-50">
                   <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Accent Tone</label>
                      <input 
                        type="color" 
                        value={form.accentColor}
                        onChange={e => setForm({...form, accentColor: e.target.value})}
                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                      />
                   </div>
                   <div 
                    className="h-2 rounded-full w-full opacity-20 mb-2" 
                    style={{ backgroundColor: form.accentColor }}
                   ></div>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Used for highlights, badges, and secondary actions.</p>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
               <button 
                type="submit" 
                disabled={loading}
                className="clinical-btn bg-slate-900 text-white px-10 py-4 rounded-2xl shadow-2xl hover:bg-slate-700 transition-all disabled:opacity-50"
               >
                 {loading ? (
                   <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Synchronizing...</>
                 ) : (
                   <><Save className="w-4 h-4 mr-2" /> Persist Changes</>
                 )}
               </button>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 animate-slide-in">
                <CheckCircle size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">Environment updated successfully!</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 animate-slide-in">
                <AlertCircle size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

          </form>
        </main>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
           <div className="clinical-card bg-slate-50 border-none p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Environment Preview</h3>
              
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: form.primaryColor }}>
                       <Building2 size={16} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-slate-900 uppercase leading-none">{form.displayName || 'Facility Name'}</div>
                       <div className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mt-1">Institutional Node</div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full w-2/3" style={{ backgroundColor: form.primaryColor }}></div>
                    </div>
                    <div className="h-2 w-1/2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full w-1/3" style={{ backgroundColor: form.accentColor }}></div>
                    </div>
                 </div>

                 <button className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg" style={{ backgroundColor: form.primaryColor }}>
                    Sample Action
                 </button>
              </div>
           </div>

           <div className="clinical-card border-none bg-indigo-900 text-white p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <ShieldCheck className="w-12 h-12 text-indigo-400/50 mb-6" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.15em] mb-3">Institutional Policy</h4>
              <p className="text-[11px] text-indigo-200/70 leading-relaxed font-medium">
                Changes to institutional branding will propagate to all system notifications, billing headers, and portal UI skins across the tenant namespace.
              </p>
           </div>
        </aside>
      </div>
    </div>
  );
}
