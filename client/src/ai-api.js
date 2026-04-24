/**
 * AI API Methods
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

import { apiRequest } from './api.js';

export async function getAIPatientSummary(patientId) {
  return await apiRequest('/ai/patient-summary', {
    method: 'POST',
    body: JSON.stringify({ patientId }),
  });
}

export async function getAITreatmentSuggestion(data) {
  return await apiRequest('/ai/suggest-treatment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export async function getAIDischargeSummary(encounterId) {
  return await apiRequest('/ai/discharge-summary', {
    method: 'POST',
    body: JSON.stringify({ encounterId }),
  });
}

export async function getAIImageAnalysis(documentId, imageUrl = null) {
  return await apiRequest('/ai/analyze-image', {
    method: 'POST',
    body: JSON.stringify({ documentId, imageUrl }),
  });
}
