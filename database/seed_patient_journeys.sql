-- Patient Journey Seed Data: 10 patients per tenant with appointments, encounters, invoices
-- Run against the Neon PostgreSQL database

BEGIN;

-- =====================================================
-- HELPER: Get user IDs for each tenant
-- =====================================================

-- SCH tenant: 10000000-0000-0000-0000-000000000001
-- NHC tenant: 10000000-0000-0000-0000-000000000002
-- RCC tenant: 10000000-0000-0000-0000-000000000003
-- OH  tenant: 10000000-0000-0000-0000-000000000004

-- =====================================================
-- SCH PATIENTS (10)
-- =====================================================
INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history)
VALUES
('10000000-0000-0000-0000-000000000001','SCH-1002','Arun','Nair','1990-06-12','Male','+91-9001000101','arun.nair@example.com','45 Anna Salai, Chennai','A+','Priya Nair: +91-9001000102','National Insurance #A100','{"chronicConditions":"None","allergies":"None","surgeries":"None","familyHistory":"Diabetes (Father)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1003','Deepa','Rajan','1982-11-25','Female','+91-9001000103','deepa.r@example.com','12 T Nagar, Chennai','B+','Rajan K: +91-9001000104','Star Health #B200','{"chronicConditions":"Asthma","allergies":"Dust","surgeries":"Tonsillectomy (2005)","familyHistory":"Hypertension (Mother)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1004','Karthik','Subramani','1975-03-08','Male','+91-9001000105','karthik.s@example.com','78 Adyar, Chennai','O-','Lakshmi S: +91-9001000106','ICICI Lombard #C300','{"chronicConditions":"Type 2 Diabetes","allergies":"Sulfa drugs","surgeries":"Knee replacement (2018)","familyHistory":"Heart disease (Father)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1005','Lakshmi','Venkatesh','1995-09-18','Female','+91-9001000107','lakshmi.v@example.com','34 Mylapore, Chennai','AB+','Venkatesh R: +91-9001000108','Apollo Munich #D400','{"chronicConditions":"None","allergies":"Peanuts","surgeries":"None","familyHistory":"None"}'),
('10000000-0000-0000-0000-000000000001','SCH-1006','Mohan','Pillai','1968-01-22','Male','+91-9001000109','mohan.p@example.com','56 Velachery, Chennai','B-','Sita Pillai: +91-9001000110','LIC Health #E500','{"chronicConditions":"Hypertension, Cholesterol","allergies":"Aspirin","surgeries":"Cataract (2020)","familyHistory":"Stroke (Mother)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1007','Nithya','Gopal','1988-07-04','Female','+91-9001000111','nithya.g@example.com','23 Besant Nagar, Chennai','A-','Gopal R: +91-9001000112','Max Bupa #F600','{"chronicConditions":"Migraine","allergies":"None","surgeries":"Appendectomy (2015)","familyHistory":"Migraine (Mother)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1008','Prasad','Kumar','1970-12-30','Male','+91-9001000113','prasad.k@example.com','89 Guindy, Chennai','O+','Radha Kumar: +91-9001000114','New India Assurance #G700','{"chronicConditions":"COPD","allergies":"Penicillin","surgeries":"Hernia repair (2012)","familyHistory":"Lung cancer (Father)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1009','Revathi','Sundaram','1993-04-15','Female','+91-9001000115','revathi.s@example.com','67 Ashok Nagar, Chennai','A+','Sundaram M: +91-9001000116','Religare Health #H800','{"chronicConditions":"Hypothyroidism","allergies":"Shellfish","surgeries":"None","familyHistory":"Thyroid (Mother)"}'),
('10000000-0000-0000-0000-000000000001','SCH-1010','Suresh','Babu','1985-08-20','Male','+91-9001000117','suresh.b@example.com','11 Nungambakkam, Chennai','AB-','Meena Babu: +91-9001000118','Bajaj Allianz #I900','{"chronicConditions":"None","allergies":"Latex","surgeries":"Wisdom teeth (2010)","familyHistory":"None"}'),
('10000000-0000-0000-0000-000000000001','SCH-1011','Vani','Iyer','1978-02-14','Female','+91-9001000119','vani.i@example.com','42 Kodambakkam, Chennai','B+','Iyer S: +91-9001000120','SBI Health #J1000','{"chronicConditions":"Rheumatoid Arthritis","allergies":"NSAIDs","surgeries":"Hip replacement (2019)","familyHistory":"Arthritis (Father)"}')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- =====================================================
-- NHC PATIENTS (10)
-- =====================================================
INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group)
VALUES
('10000000-0000-0000-0000-000000000002','NHC-1002','Bala','Murugan','1991-02-10','Male','+91-9002000101','bala.m@example.com','15 Saibaba Colony, Coimbatore','O+'),
('10000000-0000-0000-0000-000000000002','NHC-1003','Chitra','Devi','1986-09-05','Female','+91-9002000102','chitra.d@example.com','28 RS Puram, Coimbatore','A+'),
('10000000-0000-0000-0000-000000000002','NHC-1004','Dinesh','Raja','1979-04-18','Male','+91-9002000103','dinesh.r@example.com','33 Gandhipuram, Coimbatore','B-'),
('10000000-0000-0000-0000-000000000002','NHC-1005','Eswari','Kannan','1994-12-01','Female','+91-9002000104','eswari.k@example.com','50 Race Course, Coimbatore','AB+'),
('10000000-0000-0000-0000-000000000002','NHC-1006','Ganesh','Prabhu','1972-07-22','Male','+91-9002000105','ganesh.p@example.com','71 Peelamedu, Coimbatore','A-'),
('10000000-0000-0000-0000-000000000002','NHC-1007','Hema','Latha','1988-03-14','Female','+91-9002000106','hema.l@example.com','19 Singanallur, Coimbatore','O-'),
('10000000-0000-0000-0000-000000000002','NHC-1008','Iqbal','Ahmed','1965-11-28','Male','+91-9002000107','iqbal.a@example.com','44 Ukkadam, Coimbatore','B+'),
('10000000-0000-0000-0000-000000000002','NHC-1009','Janani','Sree','1996-06-09','Female','+91-9002000108','janani.s@example.com','62 Vadavalli, Coimbatore','A+'),
('10000000-0000-0000-0000-000000000002','NHC-1010','Kumar','Vel','1983-01-17','Male','+91-9002000109','kumar.v@example.com','85 Thudiyalur, Coimbatore','O+'),
('10000000-0000-0000-0000-000000000002','NHC-1011','Lalitha','Mohan','1976-08-25','Female','+91-9002000110','lalitha.m@example.com','37 Saravanampatti, Coimbatore','AB-')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- =====================================================
-- RCC PATIENTS (10)
-- =====================================================
INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group)
VALUES
('10000000-0000-0000-0000-000000000003','RCC-1002','Mani','Kandan','1989-05-03','Male','+91-9003000101','mani.k@example.com','12 MG Road, Madurai','B+'),
('10000000-0000-0000-0000-000000000003','RCC-1003','Nandini','Raj','1992-10-15','Female','+91-9003000102','nandini.r@example.com','34 KK Nagar, Madurai','A+'),
('10000000-0000-0000-0000-000000000003','RCC-1004','Omkhar','Prasad','1974-03-27','Male','+91-9003000103','omkhar.p@example.com','56 Tallakulam, Madurai','O-'),
('10000000-0000-0000-0000-000000000003','RCC-1005','Padma','Priya','1997-08-11','Female','+91-9003000104','padma.p@example.com','78 Anna Nagar, Madurai','AB+'),
('10000000-0000-0000-0000-000000000003','RCC-1006','Raj','Mohan','1967-01-19','Male','+91-9003000105','raj.m@example.com','90 Villapuram, Madurai','A-'),
('10000000-0000-0000-0000-000000000003','RCC-1007','Saranya','Devi','1985-06-30','Female','+91-9003000106','saranya.d@example.com','23 Teppakulam, Madurai','B-'),
('10000000-0000-0000-0000-000000000003','RCC-1008','Tamil','Selvan','1978-11-08','Male','+91-9003000107','tamil.s@example.com','45 Thirunagar, Madurai','O+'),
('10000000-0000-0000-0000-000000000003','RCC-1009','Uma','Maheshwari','1993-04-22','Female','+91-9003000108','uma.m@example.com','67 Pasumalai, Madurai','A+'),
('10000000-0000-0000-0000-000000000003','RCC-1010','Vinoth','Kumar','1981-09-14','Male','+91-9003000109','vinoth.k@example.com','11 Goripalayam, Madurai','B+'),
('10000000-0000-0000-0000-000000000003','RCC-1011','Yamini','Devi','1990-12-06','Female','+91-9003000110','yamini.d@example.com','33 Sellur, Madurai','AB-')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- =====================================================
-- OH PATIENTS (10)
-- =====================================================
INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group)
VALUES
('10000000-0000-0000-0000-000000000004','OH-1002','Ajay','Reddy','1987-03-15','Male','+91-9004000101','ajay.r@example.com','12 Banjara Hills, Hyderabad','O+'),
('10000000-0000-0000-0000-000000000004','OH-1003','Bhavani','Srinivas','1994-07-28','Female','+91-9004000102','bhavani.s@example.com','34 Jubilee Hills, Hyderabad','A+'),
('10000000-0000-0000-0000-000000000004','OH-1004','Chandra','Sekhar','1971-11-10','Male','+91-9004000103','chandra.s@example.com','56 Secunderabad, Hyderabad','B-'),
('10000000-0000-0000-0000-000000000004','OH-1005','Divya','Priya','1996-02-22','Female','+91-9004000104','divya.p@example.com','78 Madhapur, Hyderabad','AB+'),
('10000000-0000-0000-0000-000000000004','OH-1006','Eswar','Rao','1969-06-05','Male','+91-9004000105','eswar.r@example.com','90 Kukatpally, Hyderabad','A-'),
('10000000-0000-0000-0000-000000000004','OH-1007','Fathima','Bee','1984-09-18','Female','+91-9004000106','fathima.b@example.com','23 Ameerpet, Hyderabad','O-'),
('10000000-0000-0000-0000-000000000004','OH-1008','Gopal','Krishna','1977-01-30','Male','+91-9004000107','gopal.k@example.com','45 Dilsukhnagar, Hyderabad','B+'),
('10000000-0000-0000-0000-000000000004','OH-1009','Harini','Devi','1992-05-12','Female','+91-9004000108','harini.d@example.com','67 Miyapur, Hyderabad','A+'),
('10000000-0000-0000-0000-000000000004','OH-1010','Irfan','Khan','1980-08-24','Male','+91-9004000109','irfan.k@example.com','11 Begumpet, Hyderabad','O+'),
('10000000-0000-0000-0000-000000000004','OH-1011','Jyothi','Lakshmi','1973-12-06','Female','+91-9004000110','jyothi.l@example.com','33 Kompally, Hyderabad','AB-')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- =====================================================
-- APPOINTMENTS for all tenants (using subqueries for IDs)
-- =====================================================

