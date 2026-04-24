-- New Age Hospital (NAH) Complete Data Seeding
-- Comprehensive demo data for dashboard with realistic metrics

BEGIN;

-- =====================================================
-- NEW AGE HOSPITAL (NAH) TENANT SETUP
-- =====================================================
INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, subscription_tier, status, created_at)
VALUES (
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'New Age Hospital',
  'NAH',
  'newagehospital',
  '{"primary": "#0f766e", "accent": "#06b6d4", "secondary": "#64748b", "success": "#10b981", "warning": "#f59e0b", "danger": "#ef4444"}',
  '{"dashboard": true, "patients": true, "appointments": true, "emr": true, "inpatient": true, "pharmacy": true, "billing": true, "insurance": true, "inventory": true, "employees": true, "accounts": true, "reports": true, "admin": true, "lab": true, "support": true, "telehealth": false}',
  'Professional',
  'active',
  NOW()
) ON CONFLICT (code) DO UPDATE SET subscription_tier = 'Professional', features = EXCLUDED.features;

-- =====================================================
-- NAH ADMIN USER
-- Email: admin@newage.hospital / Password: Admin@123
-- =====================================================
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000101'::uuid,
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'admin@newage.hospital',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC',
  'Dr. Sarah Johnson',
  'Admin',
  true,
  NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- =====================================================
-- NAH STAFF USERS (Multiple Roles)
-- =====================================================

-- Chief Medical Officer
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000102'::uuid,
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'cmo@nah.local',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC',
  'Dr. Michael Chen',
  'Doctor',
  true,
  NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Head Nurse
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000103'::uuid,
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'headnurse@nah.local',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC',
  'Emily Rodriguez',
  'Nurse',
  true,
  NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Pharmacy Manager
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000104'::uuid,
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'pharmacy@nah.local',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC',
  'James Wilson',
  'Pharmacy',
  true,
  NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Lab Technician
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000105'::uuid,
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'lab@nah.local',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC',
  'Lisa Anderson',
  'Lab',
  true,
  NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Billing Manager
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000106'::uuid,
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid,
  'billing@nah.local',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC',
  'Robert Taylor',
  'Accounts',
  true,
  NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- =====================================================
-- NAH PATIENTS (50 patients for realistic dashboard data)
-- =====================================================
INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, created_at)
VALUES
-- Emergency Department Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-001','John','Smith','1985-03-15','Male','+1-555-0101','john.smith@email.com','123 Main St, New York, NY','O+','Mary Smith: +1-555-0102','BlueCross #BC001','{"chronicConditions":"Hypertension","allergies":"Penicillin","surgeries":"Appendectomy 2010","familyHistory":"Heart Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-002','Maria','Garcia','1992-07-22','Female','+1-555-0103','maria.garcia@email.com','456 Oak Ave, New York, NY','A+','Carlos Garcia: +1-555-0104','Aetna #AE002','{"chronicConditions":"Asthma","allergies":"Pollen","surgeries":"None","familyHistory":"Diabetes"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-003','David','Johnson','1978-11-30','Male','+1-555-0105','david.j@email.com','789 Pine Rd, New York, NY','B+','Linda Johnson: +1-555-0106','Cigna #CI003','{"chronicConditions":"Type 2 Diabetes","allergies":"Sulfa","surgeries":"Knee Replacement 2018","familyHistory":"Hypertension"}',NOW()),

-- OPD Regular Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-001','Emily','Brown','1990-05-12','Female','+1-555-0107','emily.brown@email.com','321 Elm St, New York, NY','AB+','Robert Brown: +1-555-0108','UnitedHealth #UH004','{"chronicConditions":"Migraine","allergies":"None","surgeries":"None","familyHistory":"Migraine"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-002','William','Davis','1983-09-08','Male','+1-555-0109','william.d@email.com','654 Maple Dr, New York, NY','A-','Susan Davis: +1-555-0110','Humana #HU005','{"chronicConditions":"Arthritis","allergies":"NSAIDs","surgeries":"Hip Replacement 2019","familyHistory":"Arthritis"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-003','Patricia','Miller','1988-02-25','Female','+1-555-0111','patricia.m@email.com','987 Cedar Ln, New York, NY','O+','James Miller: +1-555-0112','Kaiser #KP006','{"chronicConditions":"Hypothyroidism","allergies":"Iodine","surgeries":"None","familyHistory":"Thyroid"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-004','Christopher','Wilson','1975-06-18','Male','+1-555-0113','chris.wilson@email.com','147 Birch Blvd, New York, NY','B-','Jennifer Wilson: +1-555-0114','BlueShield #BS007','{"chronicConditions":"COPD","allergies":"Dust","surgeries":"None","familyHistory":"Lung Disease"}',NOW()),

