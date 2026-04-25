/**
 * AI API Methods
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function aiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/ai/v1${endpoint}`;
  const token = localStorage.getItem('emr_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI Request failed');
  }
  return await response.json();
}

export async function getAIPatientSummary(patientId) {
  return await aiRequest('/patient-summary', {
    method: 'POST',
    body: JSON.stringify({ patientId }),
  });
}

export async function getAITreatmentSuggestion(data) {
  return await aiRequest('/suggest-treatment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAIDischargeSummary(encounterId) {
  return await aiRequest('/discharge-summary', {
    method: 'POST',
    body: JSON.stringify({ encounterId }),
  });
}

export async function getAIImageAnalysis(documentId, imageUrl = null) {
  return await aiRequest('/analyze-image', {
    method: 'POST',
    body: JSON.stringify({ documentId, imageUrl }),
  });
}
