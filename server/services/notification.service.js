/**
 * Notification Service
 * Responsible for handling out-of-band communication (SMS, Email, WhatsApp).
 * Linked to REQ-INS-01, REQ-LAB-01, and NFR-OBS-01.
 */

export const channels = {
  SMS: 'sms',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  PUSH: 'push'
};

/**
 * Sends a notification via the specified channel.
 * In this implementation, we log the attempt to simulate the dispatch.
 */
export async function sendNotification({ tenantId, userId, patientId, channel, recipient, subject, body, templateId }) {
  try {
    const timestamp = new Date().toISOString();
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`[NOTIFICATION_SERVICE][${timestamp}]`);
    console.log(`- Tenant: ${tenantId}`);
    console.log(`- Recipient: ${recipient}`);
    console.log(`- Channel: ${channel}`);
    console.log(`- Subject: ${subject}`);
    console.log(`- Body: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`);
    
    // Here real integration would go (Twilio, SendGrid, etc.)
    // For now, we return a success receipt.
    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
      timestamp
    };
  } catch (error) {
    console.error('Notification dispatch failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Specialized: Sends an appointment reminder.
 */
export async function sendAppointmentReminder(tenantId, appointment) {
  return sendNotification({
    tenantId,
    recipient: appointment.patientPhone || 'Patient Phone',
    channel: channels.SMS,
    subject: 'Appointment Reminder',
    body: `Hi, this is a reminder for your appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.time}.`
  });
}

/**
 * Specialized: Sends a notification that lab results are ready.
 */
export async function sendLabResultsReady(tenantId, patient, labOrder) {
  return sendNotification({
    tenantId,
    recipient: patient.phone,
    channel: channels.WHATSAPP,
    subject: 'Lab Results Ready',
    body: `Hello ${patient.firstName}, your lab results for ${labOrder.testName} are now ready. You can view them in the patient portal or visit the clinic.`
  });
}

/**
 * Specialized: Sends a security alert for login attempts.
 */
export async function sendSecurityAlert(tenantId, user, metadata) {
  return sendNotification({
    tenantId,
    recipient: user.email,
    channel: channels.EMAIL,
    subject: 'Security Alert: New Login',
    body: `A new login was detected for your account from ${metadata.ip} using ${metadata.browser}. If this wasn't you, please reset your password immediately.`
  });
}
