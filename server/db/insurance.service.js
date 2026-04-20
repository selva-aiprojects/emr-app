/**
 * Insurance Management Service
 * Handles insurance providers, claims, and pre-authorizations
 */

import { query } from './connection.js';

// =====================================================
// INSURANCE PROVIDERS
// =====================================================

export async function getEnhancedInsuranceProviders(tenantId) {
  const sql = `
    SELECT * FROM emr.insurance_providers_enhanced 
    WHERE tenant_id = $1 
    ORDER BY provider_name
  `;
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createEnhancedInsuranceProvider({ 
  tenantId, providerCode, providerName, providerType, irdaiLicense, 
  panNumber, gstNumber, contactPerson, contactEmail, contactPhone, 
  address, city, state, pincode, networkType, settlementPeriodDays,
  coPaymentPercentage, deductibleAmount, maxCoverageLimit 
}) {
  const sql = `
    INSERT INTO emr.insurance_providers_enhanced (
      tenant_id, provider_code, provider_name, provider_type, irdai_license,
      pan_number, gst_number, contact_person, contact_email, contact_phone,
      address, city, state, pincode, network_type, settlement_period_days,
      co_payment_percentage, deductible_amount, max_coverage_limit
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *
  `;
  const result = await query(sql, [
    tenantId, providerCode, providerName, providerType, irdaiLicense,
    panNumber, gstNumber, contactPerson, contactEmail, contactPhone,
    address, city, state, pincode, networkType, settlementPeriodDays,
    coPaymentPercentage, deductibleAmount, maxCoverageLimit
  ]);
  return result.rows[0];
}

export async function getInsuranceProviders(tenantId) {
  const sql = `
    SELECT * FROM insurance_providers 
    WHERE tenant_id::text = $1::text
    ORDER BY provider_name
  `;
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createInsuranceProvider({ 
  tenantId, providerName, providerCode, contactPerson, phone, email, address, isActive = true
}) {
  const sql = `
    INSERT INTO insurance_providers (
      tenant_id, provider_name, provider_code,
      contact_person, phone, email, address, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await query(sql, [
    tenantId, providerName, providerCode, contactPerson, phone, email, address, isActive
  ]);
  return result.rows[0];
}

export async function updateInsuranceProvider({ providerId, tenantId, updates = {} }) {
  const allowedFields = ['provider_name', 'provider_code', 'contact_person', 'phone', 'email', 'address', 'is_active'];
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    fields.push(`${key} = $${paramIndex++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    const fallback = await query(`SELECT * FROM insurance_providers WHERE id::text = $1::text AND tenant_id::text = $2::text`, [providerId, tenantId]);
    return fallback.rows[0];
  }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());

  const sql = `
    UPDATE insurance_providers
    SET ${fields.join(', ')}
    WHERE id::text = $${paramIndex++}::text AND tenant_id::text = $${paramIndex++}::text
    RETURNING *
  `;
  values.push(providerId, tenantId);

  const result = await query(sql, values);
  return result.rows[0];
}

export async function getPatientInsurance(tenantId, filters = {}) {
  const { patientId, providerId, isActive } = filters;
  let sql = `
    SELECT pi.*, p.first_name || ' ' || p.last_name AS patient_name,
           ip.provider_name
    FROM patient_insurance pi
    LEFT JOIN patients p ON pi.patient_id = p.id
    LEFT JOIN insurance_providers ip ON pi.provider_id = ip.id
    WHERE pi.tenant_id::text = $1::text
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (patientId) {
    sql += ` AND pi.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }

  if (providerId) {
    sql += ` AND pi.provider_id::text = $${paramIndex++}::text`;
    params.push(providerId);
  }

  if (typeof isActive !== 'undefined') {
    sql += ` AND pi.is_active = $${paramIndex++}`;
    params.push(isActive);
  }

  sql += ` ORDER BY pi.created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

export async function createPatientInsurance({
  tenantId, patientId, providerId, policyNumber, groupNumber,
  coverageType, coveragePercentage = 100.0, deductibleAmount = 0,
  maxCoverageAmount = null, effectiveDate = null, expiryDate = null,
  isPrimary = false, isActive = true
}) {
  const sql = `
    INSERT INTO patient_insurance (
      tenant_id, patient_id, provider_id, policy_number, group_number,
      coverage_type, coverage_percentage, deductible_amount, max_coverage_amount,
      effective_date, expiry_date, is_primary, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId, patientId, providerId, policyNumber, groupNumber,
    coverageType, coveragePercentage, deductibleAmount, maxCoverageAmount,
    effectiveDate, expiryDate, isPrimary, isActive
  ]);
  return result.rows[0];
}