-- Inpatient Department
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-IP-001','Linda','Martinez','1965-12-03','Female','+1-555-0115','linda.m@email.com','258 Spruce Way, New York, NY','A+','Jose Martinez: +1-555-0116','Medicare #MC008','{"chronicConditions":"Congestive Heart Failure","allergies":"Beta Blockers","surgeries":"CABG 2015","familyHistory":"Heart Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-IP-002','Joseph','Anderson','1959-04-28','Male','+1-555-0117','joseph.anderson@email.com','369 Willow Creek, New York, NY','AB-','Margaret Anderson: +1-555-0118','Medicaid #MD009','{"chronicConditions":"Pneumonia","allergies":"None","surgeries":"None","familyHistory":"Asthma"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-IP-003','Barbara','Thomas','1972-08-14','Female','+1-555-0119','barbara.thomas@email.com','741 Aspen Grove, New York, NY','O+','Thomas Thomas: +1-555-0120','Aetna #AE010','{"chronicConditions":"Diabetes Type 1","allergies":"Insulin","surgeries":"None","familyHistory":"Diabetes"}',NOW()),

-- Pediatric Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-PED-001','Sophia','Jackson','2015-09-20','Female','+1-555-0121','sophia.j@email.com','852 Poplar St, New York, NY','B+','Mike Jackson: +1-555-0122','CHIP #CH011','{"chronicConditions":"None","allergies":"Peanuts","surgeries":"None","familyHistory":"None"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-PED-002','Ethan','White','2018-03-07','Male','+1-555-0123','ethan.w@email.com','963 Sycamore Ave, New York, NY','A-','Sarah White: +1-555-0124','CHIP #CH012','{"chronicConditions":"Asthma","allergies":"Dust Mites","surgeries":"None","familyHistory":"Asthma"}',NOW()),

-- Maternity Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-MAT-001','Amanda','Harris','1993-11-15','Female','+1-555-0125','amanda.h@email.com','174 Redwood Dr, New York, NY','O+','Tom Harris: +1-555-0126','BlueCross #BC013','{"chronicConditions":"Pregnancy","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-MAT-002','Jessica','Martin','1991-06-22','Female','+1-555-0127','jessica.m@email.com','285 Hickory Ln, New York, NY','AB+','Chris Martin: +1-555-0128','UnitedHealth #UH014','{"chronicConditions":"Pregnancy","allergies":"Latex","surgeries":"C-Section 2020","familyHistory":"None"}',NOW()),

-- Additional OPD Patients for realistic volume
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-005','Michael','Thompson','1980-01-10','Male','+1-555-0129','michael.t@email.com','396 Dogwood Way, New York, NY','A+','Laura Thompson: +1-555-0130','Cigna #CI015','{"chronicConditions":"Hypertension","allergies":"None","surgeries":"None","familyHistory":"Heart Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-006','Sarah','Garcia','1987-04-05','Female','+1-555-0131','sarah.g@email.com','507 Cypress Ave, New York, NY','B-','David Garcia: +1-555-0132','Humana #HU016','{"chronicConditions":"Anxiety","allergies":"None","surgeries":"None","familyHistory":"Depression"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-007','Kevin','Robinson','1976-07-30','Male','+1-555-0133','kevin.r@email.com','618 Pine Ridge Dr, New York, NY','O+','Michelle Robinson: +1-555-0134','Kaiser #KP017','{"chronicConditions":"High Cholesterol","allergies":"Statins","surgeries":"None","familyHistory":"Heart Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-008','Nancy','Clark','1994-10-18','Female','+1-555-0135','nancy.c@email.com','729 Elm St, New York, NY','AB+','Robert Clark: +1-555-0136','BlueShield #BS018','{"chronicConditions":"None","allergies":"Shellfish","surgeries":"None","familyHistory":"None"}',NOW()),

-- More patients for comprehensive data
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-009','Daniel','Lewis','1982-12-25','Male','+1-555-0137','daniel.l@email.com','840 Oak Grove, New York, NY','A-','Jennifer Lewis: +1-555-0138','Medicare #MC019','{"chronicConditions":"GERD","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-010','Betty','Walker','1968-05-12','Female','+1-555-0139','betty.w@email.com','951 Maple St, New York, NY','O+','William Walker: +1-555-0140','Aetna #AE020','{"chronicConditions":"Osteoporosis","allergies":"None","surgeries":"Hip Replacement 2017","familyHistory":"Arthritis"}',NOW()),

