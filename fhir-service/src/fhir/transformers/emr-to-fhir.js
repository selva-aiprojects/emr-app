/**
 * FHIR R4 Resource Transformer Service
 * Converts EMR data models to FHIR R4 resources and vice versa
 * 
 * Supports: Patient, Encounter, Condition, Procedure, Observation,
 *           DiagnosticReport, MedicationRequest, MedicationDispense,
 *           MedicationAdministration, ServiceRequest, Account, ChargeItem
 */

// =====================================================
// PATIENT TRANSFORMER (FHIR Patient Resource)
// =====================================================
export const transformPatientToFHIR = (emrPatient) => {
  return {
   resourceType: 'Patient',
   id: emrPatient.id,
   meta: {
     versionId: '1',
      lastUpdated: emrPatient.updated_at || new Date().toISOString(),
      source: '#medflow-emr',
     profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient']
    },
   identifier: [{
      use: 'usual',
      type: {
       coding: [{
         system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
         code: 'MR',
         display: 'Medical Record Number'
        }]
      },
     system: `urn:oid:2.16.840.1.113883.4.1#${emrPatient.tenant_id}`,
      value: emrPatient.mrn
    }],
    active: true,
    name: [{
      use: 'official',
      family: emrPatient.last_name || emrPatient.family_name,
      given: [emrPatient.first_name || emrPatient.given_name],
     prefix: emrPatient.name_prefix,
     suffix: emrPatient.name_suffix
    }],
    telecom: buildPatientTelecom(emrPatient),
    gender: mapGender(emrPatient.gender),
    birthDate: formatDateForFHIR(emrPatient.date_of_birth),
   address: buildPatientAddress(emrPatient),
   maritalStatus: emrPatient.marital_status ? {
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
       code: emrPatient.marital_status
      }]
    } : null,
   communication: [{
      language: {
       coding: [{
         system: 'urn:ietf:bcp:47',
         code: emrPatient.communication_language || 'en-US'
        }]
      },
     preferred: emrPatient.preferred_contact_method === 'language'
    }],
    generalPractitioner: emrPatient.general_practitioner_id ? [{
     reference: `Practitioner/${emrPatient.general_practitioner_id}`
    }] : null,
   managingOrganization: emrPatient.managing_organization_id ? {
     reference: `Organization/${emrPatient.managing_organization_id}`
    } : null,
   extension: buildPatientExtensions(emrPatient)
  };
};

const buildPatientTelecom = (patient) => {
  const telecom = [];
  
  if (patient.phone) {
    telecom.push({
     system: 'phone',
      value: patient.phone,
      use: 'home'
    });
  }
  
  if (patient.mobile) {
    telecom.push({
     system: 'phone',
      value: patient.mobile,
      use: 'mobile'
    });
  }
  
  if (patient.email) {
    telecom.push({
     system: 'email',
      value: patient.email,
      use: 'home'
    });
  }
  
  return telecom;
};

const buildPatientAddress = (patient) => {
  if (!patient.address) return null;
  
  return [{
    use: 'home',
    line: parseAddressLines(patient.address),
    city: patient.city,
   district: patient.state,
   postalCode: patient.zip_code,
   country: patient.country || 'USA'
  }];
};

const parseAddressLines = (address) => {
  // Simple parsing - can be enhanced based on address format
  return address.split('\n').filter(line => line.trim());
};

const buildPatientExtensions = (patient) => {
  const extensions = [];
  
  // Birth place extension
  if (patient.birth_place) {
   extensions.push({
      url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex',
      valueString: patient.birth_place
    });
  }
  
  // Ethnicity extension (US Core)
  if (patient.ethnicity) {
   extensions.push({
      url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity',
     extension: [{
        url: 'ombCategory',
        valueCoding: {
         system: 'urn:oid:2.16.840.1.113883.6.238',
         code: patient.ethnicity
        }
      }]
    });
  }
  
  return extensions.length > 0 ? extensions: null;
};