-- SCH Appointments
INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, reason, source, status)
SELECT '10000000-0000-0000-0000-000000000001', p.id,
  (SELECT id FROM emr.users WHERE email='rajesh@sch.local' LIMIT 1),
  s.start_time::timestamp, s.end_time::timestamp, s.reason, 'staff', s.status
FROM emr.patients p
CROSS JOIN (VALUES
  ('2026-02-15 09:00','2026-02-15 09:30','Routine checkup','completed'),
  ('2026-02-16 10:00','2026-02-16 10:30','Follow-up visit','scheduled'),
  ('2026-02-14 11:00','2026-02-14 11:30','Lab results review','completed')
) AS s(start_time, end_time, reason, status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000001' AND p.mrn LIKE 'SCH-1%'
AND p.mrn != 'SCH-1001'
LIMIT 20;

-- NHC Appointments
INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, reason, source, status)
SELECT '10000000-0000-0000-0000-000000000002', p.id,
  (SELECT id FROM emr.users WHERE email='doctor@nhc.local' LIMIT 1),
  s.start_time::timestamp, s.end_time::timestamp, s.reason, 'staff', s.status
FROM emr.patients p
CROSS JOIN (VALUES
  ('2026-02-15 09:30','2026-02-15 10:00','General consultation','completed'),
  ('2026-02-17 14:00','2026-02-17 14:30','Vaccination','scheduled')
) AS s(start_time, end_time, reason, status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000002'
LIMIT 20;

-- RCC Appointments
INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, reason, source, status)
SELECT '10000000-0000-0000-0000-000000000003', p.id,
  (SELECT id FROM emr.users WHERE email='admin@rcc.local' LIMIT 1),
  s.start_time::timestamp, s.end_time::timestamp, s.reason, 'staff', s.status