-- Emergency Walk-ins
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-004','Ryan','Hall','1996-08-03','Male','+1-555-0141','ryan.h@email.com','262 Cedar Rd, New York, NY','B+','Kelly Hall: +1-555-0142','UnitedHealth #UH021','{"chronicConditions":"None","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-005','Michelle','Young','1989-02-14','Female','+1-555-0143','michelle.y@email.com','373 Birch Ave, New York, NY','AB-','Jason Young: +1-555-0144','Cigna #CI022','{"chronicConditions":"None","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),

-- Chronic Disease Management Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-CHRON-001','Paul','King','1970-09-20','Male','+1-555-0145','paul.k@email.com','484 Spruce Ln, New York, NY','A+','Susan King: +1-555-0146','Medicare #MC023','{"chronicConditions":"Diabetes Type 2, Hypertension","allergies":"Sulfa","surgeries":"None","familyHistory":"Diabetes"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-CHRON-002','Helen','Wright','1962-06-08','Female','+1-555-0147','helen.w@email.com','595 Willow Way, New York, NY','B-','George Wright: +1-555-0148','Medicaid #MD024','{"chronicConditions":"COPD, Heart Disease","allergies":"None","surgeries":"CABG 2014","familyHistory":"Heart Disease"}',NOW()),

-- Surgical Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-SURG-001','Frank','Lopez','1977-11-30','Male','+1-555-0149','frank.l@email.com','706 Aspen Dr, New York, NY','O+','Maria Lopez: +1-555-0150','BlueCross #BC025','{"chronicConditions":"Gallstones","allergies":"None","surgeries":"None","familyHistory":"Gallstones"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-SURG-002','Cynthia','Hill','1985-04-17','Female','+1-555-0151','cynthia.h@email.com','817 Birch Blvd, New York, NY','AB+','Richard Hill: +1-555-0152','Humana #HU026','{"chronicConditions":"Hernia","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),

-- Geriatric Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-GER-001','Dorothy','Scott','1945-03-25','Female','+1-555-0153','dorothy.s@email.com','928 Cedar Grove, New York, NY','A-','Henry Scott: +1-555-0154','Medicare #MC027','{"chronicConditions":"Arthritis, Hypertension, Dementia","allergies":"None","surgeries":"Knee Replacement 2016","familyHistory":"Arthritis"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-GER-002','Charles','Green','1948-07-12','Male','+1-555-0155','charles.g@email.com','139 Poplar Ridge, New York, NY','B+','Eleanor Green: +1-555-0156','Medicare #MC028','{"chronicConditions":"Prostate Cancer, Diabetes","allergies":"None","surgeries":"Prostatectomy 2018","familyHistory":"Cancer"}',NOW()),

-- Mental Health Patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-MH-001','Sandra','Adams','1979-10-05','Female','+1-555-0157','sandra.a@email.com','240 Sycamore Way, New York, NY','O-','Mark Adams: +1-555-0158','BlueShield #BS029','{"chronicConditions":"Depression, Anxiety","allergies":"None","surgeries":"None","familyHistory":"Depression"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-MH-002','Steven','Baker','1986-02-28','Male','+1-555-0159','steven.b@email.com','351 Redwood Ave, New York, NY','AB+','Lisa Baker: +1-555-0160','UnitedHealth #UH030','{"chronicConditions":"Bipolar Disorder","allergies":"Lithium","surgeries":"None","familyHistory":"Bipolar"}',NOW()),

-- Additional diverse patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-011','Angela','Nelson','1991-08-15','Female','+1-555-0161','angela.n@email.com','462 Hickory Dr, New York, NY','A+','Thomas Nelson: +1-555-0162','Cigna #CI031','{"chronicConditions":"Migraine","allergies":"None","surgeries":"None","familyHistory":"Migraine"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-012','Ronald','Carter','1974-12-03','Male','+1-555-0163','ronald.c@email.com','573 Dogwood Ln, New York, NY','B-','Barbara Carter: +1-555-0164','Kaiser #KP032','{"chronicConditions":"Back Pain","allergies":"None","surgeries":"None","familyHistory":"Back Pain"}',NOW()),

-- Pediatric chronic conditions
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-PED-003','Olivia','Mitchell','2016-11-22','Female','+1-555-0165','olivia.m@email.com','684 Cypress Grove, New York, NY','O+','Paul Mitchell: +1-555-0166','CHIP #CH033','{"chronicConditions":"Type 1 Diabetes","allergies":"Insulin","surgeries":"None","familyHistory":"Diabetes"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-PED-004','Lucas','Perez','2017-05-09','Male','+1-555-0167','lucas.p@email.com','795 Elm Ridge, New York, NY','AB-','Ana Perez: +1-555-0168','CHIP #CH034','{"chronicConditions":"ADHD","allergies":"None","surgeries":"None","familyHistory":"ADHD"}',NOW()),

