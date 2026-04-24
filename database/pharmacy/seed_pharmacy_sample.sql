-- Pharmacy Module Sample Data
-- Insert common medications with RxNorm/SNOMED codes

BEGIN;

-- =====================================================
-- COMMON MEDICATIONS (US Market)
-- =====================================================

-- Pain Management
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

-- Antibiotics
(NULL, 'Amoxicillin', ARRAY['Amoxil', 'Trimox'], '500mg', 'Capsule', 'Oral',
 '00093-3137', '723', '372552008', 'Prescription', false, 'B'),

(NULL, 'Azithromycin', ARRAY['Zithromax', 'Z-Pak'], '250mg', 'Tablet', 'Oral',
 '00074-3473', '18631', '372552008', 'Prescription', false, 'B'),

(NULL, 'Ciprofloxacin', ARRAY['Cipro'], '500mg', 'Tablet', 'Oral',
 '00026-0750', '2551', '372552008', 'Prescription', false, 'C'),

-- Cardiovascular
(NULL, 'Lisinopril', ARRAY['Prinivil', 'Zestril'], '10mg', 'Tablet', 'Oral',
 '00071-0154', '29046', '372552008', 'Prescription', false, 'D'),

(NULL, 'Metoprolol', ARRAY['Lopressor', 'Toprol-XL'], '50mg', 'Tablet', 'Oral',
 '00078-0348', '6918', '372552008', 'Prescription', false, 'C'),

(NULL, 'Amlodipine', ARRAY['Norvasc'], '5mg', 'Tablet', 'Oral',
 '00069-1530', '17767', '372552008', 'Prescription', false, 'C'),

-- Diabetes
(NULL, 'Metformin', ARRAY['Glucophage'], '500mg', 'Tablet', 'Oral',
 '00087-6060', '6809', '372552008', 'Prescription', false, 'B'),

(NULL, 'Insulin Glargine', ARRAY['Lantus', 'Basaglar'], '100 units/mL', 'Solution', 'Subcutaneous',
 '00088-2220', '261551', '372724001', 'Prescription', true, 'B'),

-- Respiratory
(NULL, 'Albuterol', ARRAY['Ventolin', 'ProAir'], '90mcg/actuation', 'Inhalation Aerosol', 'Inhalation',
 '00085-1193', '435', '372552008', 'Prescription', false, 'C'),

(NULL, 'Fluticasone', ARRAY['Flovent'], '110mcg/actuation', 'Inhalation Aerosol', 'Inhalation',
 '00173-0722', '41126', '372552008', 'Prescription', false, 'C'),

-- CNS/Psychiatric
(NULL, 'Sertraline', ARRAY['Zoloft'], '50mg', 'Tablet', 'Oral',
 '00049-4960', '36437', '372552008', 'Prescription', false, 'C'),

(NULL, 'Alprazolam', ARRAY['Xanax'], '0.5mg', 'Tablet', 'Oral',
 '00009-0029', '596', '372552008', 'Controlled-IV', true, 'D'),

(NULL, 'Zolpidem', ARRAY['Ambien'], '10mg', 'Tablet', 'Oral',
 '00024-5421', '39993', '372552008', 'Controlled-IV', true, 'B'),

-- Gastrointestinal
(NULL, 'Omeprazole', ARRAY['Prilosec'], '20mg', 'Delayed-release Capsule', 'Oral',
 '00037-0172', '7646', '372552008', 'OTC', false, 'C'),

(NULL, 'Pantoprazole', ARRAY['Protonix'], '40mg', 'Delayed-release Tablet', 'Oral',
 '00008-0841', '40790', '372552008', 'Prescription', false, 'B'),

-- Anticoagulants (HIGH ALERT)
(NULL, 'Warfarin', ARRAY['Coumadin'], '5mg', 'Tablet', 'Oral',
 '00056-0173', '11289', '372552008', 'Prescription', true, 'X'),

(NULL, 'Heparin', ARRAY[]::text[], '5000 units/mL', 'Solution', 'Intravenous',
 '00074-6586', '5093', '372552008', 'Prescription', true, 'C'),