FROM emr.patients p
CROSS JOIN (VALUES
  ('2026-02-15 10:00','2026-02-15 10:30','Wellness check','completed'),
  ('2026-02-18 11:00','2026-02-18 11:30','Blood pressure monitoring','scheduled')
) AS s(start_time, end_time, reason, status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000003'
LIMIT 20;

-- OH Appointments
INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, reason, source, status)
SELECT '10000000-0000-0000-0000-000000000004', p.id,
  (SELECT id FROM emr.users WHERE email='doctor@omega.local' LIMIT 1),
  s.start_time::timestamp, s.end_time::timestamp, s.reason, 'staff', s.status
FROM emr.patients p
CROSS JOIN (VALUES
  ('2026-02-15 08:30','2026-02-15 09:00','Pre-surgery consultation','completed'),
  ('2026-02-16 15:00','2026-02-16 15:30','Post-op follow-up','scheduled'),
  ('2026-02-14 13:00','2026-02-14 13:30','Cardiac evaluation','completed')
) AS s(start_time, end_time, reason, status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000004'
LIMIT 20;

-- =====================================================
-- ENCOUNTERS for all tenants
-- =====================================================

-- SCH Encounters
INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, diagnosis, notes, status)
SELECT '10000000-0000-0000-0000-000000000001', p.id,
  (SELECT id FROM emr.users WHERE email='rajesh@sch.local' LIMIT 1),
  e.etype, e.complaint, e.diagnosis, e.notes, 'open'
