/**
 * Financial Management Service
 * Handles attendance, expenses, and financial summarizing
 */

import { query } from './connection.js';

// =====================================================
// ATTENDANCE
// =====================================================

export async function recordAttendance({ tenantId, employeeId, date, timeIn, timeOut, status }) {
    const sql = `
    INSERT INTO attendance (tenant_id, employee_id, date, check_in, check_out, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tenant_id, employee_id, date) DO UPDATE 
    SET check_in = COALESCE(EXCLUDED.check_in, attendance.check_in),
        check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING *
  `;
    const result = await query(sql, [tenantId, employeeId, date, timeIn || null, timeOut || null, status]);
    return result.rows[0];
}

export async function getAttendance(tenantId, date) {
    const sql = `
    SELECT a.*, e.name, e.code, e.shift 
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.tenant_id::text = $1::text AND a.date = $2
  `;
    const result = await query(sql, [tenantId, date]);
    return result.rows;
}

// =====================================================
// EXPENSES & REVENUE
// =====================================================

export async function addExpense({ tenantId, category, description, amount, date, paymentMethod, reference, recordedBy }) {
    const sql = `
    INSERT INTO expenses (tenant_id, category, description, amount, date, payment_method, reference, recorded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
    const result = await query(sql, [tenantId, category, description, amount, date, paymentMethod, reference, recordedBy]);
    return result.rows[0];
}

export async function getExpenses(tenantId, filters = {}) {
    let sql = `SELECT * FROM expenses WHERE tenant_id::text = $1::text`;
    const params = [tenantId];
    if (filters.month) {
        sql += ` AND DATE_TRUNC('month', date) = $2`;
        params.push(filters.month);
    }
    sql += ` ORDER BY date DESC`;
    const result = await query(sql, params);
    return result.rows;
}

export async function getFinancialSummary(tenantId, month) {
    // 1. Income (Invoices)
    const incomeSql = `
    SELECT COALESCE(SUM(paid), 0) as total_income 
    FROM invoices 
    WHERE tenant_id::text = $1::text AND status IN ('paid', 'partially_paid') 
    AND DATE_TRUNC('month', created_at) = $2::timestamp
  `;

    // 2. Expenses
    const expenseSql = `
    SELECT category, COALESCE(SUM(amount), 0) as total 
    FROM expenses 
    WHERE tenant_id::text = $1::text 
    AND DATE_TRUNC('month', date) = $2::timestamp 
    GROUP BY category
  `;

    // 3. Salaries (Estimated from Employee Master)
    const salarySql = `
    SELECT COALESCE(SUM(salary), 0) as total_salaries FROM employees WHERE tenant_id::text = $1::text
  `;

    const [incomeRes, expenseRes, salaryRes] = await Promise.all([
        query(incomeSql, [tenantId, month]),
        query(expenseSql, [tenantId, month]),
        query(salarySql, [tenantId])
    ]);

    return {
        month,
        income: parseFloat(incomeRes.rows[0]?.total_income || 0),
        expenses: expenseRes.rows.reduce((acc, row) => {
            acc[row.category] = parseFloat(row.total);
            return acc;
        }, {}),
        projectedSalaries: parseFloat(salaryRes.rows[0]?.total_salaries || 0)
    };
}

export async function getDoctorPayouts(tenantId) {
    const sql = `
    SELECT 
      u.id as doctor_id,
      u.name as doctor_name,
      u.role,
      COUNT(DISTINCT e.patient_id) as patient_count,
      COUNT(DISTINCT e.id) as encounter_count,
      COALESCE(SUM(i.total), 0) as total_revenue,
      COALESCE(SUM(i.paid), 0) as collected_amount,
      (COALESCE(SUM(i.paid), 0) * 0.30) as estimated_commission
    FROM nexus.users u
    JOIN encounters e ON u.id = e.provider_id
    JOIN invoices i ON e.id = i.encounter_id
    WHERE u.tenant_id::text = $1::text 
      AND u.role = 'Doctor'
      AND i.status = 'paid'
      AND i.created_at > (NOW() - INTERVAL '30 days')
    GROUP BY u.id, u.name, u.role
    ORDER BY total_revenue DESC
  `;
    const result = await query(sql, [tenantId]);
    return result.rows;
}
