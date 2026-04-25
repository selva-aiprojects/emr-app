/**
 * Exotel SMS & Communication Service
 * Unified service for SMS configuration, pools, campaigns, and API integration
 */

import { query } from './connection.js';

// =====================================================
// EXOTEL CONFIGURATION
// =====================================================

export async function createExotelConfiguration({ 
  tenantId, accountSid, apiKey, apiToken, subdomain, 
  fromNumber, webhookUrl, deliveryReportWebhook, 
  isDefault = false, isActive = true, createdBy 
}) {
  const sql = `
    INSERT INTO exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, 
      from_number, webhook_url, delivery_report_webhook, 
      is_default, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, 
    fromNumber, webhookUrl, deliveryReportWebhook, 
    isDefault, isActive, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, includeInactive = false) {
  let sql = `
    SELECT ec.*, u.name as created_by_name
    FROM exotel_configurations ec
    LEFT JOIN users u ON ec.created_by = u.id
    WHERE ec.tenant_id = $1
  `;
  const params = [tenantId];
  if (!includeInactive) {
    sql += ` AND ec.is_active = true`;
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
  if (updatedBy) {
    fields.push('updated_by = $' + (paramIndex++));
    values.push(updatedBy);
  }
  
  values.push(configId, tenantId);
  
  const sql = `
    UPDATE exotel_configurations
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;
  
  const result = await query(sql, values);
  return result.rows[0];
}

// =====================================================
// NUMBER POOLS (MANAGED OUTBOUND)
// =====================================================

export async function createExotelNumberPool({ 
  tenantId, poolName, phoneNumber, numberType, departmentId, 
  doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy 
}) {
  const sql = `
    INSERT INTO exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, 
      doctor_id, daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, 
    doctorId, dailyLimit, monthlyLimit, priority, createdBy
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
      CASE WHEN np.daily_limit > 0 THEN ROUND((np.current_daily_usage::float / np.daily_limit * 100), 2) ELSE 0 END as daily_usage_percentage,
      CASE WHEN np.monthly_limit > 0 THEN ROUND((np.current_monthly_usage::float / np.monthly_limit * 100), 2) ELSE 0 END as monthly_usage_percentage
    FROM exotel_number_pools np
    LEFT JOIN departments d ON np.department_id = d.id
    LEFT JOIN users u ON np.doctor_id = u.id
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
// SMS CAMPAIGNS & LOGS
// =====================================================

export async function createSMSCampaign({ 
  tenantId, campaignName, campaignType, templateId, scheduledFor, 
  recipients, variablesUsed, priority = 1, createdBy 
}) {
  const sql = `
    INSERT INTO exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, template_id, scheduled_for, 
      recipients, variables_used, priority, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, templateId, scheduledFor, 
    recipients, JSON.stringify(variablesUsed), priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone
    FROM exotel_sms_logs l
    LEFT JOIN exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN communication_templates ct ON l.template_id = ct.id
    LEFT JOIN patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) { sql += ` AND l.status = $${paramIndex++}`; params.push(status); }
  if (toNumber) { sql += ` AND l.to_number = $${paramIndex++}`; params.push(toNumber); }
  if (fromNumber) { sql += ` AND l.from_number = $${paramIndex++}`; params.push(fromNumber); }
  if (startDate) { sql += ` AND l.created_at >= $${paramIndex++}`; params.push(startDate); }
  if (endDate) { sql += ` AND l.created_at <= $${paramIndex++}`; params.push(endDate); }
  if (campaignId) { sql += ` AND l.campaign_id = $${paramIndex++}`; params.push(campaignId); }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// EXOTEL WEBHOOKS & DELIVERY REPORTS
// =====================================================

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO exotel_webhook_events (
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
  
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return result.rows[0];
}

export async function processExotelDeliveryReport(tenantId, eventData) {
  const sql = `
    UPDATE exotel_sms_logs
    SET status = $1, error_code = $2, error_message = $3, 
        delivered_timestamp = $4, webhook_data = $5, updated_at = NOW()
    WHERE message_sid = $6 AND tenant_id = $7
    RETURNING *
  `;
  
  const result = await query(sql, [
    eventData.Status, eventData.ErrorCode, eventData.ErrorMessage, 
    eventData.DeliveryTimestamp, JSON.stringify(eventData), 
    eventData.SmsSid, tenantId
  ]);
  
  return result.rows[0];
}

// =====================================================
// SEND SMS LOGIC
// =====================================================

export async function sendExotelSMS({ 
  tenantId, toNumber, messageContent, messageType = 'transactional', 
  priority = 1, campaignId = null, communicationId = null, externalId = null 
}) {
  // 1. Get available number
  const numResult = await query('SELECT get_available_exotel_number($1, $2) as from_number', [tenantId, messageType]);
  const fromNumber = numResult.rows[0]?.from_number;
  if (!fromNumber) throw new Error('No available Exotel number found');

  // 2. Get configuration
  const configRes = await query('SELECT * FROM exotel_configurations WHERE tenant_id = $1 AND is_active = true ORDER BY is_default DESC LIMIT 1', [tenantId]);
  const config = configRes.rows[0];
  if (!config) throw new Error('No active Exotel configuration');

  // 3. Create log
  const logSql = `
    INSERT INTO exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  const logRes = await query(logSql, [tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber, messageContent, messageType, priority, externalId]);
  const smsLog = logRes.rows[0];

  // 4. Send via API
  try {
    const response = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber, toNumber, messageContent, priority, externalId: smsLog.id
    });
    
    // 5. Update log
    const updateSql = `
      UPDATE exotel_sms_logs 
      SET status = $1, message_sid = $2, sent_timestamp = $3, cost = $4, webhook_data = $5
      WHERE id = $6
    `;
    await query(updateSql, [response.status, response.messageSid, response.sentTimestamp, response.cost, JSON.stringify(response.webhookData), smsLog.id]);
    
    return { success: true, smsLog, response };
  } catch (error) {
    await query("UPDATE exotel_sms_logs SET status = 'failed', error_message = $1 WHERE id = $2", [error.message, smsLog.id]);
    return { success: false, error: error.message };
  }
}

async function sendExotelAPIRequest({ accountSid, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn',
    DltTemplateId: '1207160012345678901'
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Exotel API Error');
  
  return {
    messageSid: data.SmsSid,
    status: data.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: data.Date,
    cost: data.Cost || 0,
    webhookData: data
  };
}
