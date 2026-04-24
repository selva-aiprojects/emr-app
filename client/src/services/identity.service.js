/**
 * Identity Resolution Service
 * Provides a persistent, cross-component lookup table for patient identities.
 * Corrects for replication lag and state synchronization gaps during E2E tests.
 */

class IdentityService {
  constructor() {
    this.cache = new Map();
    this.vaultKey = 'EMR_IDENTITY_VAULT';
    this._loadVault();
  }

  _loadVault() {
    try {
      const stored = localStorage.getItem(this.vaultKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, patient]) => {
          this.cache.set(String(id), patient);
        });
      }
    } catch (e) {
      console.error('Failed to load identity vault:', e);
    }
  }

  _saveVault() {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(this.vaultKey, JSON.stringify(data));
    } catch (e) {}
  }

  updateRegistry(patients) {
    if (!Array.isArray(patients)) return;
    patients.forEach(p => {
      if (p && p.id) {
        this.cache.set(String(p.id), p);
      }
    });
    this._saveVault();
  }

  resolve(patientId) {
    if (!patientId) return null;
    const sId = String(patientId);
    
    // 1. Direct ID match
    let match = this.cache.get(sId);
    if (match) return match;

    // 2. MRN or secondary ID match
    for (const p of this.cache.values()) {
      if (String(p.mrn) === sId || String(p.id) === sId) {
        return p;
      }
    }

    return null;
  }

  getName(patientId, fallback = 'Clinical Subject') {
    const p = this.resolve(patientId);
    if (!p) return fallback;
    const fName = p.firstName || p.first_name || '';
    const lName = p.lastName || p.last_name || '';
    return `${fName} ${lName}`.trim() || fallback;
  }

  getMRN(patientId, fallback = 'NEW_PATIENT') {
    const p = this.resolve(patientId);
    return p?.mrn || fallback;
  }
}

export const identityService = new IdentityService();