export async function updatePatientInsurance({ insuranceId, tenantId, updates = {} }) {
  const allowedFields = [
    'policy_number', 'group_number', 'coverage_type', 'coverage_percentage',
    'deductible_amount', 'max_coverage_amount', 'effective_date', 'expiry_date',
    'is_primary', 'is_active'
  ];
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    fields.push(`${key} = $${paramIndex++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    const fallback = await query(`SELECT * FROM patient_insurance WHERE id::text = $1::text AND tenant_id::text = $2::text`, [insuranceId, tenantId]);
    return fallback.rows[0];
  }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());

  const sql = `
    UPDATE patient_insurance
    SET ${fields.join(', ')}
    WHERE id::text = $${paramIndex++}::text AND tenant_id::text = $${paramIndex++}::text
    RETURNING *
  `;
  values.push(insuranceId, tenantId);

  const result = await query(sql, values);
  return result.rows[0];
}

// =====================================================
// INSURANCE CLAIMS
// =====================================================

export async function createInsuranceClaim({ 
  tenantId, patientId, encounterId, providerId, policyNumber, 
  policyHolderName, relationshipToPatient, claimType, claimCategory,
  admissionDate, dischargeDate, diagnosisIcd10Codes, procedureIcd10Codes,
  totalClaimedAmount, supportingDocuments, createdBy 
}) {
  // Generate claim number
  const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  
  const sql = `
    INSERT INTO emr.insurance_claims (
      tenant_id, claim_number, patient_id, encounter_id, provider_id,
      policy_number, policy_holder_name, relationship_to_patient,
      claim_type, claim_category, admission_date, discharge_date,
      diagnosis_icd10_codes, procedure_icd10_codes, total_claimed_amount,
      supporting_documents, status, submission_date, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'SUBMITTED', NOW(), $18)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, claimNumber, patientId, encounterId, providerId,
    policyNumber, policyHolderName, relationshipToPatient,
    claimType, claimCategory, admissionDate, dischargeDate,
    diagnosisIcd10Codes, procedureIcd10Codes, totalClaimedAmount,
    supportingDocuments, createdBy
  ]);
  
  return result.rows[0];
}

export async function getInsuranceClaims(tenantId, filters = {}) {
  let sql = `
    SELECT 
      ic.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.mrn as patient_mrn,
      ipe.provider_name,
      ipe.provider_type,
      ARRAY(
        SELECT json_build_object(
          'item_type', cli.item_type,
          'item_description', cli.item_description,
          'quantity', cli.quantity,
          'unit_rate', cli.unit_rate,
          'total_amount', cli.total_amount,
          'approved_amount', cli.approved_amount,
          'status', cli.status
        )
        FROM emr.insurance_claim_line_items cli
        WHERE cli.claim_id = ic.id
      ) as line_items
    FROM emr.insurance_claims ic
    JOIN emr.patients p ON ic.patient_id = p.id
    JOIN emr.insurance_providers_enhanced ipe ON ic.provider_id = ipe.id
    WHERE ic.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (filters.status) {
    sql += ` AND ic.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  
  if (filters.patientId) {
    sql += ` AND ic.patient_id = $${paramIndex++}`;
    params.push(filters.patientId);
  }
  
  if (filters.providerId) {
    sql += ` AND ic.provider_id = $${paramIndex++}`;
    params.push(filters.providerId);
  }
  
  sql += ` ORDER BY ic.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createClaimLineItem({ 
  claimId, itemType, itemDescription, icd10Code, quantity, 
  unitRate, totalAmount 
}) {
  const sql = `
    INSERT INTO emr.insurance_claim_line_items (
      claim_id, item_type, item_description, icd10_code, quantity,
      unit_rate, total_amount
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const result = await query(sql, [
    claimId, itemType, itemDescription, icd10Code, quantity, unitRate, totalAmount
  ]);
  
  return result.rows[0];
}

// =====================================================
// PRE-AUTHORIZATIONS
// =====================================================

export async function createPreauthorizationRequest({
  tenantId, patientId, providerId, policyNumber, requestedAmount,
  diagnosisSummary, proposedTreatment, estimatedAdmissionDate,
  estimatedDischargeDate, icd10Codes, createdBy
}) {
  // Generate preauth number
  const preauthNumber = `PA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  
  const sql = `
    INSERT INTO insurance_pre_auth (
      tenant_id, provider_id, patient_id, pre_auth_number,
      service_type, estimated_amount, approved_amount,
      status, expiry_date, notes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, providerId, patientId, preauthNumber,
    proposedTreatment, requestedAmount, null,
    'pending', estimatedDischargeDate, diagnosisSummary
  ]);
  
  return result.rows[0];
}

