import { patientName } from '../utils/format.js';

function printEncounter(enc, patients, providers) {
  const pName = patientName(enc.patientId, patients);
  const providerName = providers.find(p => p.id === enc.providerId)?.name || 'Unknown';
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Medical Report - ${pName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; padding:40px; color:#1f2a35; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #059669; padding-bottom:20px; margin-bottom:30px; }
  .brand h1 { color:#059669; font-size:24px; } .brand p { color:#64748b; font-size:13px; }
  .report-meta { text-align:right; } .report-meta h2 { color:#059669; font-size:18px; }
  .report-meta p { font-size:13px; color:#64748b; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px; }
  .info-card { padding:16px; background:#f8fafc; border-radius:8px; border-left:4px solid #059669; }
  .info-card label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px; font-weight:600; }
  .info-card p { font-size:14px; margin-top:4px; font-weight:500; }
  .section { margin-bottom:24px; }
  .section h3 { font-size:14px; color:#059669; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e2e8f0; }
  .section p { font-size:14px; line-height:1.7; color:#334155; }
  .badge { display:inline-block; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; }
  .badge-opd { background:#dbeafe; color:#2563eb; } .badge-ipd { background:#fef3c7; color:#d97706; } .badge-emergency { background:#fee2e2; color:#dc2626; }
  .footer { margin-top:40px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:15px; }
  @media print { body { padding:20px; } }
</style></head><body>
  <div class="header">
    <div class="brand"><h1>🏥 EMR System</h1><p>Medical Encounter Report</p></div>
    <div class="report-meta"><h2>CLINICAL REPORT</h2><p>${new Date(enc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
  </div>
  <div class="info-grid">
    <div class="info-card"><label>Patient</label><p>${pName}</p></div>
    <div class="info-card"><label>Provider</label><p>${providerName}</p></div>
    <div class="info-card"><label>Encounter Type</label><p><span class="badge badge-${enc.type?.toLowerCase()}">${enc.type}</span></p></div>
    <div class="info-card"><label>Status</label><p>${enc.status}</p></div>
  </div>
  <div class="section"><h3>Chief Complaint</h3><p>${enc.complaint || 'N/A'}</p></div>
  <div class="section"><h3>Diagnosis</h3><p>${enc.diagnosis || 'N/A'}</p></div>
  <div class="section"><h3>Clinical Notes</h3><p>${enc.notes || 'No additional notes'}</p></div>
  <div class="footer"><p>This is a computer-generated medical report. For queries, contact the attending physician.</p></div>
</body></html>`);
  w.document.close();
  w.print();
}

export default function EmrPage({ patients, providers, encounters, onCreateEncounter }) {
  return (
    <section className="view">
      <article className="panel">
        <h3>Create Encounter</h3>
        <form className="form-grid" onSubmit={onCreateEncounter}>
          <select name="patientId" required>{patients.map((p) => <option key={p.id} value={p.id}>{p.mrn} - {p.firstName}</option>)}</select>
          <select name="providerId" required>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select name="type"><option>OPD</option><option>IPD</option><option>emergency</option></select>
          <input name="complaint" placeholder="Complaint" required />
          <input name="diagnosis" placeholder="Diagnosis" required />
          <input name="notes" placeholder="Notes" />
          <button type="submit">Save Encounter</button>
        </form>
      </article>

      {encounters && encounters.length > 0 && (
        <article className="panel" style={{ marginTop: '1.5rem' }}>
          <h3>Encounter History</h3>
          <table>
            <thead><tr><th>Date</th><th>Patient</th><th>Type</th><th>Complaint</th><th>Diagnosis</th><th>Actions</th></tr></thead>
            <tbody>{encounters.map((e) => <tr key={e.id}>
              <td>{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
              <td>{patientName(e.patientId, patients)}</td>
              <td><span className={`status-badge encounter-${e.type?.toLowerCase()}`}>{e.type}</span></td>
              <td>{e.complaint}</td>
              <td>{e.diagnosis}</td>
              <td><button className="action-btn print-btn" onClick={() => printEncounter(e, patients, providers)} title="Print Report">🖨️</button></td>
            </tr>)}</tbody>
          </table>
        </article>
      )}
    </section>
  );
}
