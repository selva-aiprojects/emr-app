-- New Age Hospital (NAH) Inventory and Bed Data (Schema-Compatible)
-- Targets inventory_items, inventory_transactions, wards, beds

BEGIN;

-- =====================================================
-- NAH INVENTORY ITEMS (Curated set for E2E)
-- =====================================================
INSERT INTO emr.inventory_items (
  tenant_id,
  item_code,
  name,
  category,
  current_stock,
  reorder_level,
  unit
)
VALUES
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','MED001','Epinephrine Auto-Injector','Emergency Medications',45,20,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','MED002','Nitroglycerin Tablets','Emergency Medications',120,50,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','MED003','Albuterol Inhaler','Emergency Medications',85,30,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','PAIN001','Morphine Sulfate','Pain Management',65,20,'vial'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','PAIN002','Fentanyl Citrate','Pain Management',35,15,'vial'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','ANT001','Amoxicillin 500mg','Antibiotics',450,150,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','ANT002','Ciprofloxacin 500mg','Antibiotics',280,80,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','CARD001','Lisinopril 10mg','Cardiovascular',380,120,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','CARD002','Metoprolol 50mg','Cardiovascular',420,150,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','DIAB001','Metformin 500mg','Diabetes',680,200,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','DIAB002','Insulin Glargine','Diabetes',120,40,'vial'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','PSYCH001','Sertraline 50mg','Psychiatric',420,150,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','PED001','Acetaminophen Children','Pediatric',280,100,'bottle'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','SURG001','Surgical Gloves Size 7','Surgical Supplies',850,200,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','SURG002','Surgical Masks','Surgical Supplies',2500,500,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','LAB001','Blood Collection Tubes','Laboratory',1800,500,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','RAD001','X-Ray Film','Radiology',450,100,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','EQUIP001','Blood Pressure Cuffs','Equipment',65,20,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','EQUIP002','Stethoscopes','Equipment',35,15,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','WOUND001','Sterile Dressings','Wound Care',850,200,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','IV001','IV Catheters 18G','IV Supplies',1200,300,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','RESP001','Oxygen Masks','Respiratory',450,100,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','NUTR001','Enteral Formula','Nutrition',450,150,'box'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','BED001','Bed Sheets','Bed Supplies',1200,300,'pack'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','CLEAN001','Disinfectant Spray','Cleaning',850,200,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','OFF001','Medical Chart Forms','Office Supplies',2800,500,'pack'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','ERKIT001','Emergency Kit Bag','Emergency Kits',25,10,'unit'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','SPEC001','Crutches Adjustable','Specialty',45,15,'unit')
ON CONFLICT (tenant_id, item_code) DO NOTHING;

-- =====================================================
-- INVENTORY TRANSACTIONS (Receipts + Issues)
-- =====================================================
INSERT INTO emr.inventory_transactions (
  tenant_id,
  item_id,
  transaction_type,
  quantity,
  reference,
  created_by
)
SELECT
  i.tenant_id,
  i.id,
  CASE WHEN i.current_stock < i.reorder_level THEN 'receipt' ELSE 'issue' END,
  CASE WHEN i.current_stock < i.reorder_level THEN 100 ELSE 25 END,
  'Seed transaction',
  NULL
FROM emr.inventory_items i
WHERE i.tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
LIMIT 20
ON CONFLICT DO NOTHING;

-- =====================================================
-- WARDS + BEDS (Basic occupancy model)
-- =====================================================
INSERT INTO emr.wards (tenant_id, name, type, base_rate, status)
VALUES
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','General Ward','General',1500,'Active'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','ICU','ICU',5000,'Active'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Maternity Ward','Private',3500,'Active'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Pediatric Ward','General',1800,'Active'),
('f998a8f5-95b9-4fd7-a583-63cf574d65ed','Emergency Ward','Emergency',2500,'Active')
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Create 10 beds per ward with mixed status
INSERT INTO emr.beds (tenant_id, ward_id, bed_number, status)
SELECT
  w.tenant_id,
  w.id,
  'BED-' || s.i,
  CASE
    WHEN w.name = 'ICU' AND s.i <= 6 THEN 'Occupied'
    WHEN w.name = 'Emergency Ward' AND s.i <= 4 THEN 'Occupied'
    WHEN s.i % 7 = 0 THEN 'Maintenance'
    WHEN s.i % 3 = 0 THEN 'Occupied'
    ELSE 'Available'
  END
FROM emr.wards w
CROSS JOIN generate_series(1, 10) s(i)
WHERE w.tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
ON CONFLICT (tenant_id, ward_id, bed_number) DO NOTHING;

COMMIT;
