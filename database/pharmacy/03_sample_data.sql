-- ============================================================
-- MedFlow EMR- Sample Pharmacy Data
-- Run this THIRD in Neon SQL Editor (after tables are created)
-- ============================================================

BEGIN;

-- Common Medications (US Market)
INSERT INTO emr.drug_master 
(tenant_id, generic_name, brand_names, strength, dosage_form, route,
 ndc_code, rxnorm_code, snomed_code, schedule_type, high_alert_flag, pregnancy_category)
VALUES
(NULL, 'Acetaminophen', ARRAY['Tylenol', 'Panadol'], '500mg', 'Tablet', 'Oral',
 '50580-496', '161', '323987006', 'OTC', false, 'B'),

(NULL, 'Ibuprofen', ARRAY['Advil', 'Motrin', 'Nuprin'], '400mg', 'Tablet', 'Oral',
 '00074-6631', '5640', '372552008', 'OTC', false, 'B'),

(NULL, 'Naproxen', ARRAY['Aleve', 'Naprosyn'], '250mg', 'Tablet', 'Oral',
 '50580-378', '7258', '372552008', 'OTC', false, 'B'),

(NULL, 'Amoxicillin', ARRAY['Amoxil', 'Trimox'], '500mg', 'Capsule', 'Oral',
 '00093-3137', '723', '372552008', 'Prescription', false, 'B'),

(NULL, 'Azithromycin', ARRAY['Zithromax', 'Z-Pak'], '250mg', 'Tablet', 'Oral',
 '00074-3473', '18631', '372552008', 'Prescription', false, 'B'),

(NULL, 'Ciprofloxacin', ARRAY['Cipro'], '500mg', 'Tablet', 'Oral',
 '00026-0750', '2551', '372552008', 'Prescription', false, 'C'),

(NULL, 'Lisinopril', ARRAY['Prinivil', 'Zestril'], '10mg', 'Tablet', 'Oral',
 '00071-0154', '29046', '372552008', 'Prescription', false, 'D'),

(NULL, 'Metoprolol', ARRAY['Lopressor', 'Toprol-XL'], '50mg', 'Tablet', 'Oral',
 '00078-0348', '6918', '372552008', 'Prescription', false, 'C'),

(NULL, 'Amlodipine', ARRAY['Norvasc'], '5mg', 'Tablet', 'Oral',
 '00069-1530', '17767', '372552008', 'Prescription', false, 'C'),

(NULL, 'Metformin', ARRAY['Glucophage'], '500mg', 'Tablet', 'Oral',
 '00087-6060', '6809', '372552008', 'Prescription', false, 'B'),

(NULL, 'Insulin Glargine', ARRAY['Lantus', 'Basaglar'], '100 units/mL', 'Solution', 'Subcutaneous',
 '00088-2220', '261551', '372724001', 'Prescription', true, 'B'),

(NULL, 'Albuterol', ARRAY['Ventolin', 'ProAir'], '90mcg/actuation', 'Inhalation Aerosol', 'Inhalation',
 '00085-1193', '435', '372552008', 'Prescription', false, 'C'),

(NULL, 'Fluticasone', ARRAY['Flovent'], '110mcg/actuation', 'Inhalation Aerosol', 'Inhalation',
 '00173-0722', '41126', '372552008', 'Prescription', false, 'C'),

(NULL, 'Sertraline', ARRAY['Zoloft'], '50mg', 'Tablet', 'Oral',
 '00049-4960', '36437', '372552008', 'Prescription', false, 'C'),

(NULL, 'Alprazolam', ARRAY['Xanax'], '0.5mg', 'Tablet', 'Oral',
 '00009-0029', '596', '372552008', 'Controlled-IV', true, 'D'),

(NULL, 'Zolpidem', ARRAY['Ambien'], '10mg', 'Tablet', 'Oral',
 '00024-5421', '39993', '372552008', 'Controlled-IV', true, 'B'),

(NULL, 'Omeprazole', ARRAY['Prilosec'], '20mg', 'Delayed-release Capsule', 'Oral',
 '00037-0172', '7646', '372552008', 'OTC', false, 'C'),

(NULL, 'Pantoprazole', ARRAY['Protonix'], '40mg', 'Delayed-release Tablet', 'Oral',
 '00008-0841', '40790', '372552008', 'Prescription', false, 'B'),

(NULL, 'Warfarin', ARRAY['Coumadin'], '5mg', 'Tablet', 'Oral',
 '00056-0173', '11289', '372552008', 'Prescription', true, 'X'),

