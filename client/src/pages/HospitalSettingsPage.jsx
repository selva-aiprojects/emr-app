import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import {
  Settings,
  Image as ImageIcon,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  Wallet
} from 'lucide-react';
import { api } from '../api.js';

export default function HospitalSettingsPage({ tenant, onUpdateTenant }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    displayName: tenant?.name || '',
    primaryColor: tenant?.theme?.primary || '#0f5a6e',
    accentColor: tenant?.theme?.accent || '#f57f17',
    heroColor: tenant?.theme?.hero || '#1e293b',
    textColor: tenant?.theme?.text || '#334155',
    logo_url: tenant?.logo_url || '',
    features: {
      inventory: tenant?.features?.inventory ?? true,
      telehealth: tenant?.features?.telehealth ?? false,
      payroll: tenant?.features?.payroll ?? true,
      staff_governance: tenant?.features?.staff_governance ?? true,
      institutional_ledger: tenant?.features?.institutional_ledger ?? true
    },
    billingConfig: {
      provider: tenant?.billingConfig?.provider || tenant?.billing_config?.provider || 'Stripe',
      currency: tenant?.billingConfig?.currency || tenant?.billing_config?.currency || 'INR',
      gatewayKey: tenant?.billingConfig?.gatewayKey || tenant?.billing_config?.gatewayKey || '',
      accountStatus: tenant?.billingConfig?.accountStatus || tenant?.billing_config?.accountStatus || 'unlinked'
    }
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [hasSavedChanges, setHasSavedChanges] = useState(false);
  const [catalog, setCatalog] = useState({ plans: [], modules: [] });

  useEffect(() => {
    api.get('/tenants/subscription-catalog').then(res => {
      if (res && res.plans) setCatalog(res);
    }).catch(e => console.warn('Catalog restricted', e));
  }, []);

  useEffect(() => {
    // Reset hasSavedChanges when tenant changes (including session updates)
    if (tenant) {
      setHasSavedChanges(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    // Apply theme colors to CSS variables whenever form changes
    const root = document.documentElement;
    root.style.setProperty('--clinical-primary', form.primaryColor);
    root.style.setProperty('--clinical-accent', form.accentColor);
    root.style.setProperty('--clinical-hero', form.heroColor);
    root.style.setProperty('--clinical-text', form.textColor);
    root.style.setProperty('--medical-navy', form.primaryColor);
    root.style.setProperty('--clinical-primary-dark', form.primaryColor);
    root.style.setProperty('--clinical-blue', form.accentColor);
    root.style.setProperty('--clinical-accent-soft', form.accentColor + '1A');
  }, [form.primaryColor, form.accentColor, form.heroColor, form.textColor]);

  useEffect(() => {
    // Only initialize form from tenant prop if no changes have been saved yet
    if (tenant && !hasSavedChanges) {
      setForm({
        displayName: tenant?.name || '',
        primaryColor: tenant?.theme?.primary || '#0f5a6e',
        accentColor: tenant?.theme?.accent || '#f57f17',
        heroColor: tenant?.theme?.hero || '#1e293b',
        textColor: tenant?.theme?.text || '#334155',
        logo_url: tenant?.logo_url || '',
        features: {
          inventory: tenant?.features?.inventory ?? true,
          telehealth: tenant?.features?.telehealth ?? false,
          payroll: tenant?.features?.payroll ?? true,
          staff_governance: tenant?.features?.staff_governance ?? true,
          institutional_ledger: tenant?.features?.institutional_ledger ?? true
        },
        billingConfig: {
          provider: tenant?.billingConfig?.provider || tenant?.billing_config?.provider || 'Stripe',
          currency: tenant?.billingConfig?.currency || tenant?.billing_config?.currency || 'INR',
          gatewayKey: tenant?.billingConfig?.gatewayKey || tenant?.billing_config?.gatewayKey || '',
          accountStatus: tenant?.billingConfig?.accountStatus || tenant?.billing_config?.accountStatus || 'unlinked'
        }
      });
      
      // Apply CSS variables during initial load
      const root = document.documentElement;
      if (tenant?.theme?.primary) {
        root.style.setProperty('--clinical-primary', tenant.theme.primary);
        root.style.setProperty('--medical-navy', tenant.theme.primary);
      }
      if (tenant?.theme?.accent) {
        root.style.setProperty('--clinical-accent', tenant.theme.accent);
      }
      if (tenant?.theme?.hero) {
        root.style.setProperty('--clinical-hero', tenant.theme.hero);
      }
      if (tenant?.theme?.text) {
        root.style.setProperty('--clinical-text', tenant.theme.text);
      }
    }
  }, [tenant, hasSavedChanges]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast({ message: 'Logo must be smaller than 2MB', type: 'error', title: 'File Size' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, logo_url: reader.result }));
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
      const payload = {
        displayName: form.displayName,
        logo_url: form.logo_url,
        theme: {
          primary: form.primaryColor,
          accent: form.accentColor,
          hero: form.heroColor,
          text: form.textColor
        },
        billingConfig: form.billingConfig
      };

      const updated = await api.patch(`/tenants/${tenant?.id}/settings`, payload);

      showToast({
        message: 'Institutional Environment Synchronized!',
        type: 'success',
        title: 'Governance Configuration',
      });

      if (onUpdateTenant) onUpdateTenant(updated);
      setStatus('success');

      // Update the form with the latest data from the server response
      if (updated) {
        setForm({
          displayName: updated.name || '',
          primaryColor: updated.theme?.primary || '#0f5a6e',
          accentColor: updated.theme?.accent || '#f57f17',
          heroColor: updated.theme?.hero || '#1e293b',
          textColor: updated.theme?.text || '#334155',
          logo_url: updated.logo_url || '',
          features: {
            inventory: updated.features?.inventory ?? true,
            telehealth: updated.features?.telehealth ?? false,
            payroll: updated.features?.payroll ?? true,
            staff_governance: updated.features?.staff_governance ?? true,
            institutional_ledger: updated.features?.institutional_ledger ?? true
          },
          billingConfig: {
            provider: updated.billingConfig?.provider || updated.billing_config?.provider || 'Stripe',
            currency: updated.billingConfig?.currency || updated.billing_config?.currency || 'INR',
            gatewayKey: updated.billingConfig?.gatewayKey || updated.billing_config?.gatewayKey || '',
            accountStatus: updated.billingConfig?.accountStatus || updated.billing_config?.accountStatus || 'unlinked'
          }
        });
        
        // Mark that changes have been saved to prevent form re-initialization
        setHasSavedChanges(true);
      }

      const root = document.documentElement;
      // Use the updated form data for CSS variables
      if (updated?.theme?.primary) {
        root.style.setProperty('--clinical-primary', updated.theme.primary);
        root.style.setProperty('--medical-navy', updated.theme.primary);
      }
      if (updated?.theme?.accent) root.style.setProperty('--clinical-accent', updated.theme.accent);
      if (updated?.theme?.hero) root.style.setProperty('--clinical-hero', updated.theme.hero);
      if (updated?.theme?.text) root.style.setProperty('--clinical-text', updated.theme.text);
    } catch (err) {
      console.error('HospitalSettingsPage error:', err);
      setError('Failed to update institutional configuration');
      setStatus('error');
      showToast({ message: 'Resource Synchronization Failed', type: 'error', title: 'Platform Hub' });
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
          <p className="dim-label italic">Customize hospital digital identity, theme, and operational configurations.</p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <main className="col-span-12 lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="clinical-card p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0077B6]"><Building2 size={20} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Facility Identity</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Institutional Display Labels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Facility Display Name</label>
                  <input type="text" className="input-field" value={form.displayName} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} placeholder="e.g. New Age Hospital" required />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest leading-none">Institutional Logo</label>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div onClick={() => fileInputRef.current?.click()} className="flex-1 w-full p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 hover:border-[#0077B6]/30 transition-all cursor-pointer group relative overflow-hidden">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-[#0077B6] group-hover:scale-110 transition-all mb-3"><ImageIcon size={24} /></div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight mb-1">Click to upload logo</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PNG, SVG or JPG (Max 2MB)</p>
                      </div>
                    </div>
                    <div className="w-full md:w-[200px] flex flex-col items-center">
                      <div className="w-[120px] h-[120px] rounded-3xl border border-slate-100 bg-white p-4 flex items-center justify-center shadow-xl mb-3 overflow-hidden relative group">
                        {form.logo_url ? <img src={form.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" /> : <div className="flex flex-col items-center opacity-20"><ImageIcon size={32} /><span className="text-[9px] font-black uppercase mt-1">No logo</span></div>}
                        {form.logo_url && <button type="button" onClick={(e) => { e.stopPropagation(); setForm((prev) => ({ ...prev, logo_url: '' })); }} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Remove</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="clinical-card p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#f57f17]"><Settings size={20} /></div>
                <div><h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Theme Customization</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Theme Colors & Primary Tones</p></div>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-4 rounded-2xl border-2 border-slate-50 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase">Primary</label>
                  <input 
                    type="color" 
                    value={form.primaryColor} 
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setForm(p => ({ ...p, primaryColor: newColor }));
                      // Apply real-time preview to all relevant CSS variables
                      document.documentElement.style.setProperty('--clinical-primary', newColor);
                      document.documentElement.style.setProperty('--medical-navy', newColor);
                      document.documentElement.style.setProperty('--clinical-primary-dark', newColor);
                      // Force a reflow to ensure the changes take effect
                      document.documentElement.offsetHeight;
                    }} 
                  />
                </div>
                <div className="p-4 rounded-2xl border-2 border-slate-50 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase">Accent</label>
                  <input 
                    type="color" 
                    value={form.accentColor} 
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setForm(p => ({ ...p, accentColor: newColor }));
                      // Apply real-time preview to all relevant CSS variables
                      document.documentElement.style.setProperty('--clinical-accent', newColor);
                      document.documentElement.style.setProperty('--clinical-blue', newColor);
                      document.documentElement.style.setProperty('--clinical-accent-soft', newColor + '1A');
                      // Force a reflow
                      document.documentElement.offsetHeight;
                    }} 
                  />
                </div>
                <div className="p-4 rounded-2xl border-2 border-slate-50 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase">Hero</label>
                  <input 
                    type="color" 
                    value={form.heroColor} 
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setForm(p => ({ ...p, heroColor: newColor }));
                      // Apply real-time preview
                      document.documentElement.style.setProperty('--clinical-hero', newColor);
                      // Force a reflow
                      document.documentElement.offsetHeight;
                    }} 
                  />
                </div>
                <div className="p-4 rounded-2xl border-2 border-slate-50 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase">Text</label>
                  <input 
                    type="color" 
                    value={form.textColor} 
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setForm(p => ({ ...p, textColor: newColor }));
                      // Apply real-time preview
                      document.documentElement.style.setProperty('--clinical-text', newColor);
                      // Force a reflow
                      document.documentElement.offsetHeight;
                    }} 
                  />
                </div>
              </div>
            </section>

            <section className="clinical-card p-8">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Wallet size={20} /></div>
                 <div><h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Billing & Gateway</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Revenue Shard Configuration</p></div>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Provider</label>
                     <select className="input-field" value={form.billingConfig.provider} onChange={e => setForm(p => ({ ...p, billingConfig: { ...p.billingConfig, provider: e.target.value } }))}>
                        <option>Stripe</option><option>PayPal</option><option>Razorpay</option><option>Manual</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Currency</label>
                     <select className="input-field" value={form.billingConfig.currency} onChange={e => setForm(p => ({ ...p, billingConfig: { ...p.billingConfig, currency: e.target.value } }))}>
                        <option>INR</option><option>USD</option><option>EUR</option>
                     </select>
                  </div>
               </div>
               <div className="mt-6">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Gateway Logic Key</label>
                  <input type="password" className="input-field" placeholder="sk_test_..." value={form.billingConfig.gatewayKey} onChange={e => setForm(p => ({ ...p, billingConfig: { ...p.billingConfig, gatewayKey: e.target.value, accountStatus: e.target.value ? 'linked' : 'unlinked' } }))} />
               </div>
            </section>

            <section className="clinical-card p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><ShieldCheck size={20} /></div>
                  <div><h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Subscription Matrix</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Platform Feature Access (Contact Nexus Superadmin for changes)</p></div>
                </div>
                <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Tier</label>
                  <div className="input-field bg-white/50 cursor-not-allowed">
                    {tenant?.subscription_tier || 'Professional'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(catalog.modules.length > 0 ? catalog.modules : [
                  { key: 'inventory', label: 'Pharmacy Hub' },
                  { key: 'telehealth', label: 'Telemedicine' },
                  { key: 'payroll', label: 'Payroll Hub' },
                  { key: 'staff_governance', label: 'Staff Governance' },
                  { key: 'institutional_ledger', label: 'Institutional Ledger' }
                ]).map(f => {
                  const plansWithFeature = catalog.plans.filter(p => (p.moduleKeys || []).includes(f.key));
                  const myPlanTier = (tenant?.subscription_tier || 'Professional').toLowerCase();
                  const myPlanObj = catalog.plans.find(p => p.id === myPlanTier);
                  
                  // If catalog didn't load gracefully fallback to enabling all
                  const hasAccess = catalog.plans.length === 0 || (myPlanObj && (myPlanObj.moduleKeys || []).includes(f.key));
                  const minPlan = plansWithFeature.length > 0 ? plansWithFeature[0] : null;

                  return (
                    <div key={f.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${hasAccess ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50/30 border-dashed border-slate-200 opacity-60 grayscale cursor-not-allowed'}`}>
                      <div>
                        <span className="text-[10px] font-black text-slate-800 uppercase block">{f.label}</span>
                        {!hasAccess && minPlan && (
                           <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Requires {minPlan.name} Plan</span>
                        )}
                        {hasAccess && (
                           <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] opacity-50">Included</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${!hasAccess ? 'bg-slate-200' : form.features[f.key] ? 'bg-emerald-500' : 'bg-slate-300'} cursor-not-allowed opacity-75`}>
                          <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${form.features[f.key] && hasAccess ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            // Create feature request
                            const requestMessage = `Feature Request from ${tenant?.name}:\n\nFeature: ${f.label}\nKey: ${f.key}\nCurrent Status: ${form.features[f.key] ? 'Enabled' : 'Disabled'}\n\nPlease review and approve this feature request.\n\nSent: ${new Date().toLocaleString()}`;
                            
                            // Copy to clipboard for easy sending
                            navigator.clipboard.writeText(requestMessage).then(() => {
                              showToast({
                                message: 'Feature request copied to clipboard! Send to Nexus Superadmin.',
                                type: 'info',
                                title: 'Feature Request'
                              });
                            }).catch(() => {
                              // Fallback: show modal with request text
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
                              modal.innerHTML = `
                                <div class="bg-white rounded-xl p-6 max-w-md w-full">
                                  <h3 class="text-lg font-bold mb-4">Feature Request</h3>
                                  <p class="text-sm text-gray-600 mb-4">Send this request to Nexus Superadmin:</p>
                                  <textarea class="w-full p-3 border rounded-lg text-sm" rows="8" readonly>${requestMessage}</textarea>
                                  <button onclick="this.closest('.fixed').remove()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Close</button>
                                </div>
                              `;
                              document.body.appendChild(modal);
                            });
                          }}
                          className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <button type="submit" disabled={loading} className="clinical-btn bg-slate-900 text-white w-full py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Synchronize Institutional Environment'}
            </button>
          </form>
        </main>
        
        <aside className="col-span-12 lg:col-span-4 space-y-6">
           <div className="clinical-card bg-slate-50 border-none p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Environment Shard Preview</h3>
              <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 space-y-6">
                 <div className="p-6 rounded-2xl text-white relative overflow-hidden" style={{ backgroundColor: form.heroColor }}>
                    <div className="text-[12px] font-black uppercase">{form.displayName || 'Authorized Node'}</div>
                    <div className="text-[8px] opacity-70 font-bold tracking-widest uppercase mt-1">Institutional Facility Shard</div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: form.primaryColor }} /><span className="text-[10px] font-black uppercase text-slate-400">Clinical Flow</span></div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: form.accentColor }} /><span className="text-[10px] font-black uppercase text-slate-400">Revenue Stream</span></div>
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}