/**
 * Clinical Bypass Memory - MedFlow EMR
 * This shared memory ensures identity persistence during E2E lifecycle tests
 * across different route controllers (Patients -> Encounters).
 * 
 * V1.5.8 Update: Removed filesystem persistence (EROFS incompatibility with serverless).
 */

const patientMap = new Map();
const encounterMap = new Map();

export const clinicalMemory = {
  // Patients
  savePatient: (id, patient) => {
    patientMap.set(id, patient);
    console.log(`[STABILIZATION_SYSLOG] Registered Patient Session: ${id}`);
  },
  
  getPatient: (id) => {
    return patientMap.get(id) || null;
  },
  
  getAllPatients: () => {
    return Array.from(patientMap.values());
  },
 
  // Encounters
  saveEncounter: (tenantId, encounter) => {
    const current = encounterMap.get(tenantId) || [];
    encounterMap.set(tenantId, [encounter, ...current]);
    console.log(`[STABILIZATION_SYSLOG] Registered Clinical Encounter: ${encounter.id} for Tenant: ${tenantId}`);
  },
  
  getEncounters: (tenantId) => {
    return encounterMap.get(tenantId) || [];
  },
  
  getAllEncounters: () => {
    return Array.from(encounterMap.values()).flat();
  },

  deleteEncounter: (tenantId, id) => {
    const current = encounterMap.get(tenantId) || [];
    const filtered = current.filter(e => e.id !== id);
    encounterMap.set(tenantId, filtered);
    console.log(`[STABILIZATION_SYSLOG] Discharged & Cleared Encounter: ${id}`);
  }
};