// =====================================================
// ENCOUNTER TRANSFORMER (FHIR Encounter Resource)
// =====================================================
export const transformEncounterToFHIR = (emrEncounter) => {
  return {
   resourceType: 'Encounter',
   id: emrEncounter.id,
   meta: {
     versionId: '1',
      lastUpdated: emrEncounter.updated_at || new Date().toISOString(),
     profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter']
    },
   identifier: [{
      use: 'official',
     system: `urn:oid:2.16.840.1.113883.4.1#${emrEncounter.tenant_id}`,
      value: emrEncounter.encounter_number || emrEncounter.id
    }],
    status: mapEncounterStatus(emrEncounter.status),
    class: {
     system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
     code: emrEncounter.encounter_class || 'AMB',
     display: mapEncounterClassDisplay(emrEncounter.encounter_class)
    },
   priority: {
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
       code: emrEncounter.priority?.toString() || '5'
      }]
    },
   subject: {
     reference: `Patient/${emrEncounter.patient_id}`,
      type: 'Patient'
    },
   participant: [{
      type: [{
       coding: [{
         system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
         code: 'ATND',
         display: 'attender'
        }]
      }],
     individual: {
       reference: `Practitioner/${emrEncounter.provider_id}`,
        type: 'Practitioner'
      }
    }],
   period: {
      start: emrEncounter.visit_date || emrEncounter.start_datetime,
     end: emrEncounter.end_datetime
    },
   reasonCode: emrEncounter.chief_complaint ? [{
      text: emrEncounter.chief_complaint
    }] : null,
   diagnosis: emrEncounter.diagnosis ? [{
     condition: {
       reference: `Condition/${emrEncounter.diagnosis_id || emrEncounter.id}`,
        type: 'Condition'
      },
      use: {
       coding: [{
         system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role',
         code: 'DD',
         display: 'Discharge diagnosis'
        }]
      },
      rank: 1
    }] : null,
   serviceProvider: {
     reference: `Organization/${emrEncounter.tenant_id}`,
      type: 'Organization'
    },
    hospitalization: {
     admissionSource: emrEncounter.hospitalization_admission_source ? {
       coding: [{
         system: 'http://terminology.hl7.org/CodeSystem/admission-source',
         code: emrEncounter.hospitalization_admission_source
        }]
      } : null,
     dischargeDisposition: emrEncounter.discharge_disposition ? {
       coding: [{
         system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition',
         code: emrEncounter.discharge_disposition
        }]
      } : null
    },
    location: emrEncounter.location_id ? [{
      location: {
       reference: `Location/${emrEncounter.location_id}`
      },
      status: 'active',
     period: {
        start: emrEncounter.visit_date
      }
    }] : null
  };
};

// =====================================================
// CONDITION TRANSFORMER (FHIR Condition Resource)
// Problem List, Diagnoses
// =====================================================
export const transformConditionToFHIR = (emrCondition) => {
  return {
   resourceType: 'Condition',
   id: emrCondition.condition_id,
   meta: {
     versionId: '1',
      lastUpdated: emrCondition.updated_at || new Date().toISOString(),
     profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition']
    },
    clinicalStatus: {
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
       code: emrCondition.clinical_status
      }]
    },
   verificationStatus: {
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
       code: emrCondition.verification_status
      }]
    },
   category: [{
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/condition-category',
       code: emrCondition.category || 'problem-list-item'
      }]
    }],
   severity: emrCondition.severity ? {
     coding: [{
       system: 'http://snomed.info/sct',
       code: mapSeverityToSNOMED(emrCondition.severity)
      }]
    } : null,
   code: {
     coding: [
        ...(emrCondition.code_snomed ? [{
         system: 'http://snomed.info/sct',
         code: emrCondition.code_snomed,
         display: emrCondition.display_name
        }] : []),
        ...(emrCondition.code_icd10 ? [{
         system: 'http://hl7.org/fhir/sid/icd-10',
         code: emrCondition.code_icd10,
         display: emrCondition.display_name
        }] : [])
      ],
      text: emrCondition.display_name || emrCondition.code_text
    },
   bodySite: emrCondition.body_site ? [{
     coding: [{
       system: 'http://snomed.info/sct',
       code: emrCondition.body_site
      }]
    }] : null,
   subject: {
     reference: `Patient/${emrCondition.patient_id}`,
      type: 'Patient'
    },
   encounter: emrCondition.encounter_id ? {
     reference: `Encounter/${emrCondition.encounter_id}`,
      type: 'Encounter'
    } : null,
   onsetDateTime: formatDateForFHIR(emrCondition.onset_datetime),
    abatementDateTime: formatDateForFHIR(emrCondition.abatement_datetime),
   recordedDate: formatDateForFHIR(emrCondition.recorded_date),
   recorder: emrCondition.recorder_id ? {
     reference: `Practitioner/${emrCondition.recorder_id}`,
      type: 'Practitioner'
    } : null,
   asserter: emrCondition.asserter_id ? {
     reference: `Practitioner/${emrCondition.asserter_id}`,
      type: 'Practitioner'
    } : null,
    stage: emrCondition.stage_summary ? {
     summary: {
        text: emrCondition.stage_summary
      }
    } : null,
    evidence: emrCondition.evidence_code?.length > 0 ? {
     code: emrCondition.evidence_code.map(code => ({
       coding: [{
         system: 'http://snomed.info/sct',
         code: code
        }]
      }))
    } : null,
   note: emrCondition.note ? [{
      text: emrCondition.note
    }] : null
  };
};