(NULL, 'Enoxaparin', ARRAY['Lovenox'], '40mg/0.4mL', 'Solution', 'Subcutaneous',
 '00075-0632', '40178', '372552008', 'Prescription', true, 'B'),

-- Opioids (HIGH ALERT, Controlled)
(NULL, 'Hydrocodone/Acetaminophen', ARRAY['Vicodin', 'Norco'], '5mg/325mg', 'Tablet', 'Oral',
 '00074-6628', '197923', '372552008', 'Controlled-II', true, 'C'),

(NULL, 'Oxycodone', ARRAY['OxyContin', 'Roxicodone'], '10mg', 'Tablet', 'Oral',
 '00074-6616', '7804', '372552008', 'Controlled-II', true, 'B'),

(NULL, 'Tramadol', ARRAY['Ultram'], '50mg', 'Tablet', 'Oral',
 '00045-0315', '10689', '372552008', 'Controlled-IV', true, 'C'),

-- Dermatological
(NULL, 'Hydrocortisone', ARRAY['Cortaid'], '1%', 'Cream', 'Topical',
 '00045-0462', '5514', '372552008', 'OTC', false, 'C'),

(NULL, 'Triamcinolone', ARRAY['Kenalog'], '0.1%', 'Cream', 'Topical',
 '00008-0630', '10753', '372552008', 'Prescription', false, 'C');

-- =====================================================
-- DRUG INTERACTIONS (Common & Clinically Significant)
-- =====================================================

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
  da.drug_id, db.drug_id, 'contraindicated',
  'Risk of serotonin syndrome when SSRIs are combined with MAOIs',
  'Excessive serotonin accumulation in CNS',
  'Do not use together. Allow 14-day washout period between MAOI and SSRI.'
FROM emr.drug_master da, emr.drug_master db
WHERE da.generic_name = 'Sertraline' AND db.generic_name LIKE '%MAOI%';

INSERT INTO emr.drug_interactions
(drug_a, drug_b, severity, description, mechanism, management)
SELECT 
  da.drug_id, db.drug_id, 'major',
  'Increased risk of hypoglycemia when insulin is combined with beta-blockers',
  'Beta-blockers may mask hypoglycemia symptoms and prolong insulin effect',
  'Monitor blood glucose closely. Adjust insulin dose as needed.'
FROM emr.drug_master da, emr.drug_master db
WHERE da.generic_name = 'Insulin Glargine' AND db.generic_name = 'Metoprolol';

INSERT INTO emr.drug_interactions
(drug_a, drug_b, severity, description, mechanism, management)
SELECT 
  da.drug_id, db.drug_id, 'moderate',
  'Reduced effectiveness of clopidogrel when combined with PPIs',
  'PPIs inhibit CYP2C19, reducing conversion of clopidogrel to active metabolite',
  'Consider using H2 blocker instead of PPI. If PPI necessary, use pantoprazole.'
FROM emr.drug_master da, emr.drug_master db
WHERE da.generic_name IN ('Omeprazole', 'Pantoprazole') AND db.generic_name = 'Clopidogrel';

-- =====================================================
-- SAMPLE DRUG BATCHES (For Inventory Testing)
-- =====================================================

INSERT INTO emr.drug_batches
(drug_id, batch_number, quantity_received, quantity_remaining, expiry_date, purchase_price, location, status)
SELECT 
  dm.drug_id, 
  'BATCH-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || ROW_NUMBER() OVER (PARTITION BY dm.drug_id),
  100, -- quantity received
  FLOOR(RANDOM() * 80 + 20)::numeric, -- random remaining quantity
  CURRENT_DATE + INTERVAL '6 months' + (RANDOM() * INTERVAL '12 months'), -- expiry between 6-18 months
  ROUND((RANDOM() * 50 + 5)::numeric, 2), -- price $5-55
  CASE FLOOR(RANDOM() * 3)::int
    WHEN 0 THEN 'Shelf A-1'
    WHEN 1 THEN 'Shelf B-2'
    WHEN 2 THEN 'Refrigerator R-1'
  END,
  'active'
FROM emr.drug_master dm
WHERE dm.status = 'active'
LIMIT 50; -- Create 50 batches total

COMMIT;
