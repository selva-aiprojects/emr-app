import { currency, patientName } from '../utils/format.js';

function printInvoice(invoice, patients) {
  const pName = patientName(invoice.patientId, patients);
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.number}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; padding:40px; color:#1f2a35; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #059669; padding-bottom:20px; margin-bottom:30px; }
  .brand h1 { color:#059669; font-size:24px; } .brand p { color:#64748b; font-size:13px; }
  .invoice-meta { text-align:right; } .invoice-meta h2 { color:#059669; font-size:20px; }
  .invoice-meta p { font-size:13px; color:#64748b; }
  .details { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:30px; }
  .details div { padding:16px; background:#f8fafc; border-radius:8px; }
  .details label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px; font-weight:600; }
  .details p { font-size:14px; margin-top:4px; font-weight:500; }
  table { width:100%; border-collapse:collapse; margin-bottom:30px; }
  th { background:#f1f5f9; padding:10px 16px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; }
  td { padding:12px 16px; border-bottom:1px solid #e2e8f0; font-size:14px; }
  .totals { text-align:right; } .totals p { font-size:14px; margin:6px 0; color:#64748b; }
  .totals .grand-total { font-size:20px; font-weight:700; color:#059669; border-top:2px solid #059669; padding-top:10px; margin-top:10px; }
  .status { display:inline-block; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; }
  .status-paid { background:#dcfce7; color:#16a34a; } .status-issued { background:#fef9c3; color:#ca8a04; }
  .footer { margin-top:40px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:15px; }
  @media print { body { padding:20px; } }
</style></head><body>
  <div class="header">
    <div class="brand"><h1>🏥 EMR System</h1><p>Electronic Medical Records</p></div>
    <div class="invoice-meta"><h2>INVOICE</h2><p><strong>${invoice.number}</strong></p><p>${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
  </div>
  <div class="details">
    <div><label>Patient</label><p>${pName}</p></div>
    <div><label>Status</label><p><span class="status status-${invoice.status}">${invoice.status.toUpperCase()}</span></p></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody><tr><td>${invoice.description || 'Medical Services'}</td><td style="text-align:right">${currency(invoice.subtotal)}</td></tr></tbody>
  </table>
  <div class="totals">
    <p>Subtotal: <strong>${currency(invoice.subtotal)}</strong></p>
    <p>Tax: <strong>${currency(invoice.tax)}</strong></p>
    <p class="grand-total">Total: ${currency(invoice.total)}</p>
    ${invoice.paid > 0 ? `<p>Paid: <strong>${currency(invoice.paid)}</strong></p>` : ''}
  </div>
  <div class="footer"><p>This is a computer-generated invoice. No signature required.</p></div>
</body></html>`);
  w.document.close();
  w.print();
}

export default function BillingPage({ patients, invoices, onIssueInvoice, onMarkPaid }) {
  return (
    <section className="view">
      <article className="panel">
        <h3>Issue Invoice</h3>
        <form className="form-grid" onSubmit={onIssueInvoice}>
          <select name="patientId" required>{patients.map((p) => <option key={p.id} value={p.id}>{p.mrn}</option>)}</select>
          <input name="description" placeholder="Description" required />
          <input name="amount" type="number" step="0.01" required />
          <input name="taxPercent" type="number" step="0.01" placeholder="Tax %" />
          <button type="submit">Issue Invoice</button>
        </form>
        <table>
          <thead><tr><th>Invoice</th><th>Patient</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{invoices.map((i) => <tr key={i.id}>
            <td>{i.number}</td>
            <td>{patientName(i.patientId, patients)}</td>
            <td>{currency(i.total)}</td>
            <td><span className={`status-badge status-${i.status}`}>{i.status}</span></td>
            <td className="action-cell">
              {i.status !== 'paid' && <button className="action-btn" onClick={() => onMarkPaid(i.id)}>Mark Paid</button>}
              <button className="action-btn print-btn" onClick={() => printInvoice(i, patients)} title="Print Invoice">🖨️</button>
            </td>
          </tr>)}</tbody>
        </table>
      </article>
    </section>
  );
}
