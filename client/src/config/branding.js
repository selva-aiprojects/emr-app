/**
 * Global Branding Configuration for MedFlow EMR
 * Centralized source of truth for all platform-wide text strings and brand identity.
 */

export const BRAND = {
  name: 'MedFlow EMR',
  version: 'v2.0.4 Enterprise',
  engine: 'SLM Clinical Intelligence Engine',
  tagline: 'Precision Healthcare Operations at Scale',
  slogan: 'MedFlow: The Operating System for Modern Care',
  
  meta: {
    title: 'MedFlow EMR - Professional Healthcare Management',
    description: 'Enterprise-grade, HL7/FHIR compliant electronic medical record system for modern healthcare facilities.',
    keywords: 'EMR, EHR, Healthcare, Hospital Management, HL7, FHIR, Clinical Intelligence'
  },

  support: {
    email: 'support@medflow.org',
    portal: 'https://support.medflow.org',
    emergency: 'Operations Hotline: +1 (800) MED-FLOW'
  },

  legal: {
    disclaimer: 'HIPAA Compliant Entity Interface. Unauthorized access is strictly prohibited and monitored.',
    copyright: `© ${new Date().getFullYear()} MedFlow Systems. All rights reserved.`
  }
};

export default BRAND;
