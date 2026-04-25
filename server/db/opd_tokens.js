// =====================================================
// OPD TOKEN QUEUE SYSTEM
// =====================================================

export async function generateOPDToken({ tenantId, patientId, departmentId, doctorId, priority = 'general', visitType = 'new', chiefComplaint, appointmentId, createdBy }) {
  // Get next token number from emr schema
  const nextTokenSql = `
    SELECT get_next_token_number($1, $2) as token_number
  `;
  const tokenResult = await query(nextTokenSql, [tenantId, departmentId]);
  const tokenNumber = tokenResult.rows[0].token_number;
  
  // Create the token
  const sql = `
    INSERT INTO opd_tokens (
      tenant_id, patient_id, token_number, token_prefix, status, priority,
      department_id, doctor_id, appointment_id, visit_type, chief_complaint, created_by
    )
    VALUES ($1, $2, $3, 'OPD', $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenNumber, 'waiting', priority,
    departmentId, doctorId, appointmentId, visitType, chiefComplaint, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDTokens(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, priority } = filters;
  
  let sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM opd_tokens t
    LEFT JOIN patients p ON t.patient_id = p.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.doctor_id = u.id
    LEFT JOIN appointments a ON t.appointment_id = a.id
    WHERE t.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND t.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND t.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND DATE(t.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (priority) {
    sql += ` AND t.priority = $${paramIndex++}`;
    params.push(priority);
  }
  
  sql += ` ORDER BY 
    CASE 
      WHEN t.priority = 'urgent' THEN 1
      WHEN t.priority = 'senior_citizen' THEN 2
      WHEN t.priority = 'follow_up' THEN 3
      ELSE 4
    END,
    t.token_number ASC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDTokenById(tokenId, tenantId) {
  const sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      p.blood_group,
      p.address,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM opd_tokens t
    LEFT JOIN patients p ON t.patient_id = p.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.doctor_id = u.id
    LEFT JOIN appointments a ON t.appointment_id = a.id
    WHERE t.id = $1 AND t.tenant_id = $2
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

export async function updateTokenStatus(tokenId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  // Add timestamp fields based on status
  if (status === 'called') {
    fields.push('last_called_at');
    values.push(new Date());
  }
  
  if (status === 'in_progress') {
    fields.push('consultation_started_at');
    values.push(new Date());
  }
  
  if (status === 'completed') {
    fields.push('consultation_completed_at');
    values.push(new Date());
  }
  
  // Add called_count increment
  if (status === 'called') {
    fields.push('called_count');
    values.push(`(SELECT COALESCE(called_count, 0) + 1 FROM opd_tokens WHERE id = $1)`);
  }
  
  // Add additional data
  if (additionalData.doctorId) {
    fields.push('doctor_id');
    values.push(additionalData.doctorId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE opd_tokens 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(tokenId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function callNextToken(tenantId, departmentId, doctorId = null) {
  const sql = `
    UPDATE opd_tokens 
    SET status = 'called',
        last_called_at = NOW(),
        called_count = COALESCE(called_count, 0) + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM opd_tokens 
      WHERE tenant_id = $1 
        AND ($2::uuid IS NULL OR department_id = $2)
        AND ($3::uuid IS NULL OR doctor_id = $3)
        AND status = 'waiting'
      ORDER BY 
        CASE 
          WHEN priority = 'urgent' THEN 1
          WHEN priority = 'senior_citizen' THEN 2
          WHEN priority = 'follow_up' THEN 3
          ELSE 4
        END,
        token_number ASC
      LIMIT 1
    )
    RETURNING *
  `;
  
  const result = await query(sql, [tenantId, departmentId, doctorId]);
  return result.rows[0];
}

export async function getTokenQueueStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
      COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
      AVG(EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60) as avg_consultation_time_minutes
    FROM opd_tokens
    WHERE tenant_id = $1 
      AND DATE(created_at) = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getActiveTokensByDepartment(tenantId) {
  const sql = `
    SELECT 
      d.id as department_id,
      d.name as department_name,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN t.status = 'called' THEN 1 END) as called_count,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
      MAX(t.token_number) as last_token,
      t.full_token as current_token,
      t.status as current_token_status
    FROM departments d
    LEFT JOIN opd_tokens t ON d.id = t.department_id 
      AND t.tenant_id = $1 
      AND DATE(t.created_at) = CURRENT_DATE
      AND t.status IN ('waiting', 'called', 'in_progress')
    WHERE d.tenant_id = $1
    GROUP BY d.id, d.name, t.full_token, t.status
    ORDER BY d.name
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function updateTokenVitals(tokenId, tenantId, vitalsData) {
  const sql = `
    UPDATE opd_tokens 
    SET vitals_recorded = true,
        updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  
  // Create vitals record if needed
  if (result.rows[0]) {
    const vitalsSql = `
      INSERT INTO vitals (
        tenant_id, patient_id, encounter_id, blood_pressure_systolic,
        blood_pressure_diastolic, heart_rate, temperature, 
        oxygen_saturation, weight, height, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    await query(vitalsSql, [
      tenantId, 
      result.rows[0].patient_id, 
      null, // No encounter yet
      vitalsData.bloodPressureSystolic,
      vitalsData.bloodPressureDiastolic,
      vitalsData.heartRate,
      vitalsData.temperature,
      vitalsData.oxygenSaturation,
      vitalsData.weight,
      vitalsData.height,
      vitalsData.createdBy
    ]);
  }
  
  return result.rows[0];
}

export async function getTokenHistory(tenantId, patientId, limit = 10) {
  const sql = `
    SELECT 
      t.*,
      d.name as department_name,
      u.name as doctor_name,
      EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60 as consultation_duration_minutes
    FROM opd_tokens t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND t.patient_id = $2
    ORDER BY t.created_at DESC
    LIMIT $3
  `;
  
  const result = await query(sql, [tenantId, patientId, limit]);
  return result.rows;
}

export async function deleteOPDToken(tokenId, tenantId) {
  const sql = `
    DELETE FROM opd_tokens 
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}
