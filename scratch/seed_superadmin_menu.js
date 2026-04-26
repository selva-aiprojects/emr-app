
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedSuperadminMenu() {
  try {
    console.log('🚀 Seeding Superadmin Menu Structure...');

    // 1. Create Headers
    const headers = [
      { name: 'Intelligence', code: 'intelligence', icon_name: 'Activity', sort_order: 1 },
      { name: 'Payments & Plans', code: 'payments_plans', icon_name: 'CreditCard', sort_order: 2 },
      { name: 'Hospitals List', code: 'hospitals_list', icon_name: 'Building2', sort_order: 3 },
      { name: 'Server Health', code: 'server_health', icon_name: 'Server', sort_order: 4 },
      { name: 'Daily Accounts', code: 'daily_accounts', icon_name: 'Calculator', sort_order: 5 },
      { name: 'Reports & Communication', code: 'reports_comm', icon_name: 'BarChart3', sort_order: 6 }
    ];

    for (const h of headers) {
      await pool.query(`
        INSERT INTO nexus.menu_header (name, code, icon_name, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO UPDATE SET 
          name = EXCLUDED.name, 
          icon_name = EXCLUDED.icon_name, 
          sort_order = EXCLUDED.sort_order
      `, [h.name, h.code, h.icon_name, h.sort_order]);
    }

    // 2. Create Items
    const items = [
      // Intelligence
      { header_code: 'intelligence', name: 'Global Dashboard', code: 'superadmin', icon_name: 'LayoutDashboard', route: '/superadmin/dashboard', sort_order: 1 },
      
      // Payments & Plans
      { header_code: 'payments_plans', name: 'Subscription Mgmt', code: 'subscription_mgmt', icon_name: 'CreditCard', route: '/superadmin/subscriptions', sort_order: 1 },
      
      // Hospitals List
      { header_code: 'hospitals_list', name: 'Tenant Management', code: 'tenant_management', icon_name: 'Building2', route: '/superadmin/tenants', sort_order: 1 },
      
      // Server Health
      { header_code: 'server_health', name: 'Infrastructure Mgmt', code: 'infra_health', icon_name: 'Cpu', route: '/superadmin/infrastructure', sort_order: 1 },
      
      // Daily Accounts
      { header_code: 'daily_accounts', name: 'Financial Governance', code: 'financial_control', icon_name: 'DollarSign', route: '/superadmin/finances', sort_order: 1 },

      // Reports & Comm
      { header_code: 'reports_comm', name: 'Clinical Reports', code: 'reports', icon_name: 'ClipboardList', route: '/superadmin/reports', sort_order: 1 },
      { header_code: 'reports_comm', name: 'Communication Hub', code: 'communication', icon_name: 'Mail', route: '/superadmin/communication', sort_order: 2 },
      { header_code: 'reports_comm', name: 'Support Tickets', code: 'support', icon_name: 'LifeBuoy', route: '/superadmin/tickets', sort_order: 3 }
    ];

    for (const i of items) {
      const headerRes = await pool.query('SELECT id FROM nexus.menu_header WHERE code = $1', [i.header_code]);
      if (headerRes.rows.length > 0) {
        const headerId = headerRes.rows[0].id;
        await pool.query(`
          INSERT INTO nexus.menu_item (header_id, name, code, icon_name, route, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (code) DO UPDATE SET 
            header_id = EXCLUDED.header_id,
            name = EXCLUDED.name,
            icon_name = EXCLUDED.icon_name,
            route = EXCLUDED.route,
            sort_order = EXCLUDED.sort_order
        `, [headerId, i.name, i.code, i.icon_name, i.route, i.sort_order]);
      }
    }

    // 3. Grant access to Superadmin
    console.log('🔐 Granting Superadmin role access to all items...');
    await pool.query(`
      INSERT INTO nexus.role_menu_access (role_name, menu_item_id, is_visible)
      SELECT 'Superadmin', id, true FROM nexus.menu_item
      ON CONFLICT (role_name, menu_item_id, tenant_id) DO UPDATE SET is_visible = true
    `);

    console.log('✅ Superadmin menu seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding superadmin menu:', err.message);
  } finally {
    await pool.end();
  }
}

seedSuperadminMenu();
