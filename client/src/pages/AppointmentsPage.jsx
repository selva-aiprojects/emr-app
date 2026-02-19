import { useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';
import AppointmentActions from '../components/AppointmentActions.jsx';
import { patientName, userName } from '../utils/format.js';

export default function AppointmentsPage({
  activeUser,
  session,
  patients,
  providers,
  walkins,
  appointments,
  users,
  setView,
  setActivePatientId,
  onCreateAppointment,
  onCreateWalkin,
  onSelfAppointment,
  onConvertWalkin,
  onSetAppointmentStatus,
  onReschedule
}) {
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'walkins'
  const isPatient = activeUser.role === 'Patient';

  return (
    <div className="appointments-intelligence-workspace">
      <div className="view-header-premium">
        <div className="header-labels">
          <div className="tab-switcher-premium">
            <button
              className={`tab-item-premium ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              Clinical Schedule
            </button>
            {!isPatient && (
              <button
                className={`tab-item-premium ${activeTab === 'walkins' ? 'active' : ''}`}
                onClick={() => setActiveTab('walkins')}
              >
                Reception Queue
              </button>
            )}
          </div>
          <h1>Scheduling <span>Intelligence</span> Hub</h1>
          <p>Coordinated resource planning and patient flow management</p>
        </div>
      </div>

      <div className="appointment-lattice-layout">
        <main className="booking-instrument-panel">
          {activeTab === 'appointments' && (
            <article className="oversight-section booking-card-premium">
              <div className="section-head-premium large">
                <div className="head-text">
                  <h3>{isPatient ? 'Secure Slot Reservation' : 'Coordinated Clinical Booking'}</h3>
                  <p>{isPatient ? 'Request a preferred encounter time with your physician' : 'Log a scheduled medical interaction in the central registry'}</p>
                </div>
              </div>

              <form className="medical-intake-form" onSubmit={isPatient ? onSelfAppointment : onCreateAppointment}>
                <div className="intake-grid">
                  {!isPatient && (
                    <div className="intake-section">
                      <h4>Patient Registry Context</h4>
                      <PatientSearch tenantId={session?.tenantId} />
                    </div>
                  )}

                  <div className="intake-section">
                    <h4>Logistics & Resource Allocation</h4>
                    <div className="input-field-premium">
                      <label>Assigned Clinical Provider</label>
                      <select name="providerId" required>
                        <option value="">Select Lead Physician</option>
                        {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-row-grid">
                      <div className="input-field-premium">
                        <label>Reserved Start Time</label>
                        <input name="start" type="datetime-local" required />
                      </div>
                      <div className="input-field-premium">
                        <label>Estimated Conclusion</label>
                        <input name="end" type="datetime-local" required />
                      </div>
                    </div>
                  </div>

                  <div className="intake-section">
                    <h4>Clinical Rationale</h4>
                    <div className="input-field-premium full">
                      <label>Encounter Objective</label>
                      <input name="reason" placeholder="Primary complaint or review objective..." required />
                    </div>
                  </div>
                </div>

                <div className="form-actions-premium">
                  <button type="submit" className="btn-primary-premium">
                    {isPatient ? 'Commit Reservation Request' : 'Authorize Schedule Entry'}
                  </button>
                </div>
              </form>
            </article>
          )}

          {activeTab === 'walkins' && !isPatient && (
            <article className="oversight-section admission-form-container">
              <div className="section-head-premium large">
                <div className="head-text">
                  <h3>Direct Reception Entry</h3>
                  <p>Immediate queue placement for unscheduled patient arrivals</p>
                </div>
              </div>

              <form className="medical-intake-form" onSubmit={onCreateWalkin}>
                <div className="intake-grid">
                  <div className="intake-section">
                    <h4>Temporary Identity</h4>
                    <div className="form-row-grid">
                      <div className="input-field-premium">
                        <label>Full Patient Name</label>
                        <input name="name" placeholder="Legal Identity" required />
                      </div>
                      <div className="input-field-premium">
                        <label>Verification Contact</label>
                        <input name="phone" placeholder="Emergency mobile" required />
                      </div>
                    </div>
                  </div>
                  <div className="intake-section">
                    <h4>Arrival Context</h4>
                    <div className="input-field-premium full">
                      <label>Immediate Clinical Objective</label>
                      <input name="reason" placeholder="Symptoms or service requested..." required />
                    </div>
                  </div>
                </div>
                <div className="form-actions-premium">
                  <button type="submit" className="btn-secondary-premium">Initialize Queue Status</button>
                </div>
              </form>
            </article>
          )}
        </main>

        <aside className="schedule-ledger-stack">
          <section className="oversight-section">
            <div className="section-head-premium">
              <div className="head-text">
                <h3>Daily Roster</h3>
                <p>{appointments.length} Confirmed Slots</p>
              </div>
              <div className="live-tag">REALTIME</div>
            </div>

            <div className="ledger-scroll-zone">
              {appointments.length === 0 ? (
                <div className="empty-observation">No clinical slots active for the current period.</div>
              ) : (
                appointments.sort((a, b) => new Date(a.start) - new Date(b.start)).map(a => (
                  <div key={a.id} className={`clinical-strip-card ${a.status}`}>
                    <div className="strip-time-block">
                      <strong>{new Date(a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>{new Date(a.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="strip-body">
                      <div className="patient-link" onClick={() => { setActivePatientId(a.patientId); setView('patients'); }}>
                        {patientName(a.patientId, patients)}
                      </div>
                      <div className="provider-meta">with {userName(a.providerId, users)}</div>
                    </div>
                    <div className="strip-controls">
                      <AppointmentActions
                        appointment={a}
                        user={activeUser}
                        onStatus={(status) => onSetAppointmentStatus(a.id, status)}
                        onReschedule={() => onReschedule(a)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {!isPatient && (
            <section className="oversight-section queue-stack">
              <div className="section-head-premium">
                <div className="head-text">
                  <h3>Reception Queue</h3>
                  <p>{walkins.length} Unscheduled Arrivals</p>
                </div>
              </div>
              <div className="ledger-scroll-zone mini">
                {walkins.length === 0 ? (
                  <div className="empty-observation">Reception area cleared.</div>
                ) : (
                  walkins.map(w => (
                    <div key={w.id} className={`walkin-entry-card ${w.status}`}>
                      <div className="entry-glyph">{(w.name || 'P')[0]}</div>
                      <div className="entry-intel">
                        <strong>{w.name}</strong>
                        <span>{w.reason}</span>
                      </div>
                      <div className="entry-action">
                        {w.status !== 'converted' ? (
                          <button onClick={() => onConvertWalkin(w.id)} className="btn-mini-action">ADMIT</button>
                        ) : (
                          <span className="status-badge-mini">LOGGED</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      <style>{`
        .appointments-intelligence-workspace { animation: fadeIn 0.8s ease-out; }
        
        .tab-switcher-premium { display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: var(--bg-app); border-radius: 12px; width: fit-content; border: 1px solid var(--border-light); }
        .tab-item-premium { 
          padding: 8px 20px; border: none; background: transparent; color: var(--text-muted); 
          font-size: 0.8rem; font-weight: 800; cursor: pointer; border-radius: 9px; transition: var(--transition);
        }
        .tab-item-premium.active { background: white; color: var(--medical-primary); box-shadow: var(--shadow-sm); }

        .appointment-lattice-layout { display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: start; }
        
        .btn-mini-action { background: white; border: 1px solid var(--border-light); color: var(--medical-secondary); font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: var(--transition); }
        .btn-mini-action:hover { background: var(--medical-secondary); color: white; border-color: var(--medical-secondary); }
        .status-badge-mini { font-size: 0.6rem; font-weight: 900; color: var(--medical-success); background: rgba(76, 175, 80, 0.1); padding: 2px 8px; border-radius: 4px; }

        .ledger-scroll-zone { padding: 20px; display: flex; flex-direction: column; gap: 12px; max-height: 500px; overflow-y: auto; }
        .ledger-scroll-zone.mini { max-height: 250px; }
        
        .clinical-strip-card { display: flex; align-items: center; padding: 14px; border-radius: 16px; background: var(--bg-app); border: 1px solid transparent; transition: var(--transition); }
        .clinical-strip-card:hover { background: white; border-color: var(--border-light); box-shadow: var(--shadow-sm); }
        .strip-time-block { width: 70px; border-right: 1px solid var(--border-light); margin-right: 16px; display: flex; flex-direction: column; }
        .strip-time-block strong { font-size: 0.85rem; color: var(--text-primary); }
        .strip-time-block span { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        .strip-body { flex: 1; }
        .patient-link { font-weight: 800; font-size: 0.9rem; color: var(--medical-primary); cursor: pointer; }
        .provider-meta { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; }

        .walkin-entry-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; border: 1px solid var(--bg-app); }
        .entry-glyph { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-app); display: grid; place-items: center; font-weight: 900; color: var(--text-muted); font-size: 0.75rem; }
        .entry-intel { flex: 1; }
        .entry-intel strong { display: block; font-size: 0.8rem; color: var(--text-primary); }
        .entry-intel span { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }

        .live-tag { font-size: 0.6rem; font-weight: 900; color: var(--medical-danger); background: rgba(244, 67, 54, 0.1); padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; }
        .live-tag::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: var(--medical-danger); animation: blink 1s infinite; }
        @keyframes blink { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
      `}</style>
    </div>
  );
}
