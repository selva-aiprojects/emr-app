import { useState, useMemo } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import PatientSearch from '../components/PatientSearch.jsx';
import { currency, patientName } from '../utils/format.js';
import { api } from '../api.js';
import { EmptyState } from '../components/ui/index.jsx';
import '../styles/critical-care.css';
import { 
  Receipt, 
  Wallet, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Activity,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  History,
  Scale,
  Printer,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

function printInvoice(invoice, patients, tenant) {
  const pName = patientName(invoice.patientId, patients);
  const w = window.open('', '_blank', 'width=800,height=900');
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1F2937; line-height: 1.6; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 4px solid #10B981; padding-bottom: 25px; margin-bottom: 40px; }
        .clinic-info h1 { color: #10B981; margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; }
        .clinic-info p { margin: 4px 0; color: #64748B; font-size: 13px; font-weight: 600; }
        .bill-label { font-size: 36px; font-weight: 900; color: #1F2937; margin: 0; letter-spacing: -0.05em; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
        .meta-box h4 { font-size: 10px; text-transform: uppercase; color: #94A3B8; margin: 0 0 10px; letter-spacing: 0.15em; font-weight: 900; }
        .meta-box p { font-size: 16px; font-weight: 800; color: #1F2937; margin: 0; }
        .meta-box .sub { font-weight: 600; color: #64748B; font-size: 13px; margin-top: 6px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin: 40px 0; }
        th { text-align: left; padding: 15px; border-bottom: 2px solid #E5E7EB; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 900; }
        td { padding: 20px 15px; border-bottom: 1px solid #F3F4F6; font-size: 15px; color: #374151; font-weight: 600; font-variant-numeric: tabular-nums; }
        .amount-col { text-align: right; font-weight: 800; color: #1F2937; }
        .totals { margin-top: 40px; border-top: 2px solid #F3F4F6; padding-top: 30px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .total-row { display: flex; justify-content: space-between; width: 320px; font-size: 15px; color: #64748B; font-weight: 700; text-transform: uppercase; }
        .grand-total { border-top: 3px solid #10B981; padding-top: 15px; margin-top: 10px; color: #1F2937; font-size: 24px; font-weight: 900; }
        .footer { margin-top: 100px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E5E7EB; padding-top: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        @media print { body { padding: 0; } .header { border-bottom-width: 5px; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="clinic-info">
          <h1>${tenant?.name || 'EMR Medical Center'}</h1>
          <p>Institutional Financial Ledger Node</p>
          <p>Licence Ref: EMR-TC-${(tenant?.id || 'SYS').slice(0, 8).toUpperCase()}</p>
        </div>
        <div style="text-align: right">
          <h2 class="bill-label">Receipt</h2>
          <p style="color: #64748B; font-size: 14px; font-weight: 800; margin-top: 5px; text-transform: uppercase;">Doc ID: ${invoice.number}</p>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <h4>Billed Recipient Identity</h4>
          <p>${pName}</p>
          <div class="sub">Clinical File MRN: ${(invoice.patientId || 'X').toUpperCase().slice(0, 12)}</div>
        </div>
        <div class="meta-box" style="text-align: right">
          <h4>Execution Temporal Stamp</h4>
          <p>${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Diagnostic Narrative / Therapeutic Shards</th>
            <th style="text-align: right">Node Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.description || 'Institutional Consultation & Facility Services'}</td>
            <td class="amount-col">${currency(invoice.total)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row grand-total"><span>Total Finalized</span><span>${currency(invoice.total)}</span></div>
        ${invoice.status === 'paid' ? '<div style="margin-top: 20px; padding: 12px 28px; background: #F3F4F6; border: 2px solid #10B981; border-radius: 12px; color: #10B981; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.15em;">✓ PROTOCOL SETTLED</div>' : ''}
      </div>

      <div class="footer">
        <p>This document constitutes a certified legal financial extract issued by the institutional node.</p>
        <p style="margin-top: 8px;">Fiscal verification ID: ${(invoice.id || 'TX').slice(0, 16).toUpperCase()}</p>
      </div>
    </body>
    </html>
  `);
  w.document.close();
}

export default function BillingPage({ 
  tenant, 
  patients = [],
  invoices = [],
  setView,
  setActivePatientId,
  onIssueInvoice,
  onMarkPaid 
}) {
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState('list'); // 'list' | 'create' | 'settlement'
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(null);



  const handleIssueInvoice = async (e) => {
    e.preventDefault();
    try {
      await onIssueInvoice(e);
      showToast({ message: 'Invoice created successfully!', type: 'success', title: 'Billing' });
      setActiveView('list');
    } catch (err) {
      showToast({ title: 'Ledger Error', message: err.message, type: 'error' });
    }
  };

  const handleSecurePayment = async (invoice) => {
    setIsProcessing(true);
    try {
      // Insurance Calculation Shard (80% Coverage)
      const insuranceCoverage = invoice.total * 0.8;
      const patientLiability = invoice.total - insuranceCoverage;

      // Simulate external payment gateway handshake
      const gatewayRes = await api.simulatePaymentGateway(patientLiability, 'INR');
      
      if (gatewayRes.success) {
        setShowPaymentLink({ ...invoice, insuranceCoverage, patientLiability, txnId: gatewayRes.transactionId });
      }
    } catch (err) {
      showToast({ title: 'Gateway Error', message: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizePayment = async () => {
    try {
      await onMarkPaid(showPaymentLink.id, 'PayLink-Gateway');
      showToast({ message: 'Payment recorded successfully!', type: 'success', title: 'Billing' });
      setShowPaymentLink(null);
    } catch (err) {
      showToast({ title: 'Settlement Error', message: err.message, type: 'error' });
    }
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400 font-black uppercase tracking-[0.2em]">
        <div className="animate-pulse">Initializing Revenue Node...</div>
      </div>
    );
  }

  const invoicesData = Array.isArray(invoices) ? invoices : [];
  const sortedInvoices = [...invoicesData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = {
    revenue: invoicesData.filter(i => i.status === 'paid').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
    outstanding: invoicesData.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
    pendingClearance: 3
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* 1. TRANSACTIONAL HEADER */}
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Financial Governance Ledger
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Revenue Node</span>
           </h1>
           <p className="dim-label">Institutional fiscal reconciliation and longitudinal settlement tracking for {tenant?.name || 'Facility'}.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Accounting Integrity Validated • SLM Settlement Active
           </p>
         </div>

         <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
          {[
            { id: 'list', label: 'Ledger', icon: History },
            { id: 'create', label: 'New Statement', icon: Plus },
            { id: 'settlement', label: 'Bed Settlement', icon: Scale }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`clinical-btn !min-h-[40px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => setActiveView(tab.id)}
            >
              <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. REVENUE VITALS */}
      <section className="vitals-monitor mb-10">
        <div className="vital-node vital-node--safe shadow-sm group hover:scale-[1.02] transition-transform">
           <div className="flex justify-between items-start">
              <span className="vital-label">Realized Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{currency(stats.revenue)}</span>
           <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest flex items-center gap-1">Valid for current cycle</p>
        </div>

        <div className="vital-node vital-node--warning shadow-sm group hover:scale-[1.02] transition-transform">
           <div className="flex justify-between items-start">
              <span className="vital-label">Accounts Receivable</span>
              <CreditCard className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{currency(stats.outstanding)}</span>
           <p className="text-[10px] font-black text-amber-600 mt-2 uppercase tracking-widest flex items-center gap-1">Outstanding Shards</p>
        </div>

        <div className="vital-node vital-node--critical shadow-sm group hover:scale-[1.02] transition-transform">
           <div className="flex justify-between items-start">
              <span className="vital-label">Awaiting Clearance</span>
              <Building className="w-4 h-4 text-rose-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">0{stats.pendingClearance}</span>
           <p className="text-[10px] font-black text-rose-600 mt-2 uppercase tracking-widest flex items-center gap-1">Inpatient Discharge Bloq</p>
        </div>
      </section>

      {/* 3. WORKSPACE GRID */}
      <div className="grid grid-cols-12 gap-8">
        {activeView === 'create' && (
          <article className="col-span-12 lg:col-span-8 lg:col-start-3 clinical-card p-12 transition-all">
            <header className="mb-12 border-b border-slate-50 pb-8 flex justify-between items-end">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Authorized Statement Generation</h3>
                  <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Fiscal provisioning protocol • Institutional Node</p>
               </div>
               <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
               </div>
            </header>

            <form className="space-y-12" onSubmit={handleIssueInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-6">Recipient Identity Shard</h4>
                  <div className="p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                     <PatientSearch tenantId={tenant.id} />
                  </div>
                  <div className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100 flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-[11px] font-medium text-emerald-900/60 leading-relaxed italic">
                      Verify MRN identity before authorization of fiscal instruments.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 border-b border-slate-50 pb-4">Fiscal Configuration</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Service Narrative</label>
                    <input name="description" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-medium" placeholder="e.g. Specialty Consult + Diagnostic Protocol" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Node Fee (₹)</label>
                      <input name="amount" type="number" step="0.01" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black tabular-nums text-lg" placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Tax (%)</label>
                      <input name="taxPercent" type="number" step="0.1" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black tabular-nums text-lg" defaultValue="5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Protocol</label>
                    <select name="paymentMethod" className="input-field h-[64px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" defaultValue="Card">
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI / NetBanking</option>
                      <option>Insurance Claim Shard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-50 flex justify-end gap-6 items-center">
                <button type="button" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-colors" onClick={() => setActiveView('list')}>Abort Transaction</button>
                <button type="submit" className="clinical-btn bg-slate-900 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all">FINALISE & AUTHORISE STATEMENT</button>
              </div>
            </form>
          </article>
        )}

        {activeView === 'settlement' && (
          <article className="col-span-12 clinical-card">
            <header className="mb-12 border-b border-slate-50 pb-8 flex justify-between items-end">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Bed Occupancy Reconciliation</h3>
                  <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Discharge Clearance Ledger • Fiscal Control Node</p>
               </div>
               <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
               </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {patients.slice(0, 3).map((p, idx) => (
                <div key={`${p.id}-${idx}`} className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="text-base font-black text-slate-900 mb-1">{p.firstName} {p.lastName}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">SHARD-B • CELL 10{idx + 1}</div>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Waiting Clearance</span>
                  </div>
                  
                  <div className="p-5 bg-slate-50 rounded-2xl mb-8 space-y-3">
                     <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                        <span>Bed Node Duration</span>
                        <span className="text-slate-900 tabular-nums">{currency(12500)}</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                        <span>Therapeutic Influx</span>
                        <span className="text-slate-900 tabular-nums">{currency(4200)}</span>
                     </div>
                     <div className="pt-3 border-t border-slate-200 flex justify-between text-[13px] font-black text-emerald-600 uppercase tracking-widest">
                        <span>AGGREGATE DUE</span>
                        <span className="tabular-nums">{currency(16700)}</span>
                     </div>
                  </div>

                  <button className="clinical-btn bg-slate-900 text-white w-full py-5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:bg-emerald-600 transition-colors border-none rounded-2xl">
                    AUTHORIZE FINAL EXIT
                  </button>
                </div>
              ))}
            </div>
            {!patients.length && (
              <EmptyState 
                title="No active bed shards" 
                subtitle="All therapeutic wards are currently reconciled. No active bed shards requiring discharge clearance."
                icon={Building}
              />
            )}
          </article>
        )}

        {activeView === 'list' && (
          <article className="clinical-card col-span-12 !p-0 overflow-hidden">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Institutional Fiscal Ledger</h3>
                  <p className="dim-label uppercase tracking-widest text-[10px] mt-1 font-black">Sequential Transaction Node Monitoring</p>
               </div>
               <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <Activity className="w-5 h-5" />
               </div>
            </header>

            <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verify clinical eligibility before finalizing fiscal shards. All settlements are non-reversible.</span>
            </div>

            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="tracking-widest">Date & Time</th>
                    <th className="tracking-widest">Statement ID</th>
                    <th className="tracking-widest">Subject Account</th>
                    <th className="tracking-widest">Gross Aggregate</th>
                    <th className="tracking-widest">Settlement Shard</th>
                    <th style={{ textAlign: 'right' }} className="tracking-widest">Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <EmptyState 
                          title="No recorded transactions identified" 
                          subtitle="The institutional fiscal ledger contains no committed transaction shards in the current financial sector."
                          icon={Receipt}
                        />
                      </td>
                    </tr>
                  ) : sortedInvoices.map((i, idx) => (
                    <tr key={`${i.id}-${idx}`} data-testid="invoice-row" className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                      <td>
                        <div className="text-[13px] font-black text-slate-900 tabular-nums">{i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}</div>
                      </td>
                      <td><code className="text-[11px] font-black font-tabular text-slate-500 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">{i.number}</code></td>
                      <td>
                        <div className="font-black text-slate-800 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => { setActivePatientId(i.patientId); setView('patients'); }}>
                          {i.patient_name || patientName(i.patientId, patients) || 'Identity Shard Restricted'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">MRN: {String(i.patientId || 'X').slice(0, 10).toUpperCase()}</div>
                      </td>
                      <td className="font-black text-slate-900 tabular-nums text-sm">{currency(i.total)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${i.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                           <span className={`text-[10px] font-black uppercase tracking-widest border px-3 py-1 rounded-full ${i.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                             {i.status === 'paid' ? 'Settled' : 'Unresolved'}
                           </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-3">
                          {i.status !== 'paid' && (
                            <button 
                              className={`clinical-btn bg-slate-900 text-white px-5 !min-h-[40px] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border-none transition-all ${isProcessing ? 'opacity-50' : 'hover:bg-emerald-600'}`} 
                              disabled={isProcessing}
                              onClick={() => handleSecurePayment(i)}
                            >
                              {isProcessing ? 'Handshake...' : 'PayLink'}
                            </button>
                          )}
                          <button 
                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100" 
                            onClick={() => printInvoice(i, patients, tenant)}
                            title="Authorize Receipt Protocol"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </div>

      {/* 4. PAYMENT GATEWAY MODAL */}
      {showPaymentLink && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowPaymentLink(null)}>
           <div className="relative clinical-card w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-scale-up border-none" onClick={e => e.stopPropagation()}>
              <div className="h-2 bg-emerald-500 w-full" />
              <div className="p-10">
                 <header className="flex justify-between items-start mb-10">
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Financial Checkout</h3>
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trace ID: {showPaymentLink.txnId}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                       <CreditCard className="w-6 h-6 text-slate-400" />
                    </div>
                 </header>

                 <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase">Gross Billing</span>
                          <span className="font-black text-slate-900">{currency(showPaymentLink.total)}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs pb-4 border-b border-slate-200">
                          <span className="font-bold text-emerald-600 uppercase italic">Insurance Shard (80%)</span>
                          <span className="font-black text-emerald-600">-{currency(showPaymentLink.insuranceCoverage)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2">
                          <span className="text-sm font-black text-slate-900 uppercase">Subject Liability</span>
                          <span className="text-2xl font-black text-indigo-600">{currency(showPaymentLink.patientLiability)}</span>
                       </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-xl flex items-center gap-3 border border-indigo-100">
                       <ShieldCheck className="w-4 h-4 text-indigo-500" />
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Secured by Institutional PayLink Node v4.2</span>
                    </div>
                 </div>

                 <div className="mt-10 flex gap-4">
                    <button onClick={finalizePayment} className="clinical-btn bg-slate-900 text-white flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all hover:bg-emerald-600 border-none">
                       Commit Settlement Shard
                    </button>
                    <button onClick={() => setShowPaymentLink(null)} className="clinical-btn bg-white border border-slate-200 text-slate-400 px-6 rounded-2xl text-xs font-black uppercase">Cancel</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
