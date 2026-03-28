-- New Age Hospital (NAH) Appointments and Encounters Data (Schema-Compatible)
-- Uses enhanced schema columns: scheduled_start/end, visit_date, notes

BEGIN;

-- =====================================================
-- NAH APPOINTMENTS (Realistic volume across dates)
-- =====================================================
WITH patient_list AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM emr.patients
  WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
),
seed_today AS (
  SELECT
    'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid AS tenant_id,
    p.id AS patient_id,
    '20000000-0000-0000-0000-000000000102'::uuid AS provider_id,
    (CURRENT_DATE + (8 + (p.rn % 10)) * INTERVAL '1 hour') AS scheduled_start,
    (CURRENT_DATE + (8 + (p.rn % 10)) * INTERVAL '1 hour' + INTERVAL '30 minutes') AS scheduled_end,
    CASE
      WHEN p.rn % 9 = 0 THEN 'completed'
      WHEN p.rn % 11 = 0 THEN 'cancelled'
      ELSE 'scheduled'
    END AS status,
    'Routine consultation' AS reason,
    'staff' AS source
  FROM patient_list p
  WHERE p.rn <= 35
),
seed_yesterday AS (
  SELECT
    'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid AS tenant_id,
    p.id AS patient_id,
    '20000000-0000-0000-0000-000000000102'::uuid AS provider_id,
    (CURRENT_DATE - INTERVAL '1 day' + (9 + (p.rn % 8)) * INTERVAL '1 hour') AS scheduled_start,
    (CURRENT_DATE - INTERVAL '1 day' + (9 + (p.rn % 8)) * INTERVAL '1 hour' + INTERVAL '30 minutes') AS scheduled_end,
    CASE
      WHEN p.rn % 7 = 0 THEN 'cancelled'
      ELSE 'completed'
    END AS status,
    'Follow-up visit' AS reason,
    'staff' AS source
  FROM patient_list p
  WHERE p.rn > 35 AND p.rn <= 70
),
seed_last_week AS (
  SELECT
    'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid AS tenant_id,
    p.id AS patient_id,
    '20000000-0000-0000-0000-000000000102'::uuid AS provider_id,
    (CURRENT_DATE - INTERVAL '7 days' + (10 + (p.rn % 6)) * INTERVAL '1 hour') AS scheduled_start,
    (CURRENT_DATE - INTERVAL '7 days' + (10 + (p.rn % 6)) * INTERVAL '1 hour' + INTERVAL '30 minutes') AS scheduled_end,
    CASE
      WHEN p.rn % 10 = 0 THEN 'no_show'
      WHEN p.rn % 6 = 0 THEN 'cancelled'
      ELSE 'completed'
    END AS status,
    'Department consult' AS reason,
    'staff' AS source
  FROM patient_list p
  WHERE p.rn > 70 AND p.rn <= 110
),
seed_future AS (
  SELECT
    'f998a8f5-95b9-4fd7-a583-63cf574d65ed'::uuid AS tenant_id,
    p.id AS patient_id,
    '20000000-0000-0000-0000-000000000102'::uuid AS provider_id,
    (CURRENT_DATE + (1 + (p.rn % 10)) * INTERVAL '1 day' + (9 + (p.rn % 6)) * INTERVAL '1 hour') AS scheduled_start,
    (CURRENT_DATE + (1 + (p.rn % 10)) * INTERVAL '1 day' + (9 + (p.rn % 6)) * INTERVAL '1 hour' + INTERVAL '30 minutes') AS scheduled_end,
    'scheduled' AS status,
    'Upcoming review' AS reason,
    'staff' AS source
  FROM patient_list p
  WHERE p.rn > 110 AND p.rn <= 140
)
INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, source)
SELECT * FROM seed_today
UNION ALL
SELECT * FROM seed_yesterday
UNION ALL
SELECT * FROM seed_last_week
UNION ALL
SELECT * FROM seed_future
ON CONFLICT DO NOTHING;

-- =====================================================
-- NAH ENCOUNTERS (Generate from completed appointments)
-- =====================================================
INSERT INTO emr.encounters (
  tenant_id,
  patient_id,
  provider_id,
  encounter_type,
  visit_date,
  chief_complaint,
  diagnosis,
  notes,
  status
)
SELECT
  a.tenant_id,
  a.patient_id,
  a.provider_id,
  CASE
    WHEN a.reason ILIKE '%emergency%' THEN 'Emergency'
    ELSE 'Out-patient'
  END AS encounter_type,
  a.scheduled_start::date AS visit_date,
  a.reason AS chief_complaint,
  CASE
    WHEN a.reason ILIKE '%diabetes%' THEN 'Diabetes'
    WHEN a.reason ILIKE '%cardio%' THEN 'Cardiac Review'
    ELSE 'General'
  END AS diagnosis,
  'Continue medications and follow-up as advised.' AS notes,
  'closed' AS status
FROM emr.appointments a
WHERE a.tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
AND a.status = 'completed'
LIMIT 80
ON CONFLICT DO NOTHING;

COMMIT;
