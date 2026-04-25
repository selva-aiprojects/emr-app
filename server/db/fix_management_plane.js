import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function repair() {
  console.log('🚀 [SUPPORT_BRIDGE_REPAIR] Synchronizing Tickets & Management Schema...');
  
  try {
    // 1. Wipe old mapping to ensure fresh start
    await pool.query(`
      DROP TABLE IF EXISTS management_system_logs CASCADE;
      DROP TABLE IF EXISTS management_tenants CASCADE;
      DROP TABLE IF EXISTS management_subscriptions CASCADE;
    `);

    // 2. Create foundational structure with STRICT Prisma 7 naming
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS emr;
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE management_subscriptions (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tier" VARCHAR(50) NOT NULL DEFAULT 'Enterprise',
        "plan_name" TEXT NOT NULL DEFAULT 'Enterprise Plan',
        "limit_users" INTEGER NOT NULL DEFAULT 100,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE management_tenants (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "code" VARCHAR(32) UNIQUE NOT NULL,
        "subdomain" VARCHAR(128) UNIQUE NOT NULL,
        "schema_name" VARCHAR(64) UNIQUE NOT NULL,
        "status" VARCHAR(16) NOT NULL DEFAULT 'active',
        "contact_email" VARCHAR(128),
        "subscription_tier" VARCHAR(50) NOT NULL DEFAULT 'Professional',
        "subscription_id" UUID REFERENCES management_subscriptions(id) ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE management_system_logs (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "event" TEXT NOT NULL,
        "details" JSONB,
        "tenant_id" UUID REFERENCES management_tenants(id) ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Migrate data back with UUID stability
    console.log('🔄 Mapping 2 existing tenants to the new Management Plane...');
    await pool.query(`
      INSERT INTO management_tenants (id, name, code, subdomain, schema_name, status, contact_email)
      SELECT id, name, code, subdomain, COALESCE(schema_name, LOWER(code)), status, contact_email
      FROM tenants
      ON CONFLICT DO NOTHING;
    `);

    // 4. Seed a "Ticket" to confirm the bridge works
    console.log('🎫 Seeding initial Support Ticket for dashboard validation...');
    await pool.query(`
      INSERT INTO management_system_logs (event, details)
      VALUES ('TICKET_CREATED', '{"subject": "Initial Platform Migration", "priority": "normal", "requester": "System Admin"}');
    `);

    console.log('✨ [REPAIR_COMPLETE] Support Bridge is ready.');

  } catch (err) {
    console.error('❌ [REPAIR_ERROR]:', err.message);
  } finally {
    await pool.end();
  }
}

repair();
