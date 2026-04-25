import { query } from './connection.js';
import { createAuditLog } from './tenant.service.js';

/**
 * Support Ticket Repository Functions
 */
export async function getSupportTickets(tenantId) {
  let sql = `
    SELECT t.*, u.name as creator_name, ten.name as tenant_name
    FROM nexus.support_tickets t
    LEFT JOIN nexus.users u ON t.created_by = u.id
    LEFT JOIN nexus.tenants ten ON t.tenant_id = ten.id
  `;
  const params = [];

  if (tenantId) {
    sql += ` WHERE t.tenant_id::text = $1::text`;
    params.push(tenantId);
  }

  sql += ` ORDER BY t.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function createSupportTicket({ tenantId, userId, type, location, description, priority }) {
  const sql = `
    INSERT INTO nexus.support_tickets (tenant_id, created_by, type, location, description, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, userId, type, location, description, priority || 'medium']);
  const ticket = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null,
    action: 'support.ticket.create',
    entityName: 'support_ticket',
    entityId: ticket.id,
    details: { type, priority }
  });

  return ticket;
}

export async function updateSupportTicketStatus({ id, tenantId, userId, status }) {
  let sql, params;

  if (tenantId) {
    sql = `
      UPDATE nexus.support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id::text = $2::text AND tenant_id::text = $3::text
      RETURNING *
    `;
    params = [status, id, tenantId];
  } else {
    sql = `
      UPDATE nexus.support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id::text = $2::text
      RETURNING *
    `;
    params = [status, id];
  }

  const result = await query(sql, params);
  if (result.rows.length === 0) throw new Error('Ticket not found');

  await createAuditLog({
    tenantId,
    userId,
    userName: null,
    action: `support.ticket.status.${status}`,
    entityName: 'support_ticket',
    entityId: id,
  });

  return result.rows[0];
}
