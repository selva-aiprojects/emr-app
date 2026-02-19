import { useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';

export default function PatientsPage({
  activeUser,
  session,
  patients,
  activePatient,
  activePatientId,
  setActivePatientId,
  onCreatePatient,
  onAddClinical,
  onPrint
}) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'register'

  const clinicalRecords = activePatient?.medicalHistory?.clinicalRecords || [];

  return (
    <div className="patients-intelligence-workspace">
      <div className="view-header-premium">
        <div className="header-labels">
          <div className="tab-switcher-premium">
            <button
              className={`tab-item-premium ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
            >
              Master Registry
            </button>
            {activeUser.role !== 'Patient' && (
              <button
                className={`tab-item-premium ${activeView === 'register' ? 'active' : ''}`}
                onClick={() => setActiveView('register')}
              >
                Inpatient Admission
              </button>
            )}
          </div>
          <h1>Clinical <span>Registry</span> Management</h1>
          <p>Real-time synchronization with Central Medical Database</p>
        </div>
      </div>

      <div className="mpi-oversight-layout" style={{ display: 'grid', gridTemplateColumns: activeView === 'list' ? '340px 1fr' : '1fr', gap: '24px' }}>

        {activeView === 'list' && (
          <aside className="side-search-stack">
            <section className="oversight-section search-context">
              <div className="section-head-premium">
                <div className="head-text">
                  <h3>Directory Search</h3>
                  <p>Global patient lookup</p>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <PatientSearch
                  tenantId={session?.tenantId}
                  onSelect={(p) => setActivePatientId(p.id)}
                  initialPatientId={activePatientId}
                />
              </div>
            </section>

            <section className="oversight-section">
              <div className="section-head-premium">
                <div className="head-text">
                  <h3>Recent Encounters</h3>
                  <p>Fast-track record access</p>
                </div>
              </div>
              <div className="mini-patient-feed">
                {Array.isArray(patients) && patients.slice(0, 10).map(p => (
                  <div
                    key={p.id}
                    className={`mini-clinical-card ${activePatientId === p.id ? 'active' : ''}`}
                    onClick={() => setActivePatientId(p.id)}
                  >
                    <div className="card-avatar">{(p.firstName || 'P')[0]}</div>
                    <div className="card-intel">
                      <strong>{p.firstName} {p.lastName}</strong>
                      <span className="mrn-label">MRN-{p.mrn}</span>
                    </div>
                    {p.bloodGroup && <div className="card-badge">{p.bloodGroup}</div>}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        )}

        <main className="clinical-record-viewport">
          {activeView === 'register' && (
            <article className="oversight-section admission-form-container">
              <div className="section-head-premium large">
                <div className="head-text">
                  <h3>Patient Admission Protocol</h3>
                  <p>Standardized clinical intake form for facility registry</p>
                </div>
              </div>

              <form className="medical-intake-form" onSubmit={onCreatePatient}>
                <div className="intake-grid">
                  <div className="intake-section">
                    <h4>Legal Identity & Demographics</h4>
                    <div className="form-row-grid">
                      <div className="input-field-premium">
                        <label>Legal First Name</label>
                        <input name="firstName" placeholder="Admission record name" required />
                      </div>
                      <div className="input-field-premium">
                        <label>Legal Surname</label>
                        <input name="lastName" placeholder="Family identifier" required />
                      </div>
                    </div>
                    <div className="form-row-grid tri">
                      <div className="input-field-premium">
                        <label>Date of Birth</label>
                        <input name="dob" type="date" required />
                      </div>
                      <div className="input-field-premium">
                        <label>Clinical Gender</label>
                        <select name="gender" required>
                          <option value="">Identity</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="input-field-premium">
                        <label>Blood Type</label>
                        <input name="bloodGroup" placeholder="ABO / Rh" />
                      </div>
                    </div>
                  </div>

                  <div className="intake-section">
                    <h4>Contact & Clinical Cover</h4>
                    <div className="form-row-grid">
                      <div className="input-field-premium">
                        <label>Primary Contact</label>
                        <input name="phone" placeholder="Emergency mobile" required />
                      </div>
                      <div className="input-field-premium">
                        <label>Email Communication</label>
                        <input name="email" type="email" placeholder="Portal access email" />
                      </div>
                    </div>
                    <div className="input-field-premium full">
                      <label>Verification of Coverage</label>
                      <input name="insurance" placeholder="Insurance carrier & policy number" />
                    </div>
                  </div>
                </div>

                <div className="form-actions-premium">
                  <button type="submit" className="btn-primary-premium">Finalize Admission</button>
                  <button type="button" className="btn-ghost-premium" onClick={() => setActiveView('list')}>Abort</button>
                </div>
              </form>
            </article>
          )}

          {activeView === 'list' && activePatient && (
            <div className="clinical-profile-stack">
              <header className="oversight-section profile-header-premium">
                <div className="profile-identity">
                  <div className="profile-glyph">
                    {(activePatient.firstName || 'P')[0]}
                  </div>
                  <div className="profile-labels">
                    <div className="name-cluster">
                      <h2>{activePatient.firstName} {activePatient.lastName}</h2>
                      <span className="clinical-id-badge">MRN-{activePatient.mrn}</span>
                    </div>
                    <p className="meta-stats">
                      <span>Born: <strong>{new Date(activePatient.dob).toLocaleDateString()}</strong></span>
                      <span className="divider">/</span>
                      <span>Gender: <strong>{activePatient.gender}</strong></span>
                      <span className="divider">/</span>
                      <span>Age: <strong>{activePatient.dob ? (new Date().getFullYear() - new Date(activePatient.dob).getFullYear()) : 'N/A'}</strong></span>
                    </p>
                  </div>
                </div>
                <div className="profile-controls">
                  <button className="btn-action-premium" onClick={() => onPrint('health-record')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                    Abstract Generation
                  </button>
                </div>
              </header>

              <div className="clinical-dashboard-content">
                <div className="vital-oversight-column">
                  <div className="vital-intel-card pulse">
                    <span className="v-label">Serology</span>
                    <span className="v-value">{activePatient.bloodGroup || 'N/A'}</span>
                    <p>Verified Compatibility</p>
                  </div>
                  <div className="vital-intel-card">
                    <span className="v-label">Condition Coverage</span>
                    <span className="v-value smaller">{activePatient.insurance || 'Private'}</span>
                    <p>Institutional Protocol Active</p>
                  </div>
                </div>

                <main className="clinical-journal-stack">
                  <div className="medical-alert-zone">
                    <div className="zone-card danger">
                      <h6>Allergy Constraints</h6>
                      <p>{activePatient.medicalHistory?.allergies || 'No high-risk allergies detected'}</p>
                    </div>
                    <div className="zone-card warning">
                      <h6>Pathological History</h6>
                      <p>{activePatient.medicalHistory?.chronicConditions || 'Baseline physiological status'}</p>
                    </div>
                  </div>

                  <section className="oversight-section journal-view">
                    <div className="section-head-premium">
                      <div className="head-text">
                        <h3>Clinical Journal</h3>
                        <p>Longitudinal medical encounters</p>
                      </div>
                      <span className="entry-ticker">{clinicalRecords.length} Events</span>
                    </div>

                    {activeUser.role !== 'Patient' && (
                      <div className="journal-input-premium">
                        <form className="note-capture-form" onSubmit={onAddClinical}>
                          <select name="section">
                            <option value="caseHistory">Observation</option>
                            <option value="medications">Prescription</option>
                            <option value="testReports">Diagnostic Report</option>
                          </select>
                          <input name="text" placeholder="Capture clinical encounter details..." required />
                          <button type="submit">COMMIT</button>
                        </form>
                      </div>
                    )}

                    <div className="journal-timeline-feed">
                      {clinicalRecords.length > 0 ? (
                        clinicalRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rec, idx) => (
                          <div key={idx} className={`timeline-entry ${rec.section}`}>
                            <div className="entry-marker"></div>
                            <div className="entry-header">
                              <span className="tag">{rec.section}</span>
                              <span className="timestamp">{new Date(rec.created_at).toLocaleString()}</span>
                            </div>
                            <div className="entry-payload">
                              {rec.payload || rec.content}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-observation">
                          <p>Record is clean. Sequential tracking initialized.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            </div>
          )}

          {activeView === 'list' && !activePatient && (
            <div className="registry-empty-state">
              <div className="glyph-container">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3>Master Registry Idle</h3>
              <p>Select a clinical identity from the master patient index to initiate record oversight or medical abstract generation.</p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .patients-intelligence-workspace { animation: fadeIn 0.8s ease-out; }
        
        .tab-switcher-premium { display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: var(--bg-app); border-radius: 12px; width: fit-content; border: 1px solid var(--border-light); }
        .tab-item-premium { 
          padding: 8px 20px; border: none; background: transparent; color: var(--text-muted); 
          font-size: 0.8rem; font-weight: 800; cursor: pointer; border-radius: 9px; transition: var(--transition);
        }
        .tab-item-premium.active { background: white; color: var(--medical-primary); box-shadow: var(--shadow-sm); }

        .mini-patient-feed { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .mini-clinical-card { 
          display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; 
          cursor: pointer; transition: var(--transition); border: 1px solid transparent; 
        }
        .mini-clinical-card:hover { background: var(--bg-app); }
        .mini-clinical-card.active { background: white; border-color: var(--border-light); box-shadow: var(--shadow-sm); }
        .card-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-app); font-weight: 900; color: var(--text-muted); display: grid; place-items: center; font-size: 0.8rem; }
        .active .card-avatar { background: var(--medical-primary); color: white; }
        .card-intel { flex: 1; }
        .card-intel strong { display: block; font-size: 0.85rem; color: var(--text-primary); }
        .mrn-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; opacity: 0.7; }
        .card-badge { font-size: 0.7rem; font-weight: 800; color: var(--medical-primary); background: rgba(26, 35, 126, 0.05); padding: 2px 8px; border-radius: 4px; }

        .profile-header-premium { padding: 32px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: white; }
        .profile-identity { display: flex; align-items: center; gap: 24px; }
        .profile-glyph { width: 80px; height: 80px; border-radius: 20px; background: var(--medical-primary); color: white; display: grid; place-items: center; font-size: 2rem; font-weight: 900; box-shadow: 0 8px 32px rgba(26, 35, 126, 0.15); }
        .name-cluster h2 { font-size: 1.8rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0; }
        .clinical-id-badge { background: var(--bg-app); border: 1px solid var(--border-light); padding: 4px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); margin-left: 12px; vertical-align: middle; }
        .meta-stats { margin-top: 10px; font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 12px; align-items: center; }
        .meta-stats .divider { opacity: 0.2; }
        .meta-stats strong { color: var(--text-primary); }

        .clinical-dashboard-content { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
        .vital-intel-card { padding: 24px; border-radius: 20px; background: white; border: 1px solid var(--border-light); margin-bottom: 16px; position: relative; overflow: hidden; }
        .vital-intel-card .v-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 8px; }
        .vital-intel-card .v-value { font-size: 1.8rem; font-weight: 900; color: var(--text-primary); }
        .vital-intel-card .v-value.smaller { font-size: 1.2rem; }
        .vital-intel-card p { font-size: 0.65rem; font-weight: 700; color: var(--medical-success); margin-top: 8px; }
        .vital-intel-card.pulse::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: var(--medical-danger); animation: linePulse 2s infinite; }
        @keyframes linePulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }

        .medical-alert-zone { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .zone-card { padding: 16px; border-radius: 16px; border: 1px solid transparent; }
        .zone-card.danger { background: #fee2e2; border-color: #fecaca; }
        .zone-card.warning { background: #fef3c7; border-color: #fef08a; }
        .zone-card h6 { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .danger h6 { color: var(--medical-danger); }
        .warning h6 { color: #b45309; }
        .zone-card p { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0; }

        .journal-input-premium { padding: 20px; background: var(--bg-app); border-bottom: 1px solid var(--border-light); }
        .note-capture-form { display: grid; grid-template-columns: 180px 1fr 120px; gap: 12px; }
        .note-capture-form select, .note-capture-form input { border-radius: 10px; border: 1px solid var(--border-light); font-size: 0.85rem; padding: 10px; font-weight: 600; }
        .note-capture-form button { background: var(--medical-primary); color: white; border-radius: 10px; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.05em; border: none; cursor: pointer; }

        .journal-timeline-feed { padding: 24px; display: flex; flex-direction: column; gap: 24px; position: relative; }
        .timeline-entry { padding-left: 24px; position: relative; }
        .entry-marker { position: absolute; left: 0; top: 8px; width: 8px; height: 8px; border-radius: 50%; background: var(--border-light); border: 2px solid white; z-index: 2; }
        .timeline-entry::before { content: ''; position: absolute; left: 3px; top: 16px; bottom: -24px; width: 2px; background: var(--border-light); }
        .timeline-entry:last-child::before { display: none; }
        .entry-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .entry-header .tag { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; color: var(--text-muted); }
        .entry-header .timestamp { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
        .entry-payload { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); line-height: 1.6; }
        
        .timeline-entry.medications .entry-marker { background: var(--medical-secondary); }
        .timeline-entry.testReports .entry-marker { background: #f59e0b; }
        .timeline-entry.caseHistory .entry-marker { background: var(--medical-primary); }

        .registry-empty-state { text-align: center; padding: 120px 40px; }
        .glyph-container { width: 120px; height: 120px; background: var(--bg-app); border-radius: 50%; display: grid; place-items: center; margin: 0 auto 32px; color: var(--border-light); }
        .glyph-container svg { width: 60px; height: 60px; }
      `}</style>
    </div>
  );
}