export async function getPreauthorizationRequests(tenantId, filters = {}) {
  let sql = `
    SELECT 
      ipr.*, 
      p.first_name || ' ' || p.last_name as patient_name,
      p.mrn as patient_mrn,
      ip.provider_name
    FROM insurance_pre_auth ipr
    LEFT JOIN patients p ON ipr.patient_id = p.id
    LEFT JOIN insurance_providers ip ON ipr.provider_id = ip.id
    WHERE ipr.tenant_id::text = $1::text
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (filters.status) {
    sql += ` AND ipr.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  
  if (filters.patientId) {
    sql += ` AND ipr.patient_id::text = $${paramIndex++}::text`;
    params.push(filters.patientId);
  }
  
  if (filters.providerId) {
    sql += ` AND ipr.provider_id::text = $${paramIndex++}::text`;
    params.push(filters.providerId);
  }
  
  sql += ` ORDER BY ipr.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateClaimStatus({ claimId, tenantId, status, approvedAmount, rejectionReason, updatedBy }) {
  const sql = `
    UPDATE emr.insurance_claims
    SET 
      status = $1,
      total_approved_amount = COALESCE($2, total_approved_amount),
      rejection_reason = $3,
      updated_by = $4,
      updated_at = CASE 
        WHEN $1 IN ('APPROVED', 'REJECTED') THEN NOW()
        ELSE updated_at 
      END,
      approval_date = CASE 
        WHEN $1 IN ('APPROVED', 'PARTIALLY_APPROVED') THEN NOW()
        ELSE approval_date 
      END
    WHERE id = $5 AND tenant_id = $6
    RETURNING *
  `;
  
  const result = await query(sql, [status, approvedAmount, rejectionReason, updatedBy, claimId, tenantId]);
  return result.rows[0];
}

export async function updatePreauthStatus({ preauthId, tenantId, status, approvedAmount, rejectionReason, updatedBy }) {
  const sql = `
    UPDATE insurance_pre_auth
    SET 
      status = $1,
      approved_amount = COALESCE($2, approved_amount),
      rejection_reason = $3,
      updated_by = $4,
      updated_at = NOW(),
      expiry_date = CASE 
        WHEN $1 = 'approved' THEN NOW() + INTERVAL '15 days'
        ELSE expiry_date 
      END
    WHERE id::text = $5::text AND tenant_id::text = $6::text
    RETURNING *
  `;
  
  const result = await query(sql, [status, approvedAmount, rejectionReason, updatedBy, preauthId, tenantId]);
  return result.rows[0];
}

export async function createClaimSettlement({
  claimId, settlementAmount, settlementMode, settlementReference,
  tpaReference, bankAccountNumber, bankName, ifscCode, createdBy
}) {
  // Generate settlement number
  const settlementNumber = `STL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  
  const sql = `
    INSERT INTO emr.insurance_claim_settlements (
      claim_id, settlement_number, settlement_date, settlement_amount,
      settlement_mode, settlement_reference, tpa_reference,
      bank_account_number, bank_name, ifsc_code, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PROCESSING', $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    claimId, settlementNumber, new Date(), settlementAmount,
    settlementMode, settlementReference, tpaReference,
    bankAccountNumber, bankName, ifscCode, createdBy
  ]);
  
  // Update claim status to settled
  await updateClaimStatus({ 
    claimId, 
    tenantId: null, // Will be filtered in the function
    status: 'SETTLED', 
    approvedAmount: settlementAmount,
    rejectionReason: null,
    updatedBy: createdBy
  });
  
  return result.rows[0];
}

export async function getInsuranceDashboard(tenantId) {
  const sql = `
    SELECT 
      -- Claims Statistics
      (SELECT COUNT(*) FROM emr.insurance_claims WHERE tenant_id = $1) as total_claims,
      (SELECT COUNT(*) FROM emr.insurance_claims WHERE tenant_id = $1 AND status = 'PENDING') as pending_claims,
      (SELECT COUNT(*) FROM emr.insurance_claims WHERE tenant_id = $1 AND status = 'APPROVED') as approved_claims,
      (SELECT COUNT(*) FROM emr.insurance_claims WHERE tenant_id = $1 AND status = 'SETTLED') as settled_claims,
      (SELECT COUNT(*) FROM emr.insurance_claims WHERE tenant_id = $1 AND status = 'REJECTED') as rejected_claims,
      
      -- Financial Summary
      (SELECT COALESCE(SUM(total_claimed_amount), 0) FROM emr.insurance_claims WHERE tenant_id = $1) as total_claimed,
      (SELECT COALESCE(SUM(total_approved_amount), 0) FROM emr.insurance_claims WHERE tenant_id = $1) as total_approved,
      (SELECT COALESCE(SUM(total_settled_amount), 0) FROM emr.insurance_claims WHERE tenant_id = $1) as total_settled,
      
      -- Pre-authorization Statistics
      (SELECT COUNT(*) FROM emr.insurance_preauth_requests WHERE tenant_id = $1) as total_preauth,
      (SELECT COUNT(*) FROM emr.insurance_preauth_requests WHERE tenant_id = $1 AND status = 'PENDING') as pending_preauth,
      (SELECT COUNT(*) FROM emr.insurance_preauth_requests WHERE tenant_id = $1 AND status = 'APPROVED') as approved_preauth,
      (SELECT COUNT(*) FROM emr.insurance_preauth_requests WHERE tenant_id = $1 AND status = 'EXPIRED') as expired_preauth,
      
      -- Provider Statistics
      (SELECT COUNT(*) FROM emr.insurance_providers_enhanced WHERE tenant_id = $1) as total_providers,
      (SELECT COUNT(*) FROM emr.insurance_providers_enhanced WHERE tenant_id = $1 AND status = 'ACTIVE') as active_providers
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows[0];
}
