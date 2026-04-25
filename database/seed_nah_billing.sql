-- New Age Hospital (NAH) Billing and Financial Data (Schema-Compatible)
-- Uses enhanced invoices + expenses tables

BEGIN;

-- =====================================================
-- NAH INVOICES (Create from encounters)
-- =====================================================
WITH enc AS (
  SELECT
    e.id,
    e.tenant_id,
    e.patient_id,
    e.visit_date,
    row_number() OVER (ORDER BY e.visit_date, e.id) AS rn
  FROM encounters e
  WHERE e.tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
),
calc AS (
  SELECT
    enc.*,
    (100 + (enc.rn % 6) * 75)::numeric(12,2) AS subtotal,
    round((100 + (enc.rn % 6) * 75)::numeric * 0.05, 2) AS tax
  FROM enc
)
INSERT INTO invoices (
  tenant_id,
  patient_id,
  encounter_id,
  invoice_number,
  description,
  subtotal,
  tax,
  total,
  paid,
  status,
  created_at
)
SELECT
  c.tenant_id,
  c.patient_id,
  c.id AS encounter_id,
  format('INV-NAH-%s-%03s', to_char(c.visit_date, 'YYYYMMDD'), c.rn),
  'Consultation and services',
  c.subtotal,
  c.tax,
  c.subtotal + c.tax AS total,
  CASE WHEN c.rn % 4 = 0 THEN c.subtotal + c.tax ELSE 0 END AS paid,
  CASE
    WHEN c.rn % 7 = 0 THEN 'void'
    WHEN c.rn % 4 = 0 THEN 'paid'
    ELSE 'issued'
  END AS status,
  now()
FROM calc c
ON CONFLICT DO NOTHING;

-- =====================================================
-- NAH EXPENSES (Operational costs for realistic metrics)
-- =====================================================
INSERT INTO expenses (
  tenant_id,
  category,
  description,
  amount,
  date,
  payment_method,
  reference,
  recorded_by
)
VALUES
-- Staff Salaries (Monthly)
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Salary','Monthly staff salaries - NAH Payroll',85000.00,CURRENT_DATE - INTERVAL '1 day','Bank Transfer','NAH Payroll',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Salary','Monthly staff salaries - NAH Payroll',85000.00,CURRENT_DATE - INTERVAL '32 days','Bank Transfer','NAH Payroll',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Salary','Monthly staff salaries - NAH Payroll',82000.00,CURRENT_DATE - INTERVAL '62 days','Bank Transfer','NAH Payroll',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Salary','Monthly staff salaries - NAH Payroll',88000.00,CURRENT_DATE - INTERVAL '92 days','Bank Transfer','NAH Payroll',NULL),

-- Medical Supplies
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Purchase','Weekly medical supplies - MedSupply Co',15000.00,CURRENT_DATE - INTERVAL '1 day','Bank Transfer','MedSupply Co',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Purchase','Weekly medical supplies - MedSupply Co',14500.00,CURRENT_DATE - INTERVAL '8 days','Bank Transfer','MedSupply Co',NULL),

-- Pharmacy Inventory
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Purchase','Weekly pharmacy restock - PharmaCorp',22000.00,CURRENT_DATE - INTERVAL '1 day','Bank Transfer','PharmaCorp',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Purchase','Weekly pharmacy restock - PharmaCorp',25000.00,CURRENT_DATE - INTERVAL '8 days','Bank Transfer','PharmaCorp',NULL),

-- Equipment Maintenance
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Maintenance','MRI machine maintenance - MedTech Services',8500.00,CURRENT_DATE - INTERVAL '5 days','Bank Transfer','MedTech Services',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Maintenance','X-ray equipment maintenance - MedTech Services',3200.00,CURRENT_DATE - INTERVAL '12 days','Bank Transfer','MedTech Services',NULL),

-- Utilities
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Utilities','Monthly utilities - City Utilities',12000.00,CURRENT_DATE - INTERVAL '1 day','Bank Transfer','City Utilities',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Utilities','Monthly utilities - City Utilities',11500.00,CURRENT_DATE - INTERVAL '32 days','Bank Transfer','City Utilities',NULL),

-- Certifications / Licenses
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Certifications','Medical malpractice insurance - HealthGuard',8500.00,CURRENT_DATE - INTERVAL '10 days','Bank Transfer','HealthGuard',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Certifications','Hospital license renewal - State Health Dept',3200.00,CURRENT_DATE - INTERVAL '15 days','Bank Transfer','State Health Dept',NULL),

-- Administration
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Other','Office supplies and admin - Office Depot',8500.00,CURRENT_DATE - INTERVAL '1 day','Bank Transfer','Office Depot',NULL),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Other','Office supplies and admin - Office Depot',7200.00,CURRENT_DATE - INTERVAL '8 days','Bank Transfer','Office Depot',NULL)
ON CONFLICT DO NOTHING;

COMMIT;
