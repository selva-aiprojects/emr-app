import pool from '../server/db/connection.js';

async function seedDemoTenant() {
  try {
    console.log('Seeding demo tenant...');
    const result = await pool.query(`
      INSERT INTO nexus.tenants (id, name, code, subdomain, status, subscription_tier)
      VALUES (
        '44000000-0000-0000-0000-000000000001',
        'Healthezee Demo Hospital',
        'demo',
        'demo',
        'active',
        'Enterprise'
      )
      ON CONFLICT (id) DO UPDATE SET status = 'active'
      RETURNING *
    `);
    console.log('Tenant seeded:', result.rows[0]);

    // Also seed into management_tenants if it exists
    await pool.query(`
      INSERT INTO nexus.management_tenants (id, name, code, subdomain, status, subscription_tier)
      VALUES (
        '44000000-0000-0000-0000-000000000001',
        'Healthezee Demo Hospital',
        'demo',
        'demo',
        'active',
        'Enterprise'
      )
      ON CONFLICT (id) DO UPDATE SET status = 'active'
    `).catch(e => console.log('management_tenants skip:', e.message));

  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seedDemoTenant();