// =====================================================
// OBSERVATION TRANSFORMER (FHIR Observation)
// Vital Signs, Lab Results
// =====================================================
export const transformObservationToFHIR = (emrObservation) => {
  return {
   resourceType: 'Observation',
   id: emrObservation.observation_id,
   meta: {
     versionId: '1',
      lastUpdated: emrObservation.updated_at || new Date().toISOString(),
     profile: getObservationProfile(emrObservation.category)
    },
    status: emrObservation.status,
   category: [{
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/observation-category',
       code: emrObservation.category,
       display: mapCategoryDisplay(emrObservation.category)
      }]
    }],
   code: {
     coding: [
        ...(emrObservation.code_loinc ? [{
         system: 'http://loinc.org',
         code: emrObservation.code_loinc,
         display: emrObservation.display_name
        }] : []),
        ...(emrObservation.code_snomed ? [{
         system: 'http://snomed.info/sct',
         code: emrObservation.code_snomed,
         display: emrObservation.display_name
        }] : [])
      ],
      text: emrObservation.display_name
    },
   subject: {
     reference: `Patient/${emrObservation.patient_id}`,
      type: 'Patient'
    },
   encounter: emrObservation.encounter_id ? {
     reference: `Encounter/${emrObservation.encounter_id}`,
      type: 'Encounter'
    } : null,
    effectiveDateTime: formatDateForFHIR(emrObservation.effective_datetime),
    issued: formatDateForFHIR(emrObservation.issued_datetime),
   performer: emrObservation.performer_id ? [{
     reference: `Practitioner/${emrObservation.performer_id}`,
      type: 'Practitioner'
    }] : null,
    valueQuantity: emrObservation.value_quantity !== null && emrObservation.value_quantity !== undefined ? {
      value: emrObservation.value_quantity,
      unit: emrObservation.value_quantity_unit,
     system: 'http://unitsofmeasure.org',
     code: emrObservation.value_quantity_unit
    } : null,
   interpretation: emrObservation.interpretation ? [{
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
       code: emrObservation.interpretation
      }]
    }] : null,
   referenceRange: (emrObservation.reference_range_low !== null || emrObservation.reference_range_high !== null) ? [{
      low: emrObservation.reference_range_low !== null ? {
        value: emrObservation.reference_range_low,
        unit: emrObservation.value_quantity_unit
      } : null,
      high: emrObservation.reference_range_high !== null ? {
        value: emrObservation.reference_range_high,
        unit: emrObservation.value_quantity_unit
      } : null,
      text: emrObservation.reference_range_text
    }] : null,
   method: emrObservation.method ? {
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationMethod',
       code: emrObservation.method
      }]
    } : null,
   note: emrObservation.note ? [{
      text: emrObservation.note
    }] : null
  };
};

const getObservationProfile = (category) => {
  const profiles = {
    'vital-signs': 'http://hl7.org/fhir/StructureDefinition/vitalsigns',
    'laboratory': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-laboratory',
    'imaging': 'http://hl7.org/fhir/StructureDefinition/imaging-study',
    'social-history': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-social-history'
  };
  return profiles[category] || 'http://hl7.org/fhir/StructureDefinition/Observation';
};

