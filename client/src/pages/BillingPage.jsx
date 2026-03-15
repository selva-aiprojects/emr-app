import { useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';
import { currency, patientName } from '../utils/format.js';

function printInvoice(invoice, patients, tenant) {
  const pName = patientName(invoice.patientId, patients);
  const w = window.open('', '_blank', 'width=800,height=900');
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.number}</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #10b981; padding-bottom: 25px; margin-bottom: 40px; }
        .clinic-info h1 { color: #059669; margin: 0; font-size: 28px; font-weight: 900; }
        .clinic-info p { margin: 4px 0; color: #64748b; font-size: 13px; }
        .bill-label { font-size: 36px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.05em; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
        .meta-box h4 { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin: 0 0 10px; letter-spacing: 0.15em; font-weight: 800; }
        .meta-box p { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
        .meta-box .sub { font-weight: 500; color: #64748b; font-size: 13px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 40px 0; }
        th { text-align: left; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; }
        td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; font-size: 15px; color: #334155; font-weight: 500; }
        .amount-col { text-align: right; font-weight: 700; color: #0f172a; }
        .totals { margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 30px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .total-row { display: flex; justify-content: space-between; width: 280px; font-size: 15px; color: #64748b; font-weight: 600; }
        .grand-total { border-top: 2px solid #10b981; padding-top: 15px; margin-top: 10px; color: #0f172a; font-size: 22px; font-weight: 900; }
        .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 30px; font-weight: 500; }
        @media print { body { padding: 0; } .header { border-bottom-width: 4px; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="clinic-info">
          <h1>${tenant?.name || 'EMR Medical Center'}</h1>
          <p>Verified Healthcare Provider</p>
          <p>Licence: EMR-TC-${tenant?.id?.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style="text-align: right">
          <h2 class="bill-label">RECEIPT</h2>
          <p style="color: #64748b; font-size: 14px; font-weight: 700; margin-top: 5px;">Ref: ${invoice.number}</p>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <h4>Billed Recipient</h4>
          <p>${pName}</p>
          <div class="sub">Patient File No: ${invoice.patientId?.toUpperCase().slice(0, 12)}</div>
        </div>
        <div class="meta-box" style="text-align: right">
          <h4>Date of Issue</h4>
          <p>${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description of Clinical Services / Items</th>
            <th style="text-align: right">Line Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.description || 'Medical Consultation & Facility Fees'}</td>
            <td class="amount-col">${currency(invoice.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Base Charges</span><span>${currency(invoice.subtotal)}</span></div>
        <div class="total-row"><span>Institutional Tax (5%)</span><span>${currency(invoice.tax)}</span></div>
        <div class="total-row grand-total"><span>Total Finalized</span><span>${currency(invoice.total)}</span></div>
        ${invoice.status === 'paid' ? '<div style="margin-top: 15px; padding: 8px 20px; background: #dcfce7; border-radius: 8px; color: #15803d; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 0.1em;">✓ PAYMENT RECEIVED</div>' : ''}
      </div>

      <div class="footer">
        <p>This document constitutes a legal tax invoice issued by ${tenant?.name}.</p>
        <p style="margin-top: 6px;">Thank you for your trust in our healthcare services.</p>
      </div>
    </body>
    </html>
  `);
  w.document.close();
}

export default function BillingPage({ tenant, patients,
  invoices,
  setView,
  setActivePatientId,
  onIssueInvoice,
  onMarkPaid }) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'create' | 'settlement'

  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="page-shell-premium">
      <div className="action-bar-premium">
        <div className="panel-title-group">
          <h2 className="panel-title-text">Financial Operations</h2>
          <p className="panel-subtitle-text">Institutional Ledger & Revenue Flow</p>
        </div>
        <div className="premium-tab-bar">
          <button
            className={`premium-tab-item ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            Financial Ledger
          </button>
          <button
            className={`premium-tab-item ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
          >
            New Statement
          </button>
          <button
            className={`premium-tab-item ${activeView === 'settlement' ? 'active' : ''}`}
            onClick={() => setActiveView('settlement')}
          >
            Bed Settlement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {activeView === 'create' && (
          <article className="col-span-12 lg:col-span-8 lg:col-start-3 glass-panel p-10 animate-fade-in">
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">New Patient Statement</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Generate institutional bills for medical services rendered</p>
            </div>

            <form className="space-y-10" onSubmit={(e) => {
              onIssueInvoice(e);
              setActiveView('list');
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Client Selection</h4>
                  <PatientSearch tenantId={tenant.id} />
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Financial Provisions</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Narrative</label>
                    <input name="description" className="input-field py-4" placeholder="e.g. Specialty Consult + Radiology" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Fee (₹)</label>
                      <input name="amount" type="number" step="0.01" className="input-field py-4 font-mono" placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax Provision (%)</label>
                      <input name="taxPercent" type="number" step="0.1" className="input-field py-4 font-mono" defaultValue="5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Protocol</label>
                    <select name="paymentMethod" className="input-field h-[54px]" defaultValue="Card">
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI / NetBanking</option>
                      <option>Insurance Claim</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setActiveView('list')}>Discard Transaction</button>
                <button type="submit" className="btn-primary px-12 py-4 text-[10px] uppercase tracking-[0.2em] shadow-xl">Finalize & Issue Statement</button>
              </div>
            </form>
          </article>
        )}

        {activeView === 'settlement' && (
          <article className="col-span-12 glass-panel p-10 animate-fade-in">
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">IPD Discharge & Settlement</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Finalize financial clearance for patients awaiting clinical discharge</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.slice(0, 3).map(p => (
                <div key={p.id} className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 mb-1">{p.firstName} {p.lastName}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">WARD-B • ROOM 10{Math.floor(Math.random() * 9)}</div>
                    </div>
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black uppercase tracking-widest">WAITING</span>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl mb-6 space-y-2">
                     <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>Bed Charges</span>
                        <span className="text-slate-900 font-mono">₹{currency(12500)}</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>Medications</span>
                        <span className="text-slate-900 font-mono">₹{currency(4200)}</span>
                     </div>
                     <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-black text-[var(--primary)] uppercase tracking-widest">
                        <span>Total Due</span>
                        <span>₹{currency(16700)}</span>
                     </div>
                  </div>

                  <button className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest shadow-lg">
                    Initiate Final Exit
                  </button>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeView === 'list' && (
          <article className="premium-panel col-span-12 animate-fade-in">
            <div className="panel-header-standard">
              <div className="panel-title-group">
                <h3 className="panel-title-text">Institutional Ledger</h3>
                <p className="panel-subtitle-text">Financial Node Monitoring</p>
              </div>
            </div>

            <div className="ledger-guidance">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="color-blue"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              <span>Verify patient insurance eligibility before finalizing statements. Settled payments are finalized in real-time.</span>
            </div>

            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Entry Date</th>
                    <th>Document ID</th>
                    <th>Patient Account</th>
                    <th>Gross Total</th>
                    <th>State</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-24 text-slate-400 italic font-medium">No transactions recorded in the current fiscal period.</td></tr>
                  ) : sortedInvoices.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <div className="text-sm font-bold text-slate-800">{i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}</div>
                      </td>
                      <td><code className="text-[10px] font-bold font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{i.number}</code></td>
                      <td>
                        <div className="font-bold text-slate-800 cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={() => { setActivePatientId(i.patientId); setView('patients'); }}>
                          {patientName(i.patientId, patients) || 'Unknown File'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">REF-{i.patientId?.slice(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="font-bold text-slate-900">{currency(i.total)}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${i.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {i.status === 'paid' ? 'Settled' : 'Outstanding'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {i.status !== 'paid' && (
                            <button className="px-3 py-1.5 bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary-hover)]/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-[var(--primary)]/10" onClick={() => onMarkPaid(i.id)}>
                              Settle
                            </button>
                          )}
                          <button 
                            className="p-1.5 text-slate-400 hover:text-[var(--primary)] hover:bg-slate-50 rounded-lg transition-all" 
                            onClick={() => printInvoice(i, patients, tenant)}
                            title="Print Transaction Record"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
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
    </div>
  );
}
