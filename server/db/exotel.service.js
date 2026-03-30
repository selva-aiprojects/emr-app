/**
 * Exotel SMS Service
 * Handles all Exotel SMS and communication-related database operations
 */

import { query } from './connection.js';

// =====================================================
// EXOTEL SMS CONFIGURATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, isDefault = false, isActive = true, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, is_default, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, isDefault, isActive, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, includeInactive = false) {
  let sql = `
    SELECT 
      ec.*, u.name as created_by_name
    FROM emr.exotel_configurations ec
    LEFT JOIN emr.users u ON ec.created_by = u.id
    WHERE ec.tenant_id = $1
  `;
  
  const params = [tenantId];
  
  if (!includeInactive) {
    sql += ` AND ec.is_active = $2`;
    params.push(true);
  }
  
  sql += ` ORDER BY ec.is_default DESC, ec.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates, updatedBy) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(configId, tenantId, updatedBy);
  
  const setClause = fields.join(', ');
  const setValues = values.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;
  
  const result = await query(sql, [...setValues]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS NUMBER POOLS
// =====================================================

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id, daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority, true, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// EXOTEL SMS LOGS
// =====================================================

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(smsLogId, tenantId);
  
  const setClause = fields.join(', ');
  const setValues = values.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;
  
  const result = await query(sql, [...setValues]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS CAMPAIGNS
// =====================================================

export async function createSMSCampaign({ tenantId, campaignName, campaignType, templateId, scheduledFor, recipients, variablesUsed, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, template_id, scheduled_for, recipients, variables_used, priority, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, templateId, scheduledFor, recipients, JSON.stringify(variablesUsed), priority, 'draft', createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// EXOTEL WEBHOOKS
// =====================================================

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, eventData) {
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET status = $1, message_sid = $2, error_code = $3, error_message = $4, delivered_timestamp = $5, webhook_data = $6, updated_at = NOW()
    WHERE message_sid = $7 AND tenant_id = $8
    RETURNING *
  `;
  
  const result = await query(sql, [
    eventData.Status, eventData.SmsSid, eventData.ErrorCode, 
    eventData.ErrorMessage, eventData.DeliveryTimestamp, 
    JSON.stringify(eventData), eventData.SmsSid, tenantId
  ]);
  
  return result.rows[0];
}

export async function scheduleSMSRetry(smsLogId, tenantId, retryCount = 1, scheduledFor, reason) {
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET status = 'retry_scheduled', retry_count = $1, scheduled_for = $2, retry_reason = $3, updated_at = NOW()
    WHERE id = $4 AND tenant_id = $5
    RETURNING *
  `;
  
  const result = await query(sql, [retryCount, scheduledFor, reason, smsLogId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS API
// =====================================================

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0]?.from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status,
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    return { success: false, error: error.message, smsLog };
  }
}
