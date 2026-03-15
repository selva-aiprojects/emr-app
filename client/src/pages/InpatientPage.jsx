import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { 
  Building2, 
  Sync, 
  UserPlus, 
  Bed, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function InpatientPage({ tenant, onDischarge }) {
    const [encounters, setEncounters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInpatientEncounters();
    }, [tenant]);

    const loadInpatientEncounters = async () => {
        if (!tenant) return;
        setLoading(true);
        try {
            const [allEncounters, allInvoices] = await Promise.all([
                api.getEncounters(tenant.id),
                api.getInvoices(tenant.id)
            ]);

            const ipd = allEncounters
                .filter(e => (e.encounter_type === 'In-patient' || e.type === 'IPD') && e.status === 'open')
                .map(e => {
                    const patientInvoices = allInvoices.filter(inv => inv.patientId === (e.patient_id || e.patientId));
                    const hasUnpaid = patientInvoices.some(inv => inv.status !== 'paid');
                    return {
                        ...e,
                        isCleared: !hasUnpaid
                    };
                });
            setEncounters(ipd);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDischarge = async (encounter) => {
        if (!confirm('Initiate discharge protocol for this patient?')) return;

        const diagnosis = prompt('Final Discharge Diagnosis:', encounter.diagnosis || '');
        if (diagnosis === null) return;

        const notes = prompt('Clinical Discharge Summary:', 'Patient stable, follow-up recommended.');
        if (notes === null) return;

        const amountStr = prompt('Estimated inpatient bill amount (leave 0 for draft):', '0');
        const amount = parseFloat(amountStr) || 0;

        try {
            await api.dischargePatient(encounter.id, { diagnosis, notes });
            try {
                await api.createDischargeInvoice(encounter.id, {
                    patientId: encounter.patient_id || encounter.patientId,
                    amount,
                    description: `Inpatient Admission — ${diagnosis}`
                });
                alert(`✅ Patient discharged and a draft invoice of ₹${amount.toLocaleString()} has been created in Billing.`);
            } catch (billingErr) {
                console.warn('Billing bridge failed (non-critical):', billingErr.message);
                alert('✅ Patient discharged. Note: Draft invoice creation failed — please raise invoice manually in Billing.');
            }

            loadInpatientEncounters();
            if (onDischarge) onDischarge();
        } catch (err) {
            alert('Discharge Protocol Error: ' + err.message);
        }
    };

    return (
        <div className="page-shell-premium animate-fade-in">
            <div className="page-header-premium mb-8">
                <div>
                   <h1 className="flex items-center gap-3">
                      Active Inpatient Registry
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-tighter border border-emerald-200 shadow-sm animate-pulse-slow">Clinical Shard Live</span>
                   </h1>
                   <p>Monitor facility throughput, bed occupancy metrics, and clinical discharge authorizations.</p>
                </div>
                <div className="flex gap-3">
                   <button 
                      className="px-6 py-4 bg-white text-slate-400 hover:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center gap-3"
                      onClick={loadInpatientEncounters}
                   >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Sync Records
                   </button>
                   <button className="btn-primary py-4 px-10 text-[10px] uppercase tracking-widest shadow-xl group">
                      <Bed className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                      Provision New Admission
                   </button>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
               <div className="glass-panel p-6 border-l-4 border-l-blue-500 shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Occupancy</p>
                        <h4 className="text-3xl font-black text-slate-900 mt-2">{encounters.length}</h4>
                        <p className="text-[9px] font-black text-blue-600 mt-3 uppercase tracking-widest flex items-center gap-1">
                           <TrendingUp className="w-3 h-3" /> Facility Headcount
                        </p>
                     </div>
                     <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Building2 className="w-7 h-7" />
                     </div>
                  </div>
               </div>

               <div className="glass-panel p-6 border-l-4 border-l-amber-500 shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Discharge</p>
                        <h4 className="text-3xl font-black text-slate-900 mt-2">{encounters.filter(e => e.isCleared).length}</h4>
                        <p className="text-[9px] font-black text-amber-600 mt-3 uppercase tracking-widest">Awaiting Logistics</p>
                     </div>
                     <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center">
                        <ArrowUpRight className="w-7 h-7" />
                     </div>
                  </div>
               </div>

               <div className="glass-panel p-6 border-l-4 border-l-rose-500 shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Blockers</p>
                        <h4 className="text-3xl font-black text-slate-900 mt-2">{encounters.filter(e => !e.isCleared).length}</h4>
                        <p className="text-[9px] font-black text-rose-600 mt-3 uppercase tracking-widest">Financial Hold</p>
                     </div>
                     <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7" />
                     </div>
                  </div>
               </div>
            </div>

            {/* Admission Ledger */}
            <article className="glass-panel p-0 overflow-hidden shadow-sm border border-slate-100">
               <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-[.01em]">Clinical Admission Ledger</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Authorized occupancy and clinical clearance status</p>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Entity</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Temporal Node</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Diag Portfolio</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical State</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fiscal Status</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Operations</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {loading ? (
                           <tr><td colSpan="6" className="px-8 py-32 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest italic">Synchronizing ward occupancy ledger...</td></tr>
                        ) : encounters.length === 0 ? (
                           <tr><td colSpan="6" className="px-8 py-32 text-center text-slate-400 italic font-medium">No active admissions identified in facility registry.</td></tr>
                        ) : encounters.map(e => (
                           <tr key={e.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                                       {(e.patient_name || e.patientId || 'P')[0]}
                                    </div>
                                    <div>
                                       <div className="text-sm font-black text-slate-900 leading-tight">
                                          {e.patient_name || (e.patientId?.length > 8 ? e.patientId.slice(0, 8) : e.patientId)}
                                       </div>
                                       <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">ID: {e.patient_id || e.patientId?.slice(0, 8)}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="text-sm font-black text-slate-700">{new Date(e.created_at || e.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">ADMIT: {new Date(e.created_at || e.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="text-sm font-bold text-slate-800 max-w-[200px] truncate">{e.diagnosis || 'Clinical Assessment...'}</div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase text-blue-700 tracking-widest">ADMITTED</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 ${
                                    e.isCleared ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                 }`}>
                                    {e.isCleared ? '✓ Cleared' : '⚠ Action Needed'}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <button
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                      e.isCleared 
                                      ? 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5' 
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                    }`}
                                    onClick={() => handleDischarge(e)}
                                    disabled={!e.isCleared}
                                 >
                                    Authorize Discharge
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </article>
        </div>
    );
}