-- More emergency cases
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-006','Ashley','Roberts','1993-06-18','Female','+1-555-0169','ashley.r@email.com','906 Oak Valley, New York, NY','A+','Brian Roberts: +1-555-0170','BlueCross #BC035','{"chronicConditions":"None","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ER-007','Matthew','Turner','1988-09-25','Male','+1-555-0171','matthew.t@email.com','117 Pine Crest, New York, NY','B+','Nicole Turner: +1-555-0172','Aetna #AE036','{"chronicConditions":"None","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),

-- Rehabilitation patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-REHAB-001','Virginia','Phillips','1971-04-10','Female','+1-555-0173','virginia.p@email.com','228 Cedar Hill, New York, NY','O-','Edward Phillips: +1-555-0174','Medicare #MC037','{"chronicConditions":"Stroke Recovery","allergies":"None","surgeries":"None","familyHistory":"Stroke"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-REHAB-002','Gregory','Campbell','1967-08-30','Male','+1-555-0175','gregory.c@email.com','339 Birch Mountain, New York, NY','AB+','Diane Campbell: +1-555-0176','Medicaid #MD038','{"chronicConditions":"Spinal Cord Injury","allergies":"None","surgeries":"None","familyHistory":"None"}',NOW()),

-- Oncology patients
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ONC-001','Rachel','Parker','1980-12-15','Female','+1-555-0177','rachel.p@email.com','450 Willow Creek, New York, NY','A-','James Parker: +1-555-0178','BlueShield #BS039','{"chronicConditions":"Breast Cancer","allergies":"Chemotherapy","surgeries":"Lumpectomy 2023","familyHistory":"Breast Cancer"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-ONC-002','Lawrence','Evans','1976-03-22','Male','+1-555-0179','lawrence.e@email.com','561 Aspen Heights, New York, NY','B+','Susan Evans: +1-555-0180','UnitedHealth #UH040','{"chronicConditions":"Lung Cancer","allergies":"None","surgeries":"None","familyHistory":"Lung Cancer"}',NOW()),

-- Final batch for comprehensive dataset
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-013','Teresa','Collins','1984-07-08','Female','+1-555-0181','teresa.c@email.com','672 Spruce Valley, New York, NY','O+','Michael Collins: +1-555-0182','Humana #HU041','{"chronicConditions":"Hypertension","allergies":"None","surgeries":"None","familyHistory":"Heart Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-014','Edward','Stewart','1973-11-27','Male','+1-555-0183','edward.s@email.com','783 Birch Ridge, New York, NY','AB-','Linda Stewart: +1-555-0184','Kaiser #KP042','{"chronicConditions":"High Cholesterol","allergies":"Statins","surgeries":"None","familyHistory":"Heart Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-015','Frances','Morris','1990-01-14','Female','+1-555-0185','frances.m@email.com','894 Cedar Grove, New York, NY','A+','David Morris: +1-555-0186','Cigna #CI043','{"chronicConditions":"Anemia","allergies":"Iron","surgeries":"None","familyHistory":"Anemia"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-016','Roger','Murphy','1969-05-19','Male','+1-555-0187','roger.m@email.com','905 Pine Mountain, New York, NY','B-','Patricia Murphy: +1-555-0188','BlueCross #BC044','{"chronicConditions":"Kidney Disease","allergies":"None","surgeries":"None","familyHistory":"Kidney Disease"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-017','Joyce','Rogers','1987-09-02','Female','+1-555-0189','joyce.r@email.com','116 Willow Brook, New York, NY','O+','William Rogers: +1-555-0190','Aetna #AE045','{"chronicConditions":"Fibromyalgia","allergies":"None","surgeries":"None","familyHistory":"Fibromyalgia"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-018','Gary','Bell','1975-06-25','Male','+1-555-0191','gary.b@email.com','227 Oak Ridge, New York, NY','AB+','Catherine Bell: +1-555-0192','UnitedHealth #UH046','{"chronicConditions":"Gout","allergies":"None","surgeries":"None","familyHistory":"Gout"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-019','Diane','Bailey','1992-04-11','Female','+1-555-0193','diane.b@email.com','338 Birch Valley, New York, NY','A-','Steven Bailey: +1-555-0194','BlueShield #BS047','{"chronicConditions":"PCOS","allergies":"None","surgeries":"None","familyHistory":"PCOS"}',NOW()),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NAH-OPD-020','Terry','Rivera','1981-08-17','Male','+1-555-0195','terry.r@email.com','449 Cedar Heights, New York, NY','B+','Maria Rivera: +1-555-0196','Humana #HU048','{"chronicConditions":"Ulcerative Colitis","allergies":"None","surgeries":"None","familyHistory":"IBD"}',NOW())
ON CONFLICT (tenant_id, mrn) DO NOTHING;

COMMIT;
