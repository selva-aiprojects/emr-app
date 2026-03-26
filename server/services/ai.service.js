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
    // 1. Fetch comprehensive patient data
    const patient = await repo.getPatientById(patientId, tenantId);
    if (!patient) throw new Error('Patient not found');

    // 2. Prepare the prompt
    const prompt = `
      You are a specialized Clinical AI assistant for hospital management systems.
      Provide a concise longitudinal clinical overview for the following patient:
      
      Patient: ${patient.firstName} ${patient.lastName} (Age: ${calculateAge(patient.dob)})
      Medical History: ${JSON.stringify(patient.medicalHistory || 'None provided')}
      Case History: ${JSON.stringify(patient.caseHistory || [])}
      Active Medications: ${JSON.stringify(patient.medications || [])}
      Prescriptions: ${JSON.stringify(patient.prescriptions || [])}
      Lab Results: ${JSON.stringify(patient.testReports || [])}

      Format your response with the following sections:
      1. Clinical Snapshot (Concise Summary)
      2. Known Risk Factors (Allergies/Conditions)
      3. Treatment Trajectory (Recent progress)
      4. Suggestions (Screening/Observations - include a medical disclaimer)

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