FROM emr.patients p
CROSS JOIN (VALUES
  ('OPD','Fever and body ache for 3 days','Viral fever','Prescribed antipyretics. Rest for 5 days. Follow-up in a week.'),
  ('OPD','Post-treatment review','Recovering from viral fever','Patient improving. Continue medication for 3 more days.')
) AS e(etype, complaint, diagnosis, notes)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000001' AND p.mrn LIKE 'SCH-1%'
AND p.mrn != 'SCH-1001'
LIMIT 15;

-- NHC Encounters
INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, diagnosis, notes, status)
SELECT '10000000-0000-0000-0000-000000000002', p.id,
  (SELECT id FROM emr.users WHERE email='doctor@nhc.local' LIMIT 1),
  'OPD', e.complaint, e.diagnosis, e.notes, 'open'
FROM emr.patients p
CROSS JOIN (VALUES
  ('Chronic cough for 2 weeks','Upper respiratory infection','Antibiotics prescribed. Chest X-ray ordered.'),
  ('Knee pain and swelling','Osteoarthritis','Anti-inflammatory medication. Physiotherapy recommended.')
) AS e(complaint, diagnosis, notes)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000002'
LIMIT 15;

-- RCC Encounters
INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, diagnosis, notes, status)
SELECT '10000000-0000-0000-0000-000000000003', p.id,
  (SELECT id FROM emr.users WHERE email='admin@rcc.local' LIMIT 1),
  'OPD', e.complaint, e.diagnosis, e.notes, 'open'
FROM emr.patients p
CROSS JOIN (VALUES
  ('Skin rash and itching','Contact dermatitis','Topical corticosteroid cream. Avoid allergens.'),
  ('Recurring headaches','Tension headache','Pain management. Stress reduction techniques advised.')
) AS e(complaint, diagnosis, notes)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000003'
LIMIT 15;

-- OH Encounters
INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, diagnosis, notes, status)
SELECT '10000000-0000-0000-0000-000000000004', p.id,
  (SELECT id FROM emr.users WHERE email='doctor@omega.local' LIMIT 1),
  e.etype, e.complaint, e.diagnosis, e.notes, 'open'
