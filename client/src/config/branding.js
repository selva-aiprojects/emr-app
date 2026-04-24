/**
 * Global Branding Configuration for MedFlow EMR
 * Centralized source of truth for all platform-wide text strings and brand identity.
 */

export const BRAND = {
  name: 'Healthezee',
  version: 'v2.0.4 Enterprise',
  engine: 'Healthezee AI Clinical Engine',
  tagline: 'Hospital Operations Redefined',
  slogan: 'Healthezee: Precision Care Simplified',
  
  meta: {
    title: 'Healthezee - Hospital Management System',
    description: 'Enterprise-grade, HL7/FHIR compliant electronic medical record system powered by Healthezee AI.',
    keywords: 'EMR, EHR, Healthcare, Hospital Management, HL7, FHIR, Clinical Intelligence, Healthezee'
  },

  support: {
    email: 'support@healthezee.com',
    portal: 'https://support.healthezee.com',
    emergency: 'Operations Hotline: +1 (800) HEALTH-EZEE'
  },

  legal: {
    disclaimer: 'HIPAA Compliant Entity Interface. Unauthorized access is strictly prohibited and monitored.',
    copyright: `© ${new Date().getFullYear()} Healthezee Group. All rights reserved.`
  }
};

export default BRAND;