(NULL, 'Heparin', ARRAY[]::text[], '5000 units/mL', 'Solution', 'Intravenous',
 '00074-6586', '5093', '372552008', 'Prescription', true, 'C'),

(NULL, 'Enoxaparin', ARRAY['Lovenox'], '40mg/0.4mL', 'Solution', 'Subcutaneous',
 '00075-0632', '40178', '372552008', 'Prescription', true, 'B'),

(NULL, 'Hydrocodone/Acetaminophen', ARRAY['Vicodin', 'Norco'], '5mg/325mg', 'Tablet', 'Oral',
 '00074-6628', '197923', '372552008', 'Controlled-II', true, 'C'),

(NULL, 'Oxycodone', ARRAY['OxyContin', 'Roxicodone'], '10mg', 'Tablet', 'Oral',
 '00074-6616', '7804', '372552008', 'Controlled-II', true, 'B'),

(NULL, 'Tramadol', ARRAY['Ultram'], '50mg', 'Tablet', 'Oral',
 '00045-0315', '10689', '372552008', 'Controlled-IV', true, 'C'),

(NULL, 'Hydrocortisone', ARRAY['Cortaid'], '1%', 'Cream', 'Topical',
 '00045-0462', '5514', '372552008', 'OTC', false, 'C'),

(NULL, 'Triamcinolone', ARRAY['Kenalog'], '0.1%', 'Cream', 'Topical',
 '00008-0630', '10753', '372552008', 'Prescription', false, 'C');

COMMIT;

-- Drug Interactions (separate transaction to avoid rollback issues)
BEGIN;

INSERT INTO emr.drug_interactions
(drug_a, drug_b, severity, description, mechanism, management)
SELECT 
  da.drug_id, db.drug_id, 'major',
  'Increased risk of bleeding when warfarin is combined with NSAIDs',
  'NSAIDs inhibit platelet aggregation and may damage GI mucosa, potentiating warfarin anticoagulation',
  'Monitor INR closely. Consider alternative analgesic. Educate patient on bleeding signs.'
FROM emr.drug_master da, emr.drug_master db
WHERE da.generic_name = 'Warfarin' AND db.generic_name IN ('Ibuprofen', 'Naproxen');

INSERT INTO emr.drug_interactions
(drug_a, drug_b, severity, description, mechanism, management)
SELECT 
  da.drug_id, db.drug_id, 'major',
  'Increased risk of hypoglycemia when insulin is combined with beta-blockers',
  'Beta-blockers may mask hypoglycemia symptoms and prolong insulin effect',
  'Monitor blood glucose closely. Adjust insulin dose as needed.'
FROM emr.drug_master da, emr.drug_master db
WHERE da.generic_name = 'Insulin Glargine' AND db.generic_name = 'Metoprolol';

COMMIT;

-- Sample Drug Batches (final transaction)
BEGIN;

INSERT INTO emr.drug_batches
(drug_id, batch_number, quantity_received, quantity_remaining, expiry_date, purchase_price, location, status)
SELECT 
  dm.drug_id, 
  'BATCH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || ROW_NUMBER() OVER (PARTITION BY dm.drug_id)::text,
  100,
  FLOOR(RANDOM() * 80 + 20)::numeric,
  CURRENT_DATE + INTERVAL '6 months' + (RANDOM() * INTERVAL '12 months'),
  ROUND((RANDOM() * 50 +5)::numeric, 2),
  CASE FLOOR(RANDOM() * 3)::int
    WHEN 0 THEN 'Shelf A-1'
    WHEN 1 THEN 'Shelf B-2'
    WHEN 2 THEN 'Refrigerator R-1'
  END,
  'active'
FROM emr.drug_master dm
WHERE dm.status = 'active'
LIMIT 50;

COMMIT;

-- Final verification
SELECT '✅ Drugs Loaded' as status, COUNT(*) as count FROM emr.drug_master WHERE tenant_id IS NULL
UNION ALL
SELECT '✅ Interactions Created', COUNT(*) FROM emr.drug_interactions
UNION ALL
SELECT '✅ Batches Created', COUNT(*) FROM emr.drug_batches;

-- Show sample drugs
SELECT generic_name, brand_names[1] as brand_name, dosage_form, schedule_type
FROM emr.drug_master
WHERE tenant_id IS NULL
ORDER BY generic_name
LIMIT 10;
