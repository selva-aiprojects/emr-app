/**
 * Global Branding Configuration for MedFlow EMR
 * Centralized source of truth for all platform-wide text strings and brand identity.
 */

export const BRAND = {
  name: 'Healthezee',
  version: 'v2.0.4 Enterprise',
  engine: 'Healthezee AI Clinical Engine',
  tagline: 'Smart Healthcare Operations Simplified',
  slogan: 'Healthezee: Care Made Easy',
  
  meta: {
    title: 'Healthezee EMR - Modern Healthcare Management',
    description: 'Enterprise-grade, HL7/FHIR compliant electronic medical record system for modern healthcare facilities.',
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
