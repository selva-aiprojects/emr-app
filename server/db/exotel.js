// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
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
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
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

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
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
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
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
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

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

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

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

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
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

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLogId, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLogId, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}
