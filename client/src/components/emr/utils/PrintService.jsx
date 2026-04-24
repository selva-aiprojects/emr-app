export class PrintService {
  static printEncounterSummary(tenant, selectedPatient, selectedEncounter) {
    const w = window.open('', '_blank', 'width=800,height=900');
    const dateStr = new Date(selectedEncounter.createdAt || Date.now()).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Clinical Encounter Summary - ${selectedPatient.firstName} ${selectedPatient.lastName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1F2937; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-bottom: 4px solid #10B981; padding-bottom: 25px; margin-bottom: 40px; }
          .clinic-info h1 { color: #10B981; margin: 0; font-size: 28px; font-weight: 900; }
          .patient-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; background: #F3F4F6; padding: 24px; border-radius: 12px; margin-bottom: 30px; }
          .patient-grid div span { color: #64748B; font-size: 10px; text-transform: uppercase; font-weight: 900; display: block; margin-bottom: 6px; }
          .patient-grid div strong { font-size: 14px; color: #1F2937; font-weight: 700; }
          .section { margin-bottom: 30px; }
          .section h3 { color: #1F2937; font-size: 18px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
          .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .vital-item { background: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; }
          .vital-item label { display: block; font-size: 12px; color: #64748B; font-weight: 600; margin-bottom: 5px; }
          .vital-item strong { font-size: 16px; color: #1F2937; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-info">
            <h1>${tenant?.name || 'Hospital Management System'}</h1>
            <p>Clinical Encounter Summary</p>
          </div>
          <div style="text-align: right">
            <p style="font-size: 14px; margin:0; font-weight: 900;">Date: ${dateStr}</p>
            <p style="font-size: 12px; color:#64748B; margin:4px 0;">Encounter ID: ${selectedEncounter.id?.slice(0, 12).toUpperCase()}</p>
          </div>
        </div>

        <div class="patient-grid">
          <div><span>PATIENT NAME</span><strong>${selectedPatient.firstName} ${selectedPatient.lastName}</strong></div>
          <div><span>MRN</span><strong>${selectedPatient.mrn || 'N/A'}</strong></div>
          <div><span>AGE/GENDER</span><strong>${selectedPatient.age || 'N/A'} / ${selectedPatient.gender || 'N/A'}</strong></div>
          <div><span>ENCOUNTER TYPE</span><strong>${selectedEncounter.type?.toUpperCase() || 'N/A'}</strong></div>
        </div>

        <div class="section">
          <h3>Chief Complaint</h3>
          <p>${selectedEncounter.chiefComplaint || 'Not recorded'}</p>
        </div>

        <div class="section">
          <h3>Diagnosis</h3>
          <p>${selectedEncounter.diagnosis || 'Not recorded'}</p>
        </div>

        <div class="section">
          <h3>Vital Signs</h3>
          <div class="vitals-grid">
            <div class="vital-item">
              <label>Blood Pressure</label>
              <strong>${selectedEncounter.vitals?.bp?.systolic || '--'}/${selectedEncounter.vitals?.bp?.diastolic || '--'} mmHg</strong>
            </div>
            <div class="vital-item">
              <label>Heart Rate</label>
              <strong>${selectedEncounter.vitals?.heartRate || '--'} bpm</strong>
            </div>
            <div class="vital-item">
              <label>Temperature</label>
              <strong>${selectedEncounter.vitals?.temperature || '--'}°F</strong>
            </div>
            <div class="vital-item">
              <label>Oxygen Saturation</label>
              <strong>${selectedEncounter.vitals?.oxygenSat || '--'}%</strong>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Assessment</h3>
          <p>${selectedEncounter.assessment || 'Not recorded'}</p>
        </div>

        <div class="section">
          <h3>Treatment Plan</h3>
          <p>${selectedEncounter.plan || 'Not recorded'}</p>
        </div>

        <div class="section">
          <h3>Clinical Notes</h3>
          <p>${selectedEncounter.notes || 'No additional notes recorded.'}</p>
        </div>
      </body>
      </html>
    `;

    w.document.write(html);
    w.document.close();
  }
}
