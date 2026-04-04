import { GoogleGenerativeAI } from '@google/generative-ai';
import * as repo from '../db/repository.js';

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''; // Use GEMINI_API_KEY from .env
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generates a clinical summary for a patient's entire health history.
 */
export async function generatePatientSummary(tenantId, patientId) {
  try {
    // 1. Fetch comprehensive patient data (including documents)
    const patient = await repo.getPatientById(patientId, tenantId);
    if (!patient) throw new Error('Patient not found');

    // 2. Prepare the prompt
    const prompt = `
      You are a specialized Clinical AI assistant for hospital management systems.
      Provide a concise longitudinal clinical overview for the following patient, incorporating both recent encounters and historical records:
      
      Patient: ${patient.firstName} ${patient.lastName} (Age: ${calculateAge(patient.dob)})
      Medical History: ${JSON.stringify(patient.medicalHistory || 'None provided')}
      Historical Documents: ${JSON.stringify((patient.medicalHistory?.documents || []).map(d => ({ title: d.title, category: d.category, tags: d.tags })))}
      Case History: ${JSON.stringify(patient.caseHistory || [])}
      Active Medications: ${JSON.stringify(patient.medications || [])}
      Prescriptions: ${JSON.stringify(patient.prescriptions || [])}
      Lab Results: ${JSON.stringify(patient.testReports || [])}

      Format your response with the following sections:
      1. Clinical Snapshot (Concise Summary highlighting connections between historical data and recent findings)
      2. Key Historical Context (Findings from uploaded documents)
      3. Known Risk Factors (Allergies/Conditions)
      4. Treatment Trajectory (Recent progress)
      5. Suggestions (Screening/Observations - include a medical disclaimer)

      Use medical terminology but keep it actionable for a physician.
    `;

    // 3. Fallback to mock if key is missing (for local dev/demo)
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY missing - returning simulated response.');
      return mockSummary(patient);
    }

    // 4. Generate content
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Summary generation failed:', error);
    throw error;
  }
}

/**
 * Suggests a treatment plan based on current symptoms/diagnosis.
 */
