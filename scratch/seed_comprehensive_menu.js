import { pathToFileURL } from 'url';
import path from 'path';

// Robust absolute path resolution
const projectRoot = process.cwd();
const connectionPath = path.join(projectRoot, 'server', 'db', 'connection.js');
const connectionUrl = pathToFileURL(connectionPath).href;

async function seedMenu() {
    try {
        const { query } = await import(connectionUrl);
        console.log("🚀 Seeding ALL missing menu items for Admin...");

        // 1. Ensure Headers exist
        const headers = [
            { name: 'Patient Care', code: 'patient_care', icon: 'UserPlus', sort: 1 },
            { name: 'Clinical Services', code: 'clinical_services', icon: 'Stethoscope', sort: 2 },
            { name: 'Operations', code: 'operations', icon: 'Settings', sort: 3 },
            { name: 'Administration', code: 'administration', icon: 'Shield', sort: 4 },
            { name: 'Reports & Communication', code: 'reports_header', icon: 'BarChart3', sort: 5 },
            { name: 'Inventory & Pharmacy', code: 'inventory_pharmacy', icon: 'Package', sort: 6 },
            { name: 'HR & Payroll', code: 'hr_payroll', icon: 'Users', sort: 7 },
            { name: 'Finance & Insurance', code: 'finance_insurance', icon: 'CreditCard', sort: 8 }
        ];

        for (const h of headers) {
            await query(`
                INSERT INTO nexus.menu_header (name, code, icon_name, sort_order)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, icon_name = EXCLUDED.icon_name, sort_order = EXCLUDED.sort_order
            `, [h.name, h.code, h.icon, h.sort]);
        }

        const headerIds = {};
        const res = await query(`SELECT id, code FROM nexus.menu_header`);
        res.rows.forEach(r => headerIds[r.code] = r.id);

        // 2. Define ALL Menu Items for Admin
        const items = [
            // Administration
            { header: 'administration', name: 'Feature Flags', code: 'feature_flags', icon: 'Flag', route: '/admin/features', sort: 10 },
            { header: 'administration', name: 'System Settings', code: 'system_settings', icon: 'Sliders', route: '/admin/system', sort: 11 },
            { header: 'administration', name: 'Master Data Hub', code: 'admin_masters', icon: 'Database', route: '/admin/masters', sort: 1 },
            { header: 'administration', name: 'User Management', code: 'users', icon: 'Users', route: '/admin/users', sort: 2 },
            { header: 'administration', name: 'Tenant Settings', code: 'hospital_settings', icon: 'Settings', route: '/admin/settings', sort: 3 },
            { header: 'administration', name: 'Role Management', code: 'roles', icon: 'ShieldCheck', route: '/admin/roles', sort: 4 },
            { header: 'administration', name: 'Departments', code: 'departments', icon: 'Building2', route: '/admin/departments', sort: 5 },
            { header: 'administration', name: 'Specialities', code: 'specialities', icon: 'Activity', route: '/admin/specialities', sort: 6 },

            // Patient Care
            { header: 'patient_care', name: 'Registration', code: 'registration', icon: 'UserPlus', route: '/registration', sort: 1 },
            { header: 'patient_care', name: 'Appointments', code: 'appointments', icon: 'Calendar', route: '/appointments', sort: 2 },
            { header: 'patient_care', name: 'Patients', code: 'patients', icon: 'Users', route: '/patients', sort: 3 },
            { header: 'patient_care', name: 'Find Doctor', code: 'find_doctor', icon: 'Search', route: '/find-doctor', sort: 4 },
            { header: 'patient_care', name: 'Doctor Timing', code: 'doctor_availability', icon: 'Clock', route: '/doctor-availability', sort: 5 },
            { header: 'patient_care', name: 'Lab Timing', code: 'lab_availability', icon: 'FlaskConical', route: '/lab-availability', sort: 6 },
            { header: 'patient_care', name: 'Ambulance', code: 'ambulance', icon: 'Truck', route: '/ambulance', sort: 7 },

            // Clinical Services
            { header: 'clinical_services', name: 'Doctor Workspace', code: 'doctor_workspace', icon: 'Briefcase', route: '/doctor-workspace', sort: 1 },
            { header: 'clinical_services', name: 'EMR Encounters', code: 'emr', icon: 'ClipboardList', route: '/emr', sort: 2 },
            { header: 'clinical_services', name: 'Laboratory', code: 'lab', icon: 'FlaskConical', route: '/lab', sort: 3 },
            { header: 'clinical_services', name: 'Inpatient (IPD)', code: 'inpatient', icon: 'Bed', route: '/inpatient', sort: 4 },
            { header: 'clinical_services', name: 'Bed Management', code: 'bed_management', icon: 'Layout', route: '/beds', sort: 5 },
            { header: 'clinical_services', name: 'AI Vision Analysis', code: 'ai_vision', icon: 'Eye', route: '/ai-vision', sort: 6 },

            // Inventory & Pharmacy
            { header: 'inventory_pharmacy', name: 'Pharmacy', code: 'pharmacy', icon: 'Pill', route: '/pharmacy', sort: 1 },
            { header: 'inventory_pharmacy', name: 'Inventory Store', code: 'inventory', icon: 'Package', route: '/inventory', sort: 2 },
            { header: 'inventory_pharmacy', name: 'Blood Bank', code: 'donor', icon: 'Droplets', route: '/blood-bank', sort: 3 },

            // HR & Payroll
            { header: 'hr_payroll', name: 'Employees', code: 'employees', icon: 'Users', route: '/employees', sort: 1 },
            { header: 'hr_payroll', name: 'Attendance', code: 'attendance', icon: 'Clock', route: '/attendance', sort: 2 },
            { header: 'hr_payroll', name: 'Payroll Service', code: 'payroll_service', icon: 'Wallet', route: '/payroll', sort: 3 },
            { header: 'hr_payroll', name: 'Staff Management', code: 'staff_management', icon: 'UserCog', route: '/staff', sort: 4 },

            // Finance & Insurance
            { header: 'finance_insurance', name: 'Billing', code: 'billing', icon: 'CreditCard', route: '/billing', sort: 1 },
            { header: 'finance_insurance', name: 'Insurance', code: 'insurance', icon: 'Shield', route: '/insurance', sort: 2 },
            { header: 'finance_insurance', name: 'Financial Ledger', code: 'financial_ledger', icon: 'BookOpen', route: '/finance', sort: 3 },
            { header: 'finance_insurance', name: 'Service Catalog', code: 'service_catalog', icon: 'List', route: '/services', sort: 4 },

            // Reports & Communication
            { header: 'reports_header', name: 'Clinical Reports', code: 'reports', icon: 'BarChart3', route: '/reports', sort: 1 },
            { header: 'reports_header', name: 'Communication Hub', code: 'communication', icon: 'Mail', route: '/communication', sort: 2 },
            { header: 'reports_header', name: 'Document Vault', code: 'documents', icon: 'FileText', route: '/documents', sort: 3 },
            { header: 'reports_header', name: 'Support Tickets', code: 'support', icon: 'HelpCircle', route: '/support', sort: 4 },
            { header: 'reports_header', name: 'Chat', code: 'chat', icon: 'MessageSquare', route: '/chat', sort: 5 }
        ];

        for (const i of items) {
            await query(`
                INSERT INTO nexus.menu_item (header_id, name, code, icon_name, route, sort_order, subscription_plans)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (code) DO UPDATE SET 
                    header_id = EXCLUDED.header_id,
                    name = EXCLUDED.name,
                    icon_name = EXCLUDED.icon_name,
                    route = EXCLUDED.route,
                    sort_order = EXCLUDED.sort_order,
                    subscription_plans = '["basic", "professional", "enterprise"]'::jsonb
            `, [headerIds[i.header], i.name, i.code, i.icon, i.route, i.sort, '["basic", "professional", "enterprise"]']);
        }

        // 3. Grant access to Admin role
        console.log("✅ Granting access to 'Admin' and 'admin' roles...");
        await query(`
            INSERT INTO nexus.role_menu_access (role_name, menu_item_id, is_visible)
            SELECT r.role, mi.id, true 
            FROM (SELECT 'Admin' as role UNION SELECT 'admin' as role) r
            CROSS JOIN nexus.menu_item mi
            ON CONFLICT DO NOTHING
        `);

        console.log("✨ Comprehensive Menu seeding complete!");
    } catch (e) {
        console.error("❌ Seeding failed:", e);
    } finally {
        process.exit(0);
    }
}

seedMenu();