FROM emr.patients p
CROSS JOIN (VALUES
  ('emergency','Chest pain and shortness of breath','Acute angina','ECG normal. Troponin negative. Stress test scheduled.'),
  ('OPD','Persistent back pain','Lumbar disc herniation','MRI ordered. Pain management initiated. Ortho referral.')
) AS e(etype, complaint, diagnosis, notes)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000004'
LIMIT 15;

-- =====================================================
-- INVOICES for all tenants
-- =====================================================

-- SCH Invoices
INSERT INTO emr.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status)
SELECT '10000000-0000-0000-0000-000000000001', p.id,
  'SCH-INV-' || ROW_NUMBER() OVER (), i.description, i.subtotal, i.tax, i.total, i.paid_amt, i.inv_status
FROM emr.patients p
CROSS JOIN (VALUES
  ('General consultation fee',500,90,590,590,'paid'),
  ('Lab tests - CBC + Thyroid',1200,216,1416,0,'issued')
) AS i(description, subtotal, tax, total, paid_amt, inv_status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000001' AND p.mrn LIKE 'SCH-1%'
AND p.mrn != 'SCH-1001'
LIMIT 15;

-- NHC Invoices
INSERT INTO emr.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status)
SELECT '10000000-0000-0000-0000-000000000002', p.id,
  'NHC-INV-' || ROW_NUMBER() OVER (), i.description, i.subtotal, i.tax, i.total, i.paid_amt, i.inv_status
FROM emr.patients p
CROSS JOIN (VALUES
  ('Consultation + Prescription',400,72,472,472,'paid'),
  ('X-Ray + Blood work',1800,324,2124,0,'issued')
) AS i(description, subtotal, tax, total, paid_amt, inv_status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000002'
LIMIT 15;

-- RCC Invoices
INSERT INTO emr.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status)
SELECT '10000000-0000-0000-0000-000000000003', p.id,
  'RCC-INV-' || ROW_NUMBER() OVER (), i.description, i.subtotal, i.tax, i.total, i.paid_amt, i.inv_status
FROM emr.patients p
CROSS JOIN (VALUES
  ('OPD consultation',300,54,354,354,'paid'),
  ('Dermatology treatment',800,144,944,0,'issued')
) AS i(description, subtotal, tax, total, paid_amt, inv_status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000003'
LIMIT 15;

-- OH Invoices
INSERT INTO emr.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status)
SELECT '10000000-0000-0000-0000-000000000004', p.id,
  'OH-INV-' || ROW_NUMBER() OVER (), i.description, i.subtotal, i.tax, i.total, i.paid_amt, i.inv_status
FROM emr.patients p
CROSS JOIN (VALUES
  ('Emergency consultation + ECG',2500,450,2950,2950,'paid'),
  ('MRI Scan - Lumbar',8000,1440,9440,0,'issued'),
  ('Cardiac evaluation package',5000,900,5900,5900,'paid')
) AS i(description, subtotal, tax, total, paid_amt, inv_status)
WHERE p.tenant_id = '10000000-0000-0000-0000-000000000004'
LIMIT 20;

-- =====================================================
-- WALK-INS (a few per tenant)
-- =====================================================
INSERT INTO emr.walkins (tenant_id, name, phone, reason, status) VALUES
('10000000-0000-0000-0000-000000000001','Ravi Shankar','+91-9111000001','Severe headache','waiting'),
('10000000-0000-0000-0000-000000000001','Anitha Bai','+91-9111000002','Stomach pain','waiting'),
('10000000-0000-0000-0000-000000000002','Sathish Kumar','+91-9222000001','Fever and cold','waiting'),
('10000000-0000-0000-0000-000000000002','Geetha Rani','+91-9222000002','Eye irritation','waiting'),
('10000000-0000-0000-0000-000000000003','Babu Raj','+91-9333000001','Sprained ankle','waiting'),
('10000000-0000-0000-0000-000000000003','Kavitha S','+91-9333000002','Chest congestion','waiting'),
('10000000-0000-0000-0000-000000000004','Naresh Reddy','+91-9444000001','Dog bite wound','waiting'),
('10000000-0000-0000-0000-000000000004','Swathi Devi','+91-9444000002','Severe allergic reaction','waiting');

