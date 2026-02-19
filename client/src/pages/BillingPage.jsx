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
    <section className="view billing-workspace">
      <div className="workspace-header">
        <div className="tab-group premium-glass">
          <button
            className={`tab-link ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            <span className="icon">💳</span> Financial Ledger
          </button>
          <button
            className={`tab-link ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
          >
            <span className="icon">➕</span> New Statement
          </button>
          <button
            className={`tab-link ${activeView === 'settlement' ? 'active' : ''}`}
            onClick={() => setActiveView('settlement')}
          >
            <span className="icon">🏨</span> Bed Settlement
          </button>
        </div>
      </div>

      <div className="billing-content-grid">
        {activeView === 'create' && (
          <article className="panel create-invoice-card premium-glass">
            <div className="panel-header-rich">
              <div className="header-icon-box">💰</div>
              <div className="header-text">
                <h3>New Patient Statement</h3>
                <p>Generate institutional bills for medical services rendered</p>
              </div>
            </div>

            <form className="medical-form" onSubmit={(e) => {
              onIssueInvoice(e);
              setActiveView('list');
            }}>
              <div className="form-grid-premium">
                <div className="form-section">
                  <h4 className="form-section-title">Client Selection</h4>
                  <PatientSearch tenantId={tenant.id} />
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">Billing Particulars</h4>
                  <div className="form-group">
                    <label>Service Description</label>
                    <input name="description" placeholder="e.g. Specialty Consult + Radiology" required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Base Fee (₹)</label>
                      <input name="amount" type="number" step="0.01" placeholder="0.00" required />
                    </div>
                    <div className="form-group">
                      <label>GST / VAT (%)</label>
                      <input name="taxPercent" type="number" step="0.1" defaultValue="5" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Payment Mode Preference</label>
                    <select name="paymentMethod" defaultValue="Card">
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI / NetBanking</option>
                      <option>Insurance Claim</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions-premium">
                <button type="submit" className="save-btn-premium">Finalize Transaction</button>
                <button type="button" className="cancel-btn-premium" onClick={() => setActiveView('list')}>Discard Statement</button>
              </div>
            </form>
          </article>
        )}

        {activeView === 'settlement' && (
          <article className="settlement-workspace panel premium-glass" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>IPD Discharge & Settlement</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Finalize financial clearance for patients awaiting clinical discharge.</p>
            </div>
            <div className="settlement-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {patients.slice(0, 3).map(p => (
                <div key={p.id} className="settlement-card premium-glass" style={{ padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>WARD-B • ROOM 10{Math.floor(Math.random() * 9)}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px' }}>WAITING</span>
                  </div>
                  <div className="bill-summary" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Bed Charges</span> <strong>{currency(12500)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Medications</span> <strong>{currency(4200)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                      <span>Total Due</span> <strong>{currency(16700)}</strong>
                    </div>
                  </div>
                  <button className="primary-submit-btn" style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '8px', marginTop: '1rem', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                    Initiate Final Exit
                  </button>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeView === 'list' && (
          <article className="ledger-card premium-glass">
            <div className="ledger-header">
              <div className="title-stack">
                <h3>Institutional Ledger</h3>
                <p>Comprehensive monitoring of {sortedInvoices.length} recent financial transactions and departmental billings.</p>
              </div>
              <div className="ledger-stats analytics-cards">
                <div className="stat-card premium-glass">
                  <div className="card-icon color-emerald"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                  <div className="card-info">
                    <span className="tiny-label">Realized Revenue</span>
                    <strong className="val-main">{currency(sortedInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0))}</strong>
                  </div>
                  <div className="mini-graph">
                    <div className="bar" style={{ height: '40%', opacity: 0.3 }}></div>
                    <div className="bar" style={{ height: '60%', opacity: 0.5 }}></div>
                    <div className="bar" style={{ height: '80%', opacity: 0.7 }}></div>
                    <div className="bar active" style={{ height: '100%' }}></div>
                  </div>
                </div>
                <div className="stat-card premium-glass">
                  <div className="card-icon color-amber"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
                  <div className="card-info">
                    <span className="tiny-label">Awaiting Settlement</span>
                    <strong className="val-main">{currency(sortedInvoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total, 0))}</strong>
                  </div>
                  <div className="mini-graph">
                    <div className="bar-trend error" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ledger-guidance">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="color-blue"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              <span>Verify patient insurance eligibility before finalizing statements. Settled payments are finalized in real-time.</span>
            </div>

            <div className="table-wrapper">
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
                  {sortedInvoices.length === 0 && (
                    <tr><td colSpan="6" className="empty-table-msg">No transactions recorded in the current fiscal period.</td></tr>
                  )}
                  {Array.isArray(sortedInvoices) && sortedInvoices.map((i) => (
                    <tr key={i.id} className={`ledger-row ${i.status}`}>
                      <td className="date-cell">
                        {i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                      </td>
                      <td className="id-cell"><code>{i.number}</code></td>
                      <td className="patient-cell">
                        <div
                          className="clickable-patient"
                          onClick={() => { setActivePatientId(i.patientId); setView('patients'); }}
                        >
                          {patientName(i.patientId, patients) || 'Unknown File'}
                        </div>
                        <span className="tiny-id">REF-{i.patientId?.slice(0, 6).toUpperCase()}</span>
                      </td>
                      <td className="amount-cell">{currency(i.total)}</td>
                      <td>
                        <span className={`status-chip ${i.status}`}>
                          {i.status === 'paid' ? 'Settled' : 'Outstanding'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-button-group">
                          {i.status !== 'paid' && (
                            <button className="ledger-btn settle" onClick={() => onMarkPaid(i.id)}>
                              Settle
                            </button>
                          )}
                          <button className="ledger-btn print" onClick={() => printInvoice(i, patients, tenant)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
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

      <style>{`
        .billing-workspace { animation: fade-in 0.5s ease-out; }
        .workspace-header { margin-bottom: 1rem; }
        .tab-group { display: flex; padding: 4px; width: fit-content; background: rgba(255,255,255,0.6); }
        .tab-link { 
          padding: 10px 20px; border: none; background: transparent; color: #64748b; 
          font-size: 0.85rem; font-weight: 700; cursor: pointer; border-radius: 9px; 
          transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .tab-link.active { background: white; color: var(--tenant-primary); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        
        .premium-glass { background: white; border-radius: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 25px rgba(0,0,0,0.03); }
        
        .panel-header-rich { display: flex; align-items: center; gap: 1rem; margin-bottom: 2.5rem; }
        .header-icon-box { font-size: 1.75rem; background: #fff7ed; width: 54px; height: 54px; display: grid; place-items: center; border-radius: 14px; border: 1px solid #ffedd5; }
        .header-text h3 { margin: 0; font-size: 1.35rem; font-weight: 900; color: #0f172a; }
        .header-text p { margin: 4px 0 0; color: #64748b; font-size: 0.85rem; }

        .create-invoice-card { max-width: 680px; padding: 2.5rem; }
        .ledger-card { padding: 0; overflow: hidden; }
        
        .ledger-header { padding: 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .title-stack h3 { margin: 0; font-size: 1.25rem; font-weight: 900; color: #0f172a; }
        .title-stack p { margin: 4px 0 0; color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
        
        .ledger-stats.analytics-cards { display: flex; gap: 1.5rem; }
        .stat-card { 
          display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; 
          border-radius: 1.25rem; position: relative; overflow: hidden; min-width: 240px;
        }
        .card-icon { width: 44px; height: 44px; background: #f8fafc; border-radius: 10px; display: grid; place-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
        .card-info { flex: 1; display: flex; flex-direction: column; }
        .tiny-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .val-main { font-size: 1.15rem; font-weight: 900; color: #0f172a; margin-top: 2px; }
        
        .mini-graph { position: absolute; bottom: 0; right: 0; left: 0; height: 30px; display: flex; align-items: flex-end; gap: 4px; padding: 0 10px; opacity: 0.15; pointer-events: none; }
        .mini-graph .bar { flex: 1; background: currentColor; border-radius: 4px 4px 0 0; }
        .mini-graph .bar-trend { height: 4px; background: #eab308; border-radius: 10px; }
        .mini-graph .bar-trend.error { background: #f59e0b; }

        .ledger-guidance { 
          margin: 0 2rem 1rem; padding: 0.75rem 1.25rem; background: #f0f9ff; 
          border-radius: 10px; display: flex; align-items: center; gap: 10px;
          font-size: 0.75rem; font-weight: 600; color: #0369a1; border: 1px solid #e0f2fe;
        }

        .table-wrapper { width: 100%; border-top: 1px solid transparent; }
        .premium-table { width: 100%; border-collapse: collapse; }
        .premium-table th { text-align: left; padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; border-bottom: 1px solid #f1f5f9; }
        .premium-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f8fafc; font-size: 14px; }
        
        .date-cell { font-weight: 700; color: #64748b; }
        .id-cell code { background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
        .patient-cell { display: flex; flex-direction: column; }
        .clickable-patient { font-weight: 800; color: var(--tenant-primary); cursor: pointer; transition: 0.2s; }
        .clickable-patient:hover { text-decoration: underline; color: #0f172a; }
        .tiny-id { font-size: 10px; color: #cbd5e1; font-weight: 700; margin-top: 2px; }
        .amount-cell { font-weight: 900; color: #0f172a; font-size: 15px; }

        .status-chip { font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.02em; }
        .status-chip.paid { background: #dcfce7; color: #16a34a; }
        .status-chip.pending { background: #fef9c3; color: #ca8a04; }

        .action-button-group { display: flex; gap: 8px; justify-content: flex-end; }
        .ledger-btn { height: 32px; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; background: white; }
        .ledger-btn.settle { color: #10b981; border-color: #d1fae5; background: #f0fdf4; padding: 0 12px; }
        .ledger-btn.settle:hover { background: #10b981; color: white; border-color: #10b981; }
        .ledger-btn.print { width: 32px; color: #64748b; }
        .ledger-btn.print:hover { background: #f1f5f9; color: #0f172a; }

        .empty-table-msg { text-align: center; padding: 4rem; color: #94a3b8; font-weight: 600; font-style: italic; }
      `}</style>
    </section>
  );
}
