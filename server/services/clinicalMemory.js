import fs from 'fs';
import path from 'path';

/**
 * Clinical Bypass Memory - MedFlow EMR
 * This shared memory ensures identity persistence during E2E lifecycle tests
 * across different route controllers (Patients -> Encounters).
 */

const patientStore = new Map();
const encounterStore = new Map();

export const clinicalMemory = {
  // Patients
  savePatient: (id, patient) => {
    const dumpPath = path.join(process.cwd(), 'clinical_memory_dump.json');
    let data = { patientStore: {}, encounterStore: {} };
    try {
      if (fs.existsSync(dumpPath)) data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    } catch (e) {}

    data.patientStore[id] = patient;
    fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2));
    console.log(`[FILE_PERSISTENCE] Saved Patient: ${id} to ${dumpPath}`);
  },
  getPatient: (id) => {
    const dumpPath = path.join(process.cwd(), 'clinical_memory_dump.json');
    try {
      if (fs.existsSync(dumpPath)) {
        const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
        return data.patientStore[id];
      }
    } catch (e) {}
    return null;
  },
 
  // Encounters
  saveEncounter: (tenantId, encounter) => {
    const dumpPath = path.join(process.cwd(), 'clinical_memory_dump.json');
    let data = { patientStore: {}, encounterStore: {} };
    try {
      if (fs.existsSync(dumpPath)) data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    } catch (e) {}

    const current = data.encounterStore[tenantId] || [];
    data.encounterStore[tenantId] = [encounter, ...current];
    fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2));
    console.log(`[FILE_PERSISTENCE] Saved Encounter: ${encounter.id} to ${dumpPath}`);
  },
  
  getEncounters: (tenantId) => {
    const dumpPath = path.join(process.cwd(), 'clinical_memory_dump.json');
    try {
      if (fs.existsSync(dumpPath)) {
        const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
        return data.encounterStore[tenantId] || [];
      }
    } catch (e) {}
    return [];
  },
  
  getAllEncounters: () => {
    const dumpPath = path.join(process.cwd(), 'clinical_memory_dump.json');
    try {
      if (fs.existsSync(dumpPath)) {
        const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
        return Object.values(data.encounterStore).flat();
      }
    } catch (e) {}
    return [];
  }
};