-- =====================================================
-- EMPLOYEES for NHC, RCC, OH (SCH already has some)
-- =====================================================
INSERT INTO emr.employees (tenant_id, code, name, department, designation, join_date, shift, salary, leave_balance) VALUES
('10000000-0000-0000-0000-000000000002','NHC-EMP-001','Ravi Kumar','Nursing','Head Nurse','2019-03-01','Morning',38000,12),
('10000000-0000-0000-0000-000000000002','NHC-EMP-002','Saroja Devi','Administration','Receptionist','2020-07-15','Morning',28000,10),
('10000000-0000-0000-0000-000000000002','NHC-EMP-003','Manoj Raj','Lab','Lab Technician','2021-01-10','Rotating',32000,8),
('10000000-0000-0000-0000-000000000003','RCC-EMP-001','Anand Kumar','Nursing','Staff Nurse','2020-05-01','Morning',30000,10),
('10000000-0000-0000-0000-000000000003','RCC-EMP-002','Preethi S','Administration','Office Clerk','2021-09-15','Morning',24000,8),
('10000000-0000-0000-0000-000000000004','OH-EMP-001','Venkat Rao','Surgery','OT Technician','2018-06-01','Rotating',42000,15),
('10000000-0000-0000-0000-000000000004','OH-EMP-002','Sunitha Devi','Nursing','ICU Nurse','2019-11-20','Night',40000,12),
('10000000-0000-0000-0000-000000000004','OH-EMP-003','Raju Naik','Housekeeping','Attendant','2022-03-01','Morning',20000,8),
('10000000-0000-0000-0000-000000000004','OH-EMP-004','Fatima Khan','Pharmacy','Pharmacist','2020-08-15','Morning',35000,10)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- =====================================================
-- INVENTORY for NHC and OH (SCH already has some, RCC has inventory disabled)
-- =====================================================
INSERT INTO emr.inventory_items (tenant_id, item_code, name, category, current_stock, reorder_level, unit) VALUES
('10000000-0000-0000-0000-000000000002','NHC-MED-001','Cetirizine 10mg','Medicines',200,50,'tablets'),
('10000000-0000-0000-0000-000000000002','NHC-MED-002','Metformin 500mg','Medicines',350,80,'tablets'),
('10000000-0000-0000-0000-000000000002','NHC-SUP-001','Cotton Rolls','Supplies',100,30,'pieces'),
('10000000-0000-0000-0000-000000000004','OH-MED-001','Atorvastatin 20mg','Medicines',400,100,'tablets'),
('10000000-0000-0000-0000-000000000004','OH-MED-002','Clopidogrel 75mg','Medicines',250,60,'tablets'),
('10000000-0000-0000-0000-000000000004','OH-SUP-001','IV Cannula 20G','Supplies',500,150,'pieces'),
('10000000-0000-0000-0000-000000000004','OH-SUP-002','Surgical Masks','Supplies',2000,500,'pieces'),
('10000000-0000-0000-0000-000000000004','OH-EQP-001','Pulse Oximeter','Equipment',15,5,'pieces')
ON CONFLICT (tenant_id, item_code) DO NOTHING;

COMMIT;

-- Verification
SELECT 'Patients per tenant' AS check_type, t.code, COUNT(p.id) AS count
FROM emr.tenants t LEFT JOIN emr.patients p ON p.tenant_id = t.id
GROUP BY t.code ORDER BY t.code;

SELECT 'Appointments per tenant' AS check_type, t.code, COUNT(a.id) AS count
FROM emr.tenants t LEFT JOIN emr.appointments a ON a.tenant_id = t.id
GROUP BY t.code ORDER BY t.code;

SELECT 'Encounters per tenant' AS check_type, t.code, COUNT(e.id) AS count
FROM emr.tenants t LEFT JOIN emr.encounters e ON e.tenant_id = t.id
GROUP BY t.code ORDER BY t.code;

SELECT 'Invoices per tenant' AS check_type, t.code, COUNT(i.id) AS count
FROM emr.tenants t LEFT JOIN emr.invoices i ON i.tenant_id = t.id
GROUP BY t.code ORDER BY t.code;