export async function suggestTreatmentPlan(tenantId, visitDetails) {
  try {
    const { complaint, diagnosis, history } = visitDetails;
    
    const prompt = `
      As a clinical advisor, suggest a treatment plan for the following encounter:
      Complaint: ${complaint}
      Diagnosis: ${diagnosis}
      Brief History: ${history}

      Provide:
      - Recommended Meds (Generic names where possible)
      - Lifestyle/Dietary advice
      - Follow-up timeline
      - Red flag markers
      
      Disclaimer: This is an AI simulation. All clinical decisions must be verified by a board-certified physician.
    `;

    if (!GEMINI_API_KEY) {
      return "Simulated treatment plan based on " + diagnosis + " (Set GEMINI_API_KEY for live insights).";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI treatment plan suggestion failed:', error);
    throw error;
  }
}

/**
 * Generates a formal discharge summary for an inpatient stay.
 */
export async function generateDischargeSummary(tenantId, encounterId) {
  try {
    const encounters = await repo.getEncounters(tenantId);
    const encounter = encounters.find(e => e.id === encounterId);
    if (!encounter) throw new Error('Encounter for discharge not found');

    const patient = await repo.getPatientById(encounter.patient_id, tenantId);

    const prompt = `
      Generate a professional, formal Inpatient Discharge Summary for the following clinical stay:
      
      Patient: ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn})
      Admission Date: ${new Date(encounter.created_at).toLocaleDateString()}
      Discharge Date: ${new Date().toLocaleDateString()}
      Primary Diagnosis: ${encounter.diagnosis}
      Clinical Notes: ${encounter.notes}
      Vitals on Stay: BP ${encounter.bp}, HR ${encounter.hr}
      Medications Prescribed: ${JSON.stringify(patient.medicalHistory?.prescriptions || [])}

      Structure the report as follows:
      1. Final Diagnosis (Primary and secondary)
      2. Hospital Course (Narrative of treatment and progress)
      3. Discharge Medications (Clear list with dosages)
      4. Follow-up Instructions (Timeline and specific warnings)
      5. Condition at Discharge (Stable, etc.)

      Use a formal medical reporting tone.
    `;

    if (!GEMINI_API_KEY) {
      return "### SIMULATED DISCHARGE SUMMARY\n\n**Diagnosis:** " + encounter.diagnosis + "\n\n**Stability:** Satisfactory.\n\n**Medications:** As per hospital record.\n\n*Set GEMINI_API_KEY for live report generation.*";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Discharge summary failed:', error);
    throw error;
  }
}

/**
 * Analyzes lab results and provides a summary.
 */
export async function interpretLabResults(tenantId, labOrderId, resultsData) {
  try {
    const prompt = `
      As a clinical pathologist's assistant, analyze the following laboratory results:
      
      Order ID: ${labOrderId}
      Test Results: ${JSON.stringify(resultsData)}
      
      Provide:
      1. Summary of Abnormal Values (Highlighting anything outside standard reference ranges)
      2. Potential Clinical Implications
      3. Suggested Next Steps (Further diagnostic tests or specialist consultations)
      
      Disclaimer: This is an AI analysis. All results must be reviewed by the ordering physician and verified against reference laboratory standards.
    `;

    if (!GEMINI_API_KEY) {
      return "### SIMULATED LAB INTERPRETATION\n\nResults for Order " + labOrderId + " appear to show normal variance. Please verify against critical flag markers.\n\n*Set GEMINI_API_KEY for live analysis.*";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Lab interpretation failed:', error);
    throw error;
  }
}

/**
 * Analyzes a medical image (X-ray, CT, etc.) and provides a summary.
 */
export async function analyzeMedicalImage(tenantId, documentId, imageUrl) {
  try {
    const prompt = `
      You are an expert radiologist and medical image analyst.
      Analyze the clinical evidence provided in this document (Title/Metadata) or image:
      Document ID: ${documentId}
      Image URL: ${imageUrl || 'Not provided'}
      
      Provide:
      1. Finding Breakdown (Key observations)
      2. Clinical Impressions (Potential pathologies)
      3. Recommended Correlating Tests
      
      Disclaimer: This is an AI-assisted analysis. Results must be verified by a certified radiologist before clinical use.
    `;

    if (!GEMINI_API_KEY) {
      return "### SIMULATED IMAGE ANALYSIS\n\nObservations for document " + documentId + " suggest minor variance in bone density. No acute fractures detected in simulation mode.\n\n*Set GEMINI_API_KEY for live Vision analysis.*";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Image analysis failed:', error);
    throw error;
  }
}

/**
 * Checks for potential drug-drug interactions.
 */
export async function checkDrugInteractions(tenantId, medications) {
  try {
    const prompt = `
      As an AI clinical pharmacist, check for potential interactions between these medications:
      
      Current/New Medications: ${JSON.stringify(medications)}
      
      Categorize findings as:
      - CONTRAINDICATED (Must not be used together)
      - MAJOR INTERACTION (Avoid if possible)
      - MODERATE INTERACTION (Monitor closely)
      - MINOR/NO INTERACTION
      
      Provide a brief rationale for each major/contraindicated finding.
      
      Disclaimer: This is an AI safety check. Cross-reference with official pharmacopeia before prescribing.
    `;

    if (!GEMINI_API_KEY) {
      return "### SIMULATED INTERACTION CHECK\n\nChecked " + medications.length + " medications. No contraindications found in demo mode.\n\n*Set GEMINI_API_KEY for live clinical safety checks.*";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Interaction check failed:', error);
    throw error;
  }
}

// Helper utilities
function calculateAge(dob) {
  if (!dob) return 'Unknown';
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function mockSummary(patient) {
  return `
### AI Clinical Snapshot (Simulated)
The patient, ${patient.firstName} ${patient.lastName}, is a ${calculateAge(patient.dob)}-year-old with a reported history of ${patient.medicalHistory?.chronicConditions || 'no chronic conditions'}. 

### Known Risk Factors
- **Allergies**: ${patient.medicalHistory?.allergies || 'None recorded'}
- **Surgeries**: ${patient.medicalHistory?.surgeries || 'None recorded'}

### Treatment Trajectory
Based on ${patient.prescriptions?.length || 0} active prescriptions, the patient is currently on a managed healthcare path. Recent encounters suggest stabilization.

### Suggestions
- Ensure updated cardiac screening if over 40.
- Verify patient adherence to current medications.

*Note: Live AI insights require a valid GEMINI_API_KEY.*
  `;
}
