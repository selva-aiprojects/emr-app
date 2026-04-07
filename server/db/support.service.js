import { query } from './connection.js';
import { createAuditLog } from './tenant.service.js';

/**
 * Support Ticket Repository Functions
 */
export async function getSupportTickets(tenantId) {
  let sql = `
    SELECT t.*, u.name as creator_name, ten.name as tenant_name
    FROM emr.support_tickets t
    LEFT JOIN emr.users u ON t.created_by = u.id
    LEFT JOIN emr.tenants ten ON t.tenant_id = ten.id
  `;
  const params = [];

  if (tenantId) {
    sql += ` WHERE t.tenant_id = $1`;
    params.push(tenantId);
  }

  sql += ` ORDER BY t.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function createSupportTicket({ tenantId, userId, type, location, description, priority }) {
  // Ensure the table exists (Safety for new schemas)
  await query(`
    CREATE TABLE IF NOT EXISTS emr.support_tickets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
      created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
      type text NOT NULL,
      location text,
      description text NOT NULL,
      priority varchar(16) DEFAULT 'medium',
      status varchar(16) DEFAULT 'open',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `);

  const sql = `
    INSERT INTO emr.support_tickets (tenant_id, created_by, type, location, description, priority)
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
      UPDATE emr.support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    params = [status, id, tenantId];
  } else {
    sql = `
      UPDATE emr.support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id = $2
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