// =====================================================
// MEDICATION REQUEST TRANSFORMER (FHIR MedicationRequest)
// Prescriptions
// =====================================================
export const transformMedicationRequestToFHIR = (emrPrescription, prescriptionItems = []) => {
  return {
   resourceType: 'MedicationRequest',
   id: emrPrescription.id,
   meta: {
     versionId: '1',
      lastUpdated: emrPrescription.updated_at || new Date().toISOString(),
     profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest']
    },
   identifier: [{
      use: 'official',
     system: `urn:oid:2.16.840.1.113883.4.1#${emrPrescription.tenant_id}`,
      value: emrPrescription.prescription_number || emrPrescription.id
    }],
    status: mapMedicationRequestStatus(emrPrescription.status),
   intent: mapMedicationIntent(emrPrescription.intent),
   category: [{
     coding: [{
       system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
       code: emrPrescription.category || 'outpatient'
      }]
    }],
   priority: emrPrescription.priority || 'routine',
   doNotPerform: emrPrescription.do_not_perform_flag || false,
   medicationReference: {
     reference: `Medication/${emrPrescription.drug_id}`,
      type: 'Medication'
    },
   subject: {
     reference: `Patient/${emrPrescription.patient_id}`,
      type: 'Patient'
    },
   encounter: emrPrescription.encounter_id ? {
     reference: `Encounter/${emrPrescription.encounter_id}`,
      type: 'Encounter'
    } : null,
    authoredOn: formatDateForFHIR(emrPrescription.created_at),
   requester: {
     reference: `Practitioner/${emrPrescription.provider_id}`,
      type: 'Practitioner'
    },
   dosage: prescriptionItems.map((item, index) => ({
     sequence: item.sequence || index + 1,
      text: item.instructions,
      timing: {
       repeat: {
          frequency: parseFrequency(item.frequency),
         period: parseFrequencyPeriod(item.frequency_period)
        }
      },
     route: {
       coding: [{
         system: 'http://snomed.info/sct',
         code: item.route
        }]
      },
     doseAndRate: [{
        type: {
         coding: [{
           system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
           code: 'ordered'
          }]
        },
       doseQuantity: {
          value: item.dose,
          unit: item.dose_unit,
         system: 'http://unitsofmeasure.org',
         code: item.dose_unit
        }
      }]
    })),
   dispenseRequest: {
      validityPeriod: {
       end: calculateDispenseEndDate(emrPrescription.duration)
      },
      numberOfRepeatsAllowed: emrPrescription.refills_allowed || 0,
     quantity: {
        value: emrPrescription.quantity_dispensed || prescriptionItems.reduce((sum, item) => sum + (item.quantity_prescribed || 0), 0),
        unit: 'tablet' // Should be derived from dosage form
      },
      daysSupply: {
        value: emrPrescription.days_supply || 30,
        unit: 'days',
       system: 'http://unitsofmeasure.org',
       code: 'd'
      }
    },
   substitutionAllowed: emrPrescription.substitution_allowed !== false,
   priorPrescription: emrPrescription.prior_prescription_id ? {
     reference: `MedicationRequest/${emrPrescription.prior_prescription_id}`
    } : null,
   insurance: emrPrescription.insurance_coverage_ids?.map(id => ({
     reference: `Coverage/${id}`
    })),
   note: emrPrescription.note_text ? [{
      text: emrPrescription.note_text
    }] : null
  };
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const formatDateForFHIR = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const mapGender = (gender) => {
  const map = {
    'male': 'male',
    'female': 'female',
    'other': 'other',
    'unknown': 'unknown',
    'M': 'male',
    'F': 'female'
  };
  return map[gender?.toLowerCase()] || 'unknown';
};

const mapEncounterStatus = (status) => {
  const map = {
    'open': 'in-progress',
    'closed': 'finished',
    'cancelled': 'cancelled',
    'completed': 'finished'
  };
  return map[status] || 'unknown';
};

const mapEncounterClassDisplay = (code) => {
  const map = {
    'AMB': 'ambulatory',
    'IMP': 'inpatient encounter',
    'EMER': 'emergency',
    'VR': 'virtual',
    'HH': 'home health'
  };
  return map[code] || code;
};

const mapMedicationRequestStatus = (status) => {
  const map = {
    'draft': 'draft',
    'active': 'active',
    'completed': 'completed',
    'cancelled': 'revoked',
    'on-hold': 'on-hold',
    'discontinued': 'stopped'
  };
  return map[status] || 'active';
};

const mapMedicationIntent = (intent) => {
  const map = {
    'proposal': 'proposal',
    'plan': 'plan',
    'directive': 'directive',
    'order': 'order',
    'original-order': 'original-order'
  };
  return map[intent] || 'order';
};

const mapSeverityToSNOMED = (severity) => {
  const map = {
    'mild': '255604002',
    'moderate': '371923003',
    'severe': '24484000'
  };
  return map[severity?.toLowerCase()] || null;
};

const mapCategoryDisplay = (category) => {
  const map = {
    'vital-signs': 'Vital Signs',
    'laboratory': 'Laboratory',
    'imaging': 'Imaging',
    'social-history': 'Social History',
    'exam': 'Exam',
    'procedure': 'Procedure'
  };
  return map[category] || category;
};

const parseFrequency = (frequency) => {
  if (!frequency) return null;
  
  const freqMap = {
    'BID': 2,
    'TID': 3,
    'QID': 4,
    'QD': 1,
    'Q6H': 4,
    'Q8H': 3,
    'Q12H': 2,
    'daily': 1,
    'weekly': 1
  };
  
  return freqMap[frequency.toUpperCase()] || 1;
};

const parseFrequencyPeriod = (period) => {
  if (!period) return 1;
  
  const periodMap = {
    'day': 1,
    'week': 7,
    'month': 30
  };
  
  return periodMap[period.toLowerCase()] || 1;
};

const calculateDispenseEndDate = (duration) => {
  if (!duration) return null;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);
  return endDate.toISOString();
};

// Export all transformers
export default {
  transformPatientToFHIR,
  transformEncounterToFHIR,
  transformConditionToFHIR,
  transformObservationToFHIR,
  transformMedicationRequestToFHIR
};
