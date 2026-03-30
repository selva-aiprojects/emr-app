# 🌱 EMR Data Seeding Scripts

This directory contains comprehensive data seeding scripts for all EMR modules to populate the database with realistic data for dashboard validation and testing.

## 📋 Available Scripts

### 🚀 Master Scripts

#### `seed_all_modules.mjs`
- **Purpose**: Runs all module seeding scripts in sequence
- **Usage**: `node seed_all_modules.mjs`
- **Description**: Seeds data for Lab, Blood Bank, Prescription, and Pharmacy modules

#### `validate_seeded_data.mjs`
- **Purpose**: Validates seeded data and generates dashboard metrics
- **Usage**: `node validate_seeded_data.mjs`
- **Description**: Validates all modules and provides comprehensive reporting

### 📁 Module-Specific Scripts

#### 🔬 Lab Module
- **Script**: `seed_lab_comprehensive.mjs`
- **Data Generated**:
  - 150+ lab orders across all categories
  - Realistic test results with normal ranges
  - Critical results for dashboard validation
  - Multiple test categories (Hematology, Biochemistry, Microbiology, etc.)
  - Lab statistics and metrics

#### 🩸 Blood Bank Module
- **Script**: `seed_blood_bank_comprehensive.mjs`
- **Data Generated**:
  - 200+ blood units across all blood types
  - 80+ blood requests with various urgency levels
  - 10+ donor profiles with donation history
  - Complete inventory and request management

#### 💊 Prescription Module
- **Script**: `seed_prescription_comprehensive.mjs`
- **Data Generated**:
  - 200+ enhanced digital prescriptions
  - 32+ drugs in master database
  - Complete drug categorization and tracking
  - Prescription lifecycle management

#### 🏪 Pharmacy Module
- **Script**: `seed_pharmacy_comprehensive.mjs`
- **Data Generated**:
  - 24+ enhanced inventory items
  - 10+ dispensing logs with detailed items
  - 100+ stock movement transactions
  - Complete pharmacy management data

## 🚀 Quick Start

### Option 1: Seed All Modules (Recommended)
```bash
# Run all module seeding scripts
node seed_all_modules.mjs

# Validate the seeded data
node validate_seeded_data.mjs
```

### Option 2: Seed Individual Modules
```bash
# Seed specific module
node seed_lab_comprehensive.mjs
node seed_blood_bank_comprehensive.mjs
node seed_prescription_comprehensive.mjs
node seed_pharmacy_comprehensive.mjs

# Validate after seeding
node validate_seeded_data.mjs
```

## 📊 Data Summary

### 🔬 Lab Module
- **Total Orders**: 150+
- **Categories**: Hematology, Biochemistry, Microbiology, Serology, Hormones, Cardiac, Immunology, Special Tests
- **Test Results**: Realistic values with normal ranges
- **Critical Results**: 10% of results marked as critical
- **Status Distribution**: Active, Completed, Cancelled

### 🩸 Blood Bank Module
- **Blood Units**: 200+ across all blood types
- **Blood Types**: A+, A-, B+, B-, AB+, AB-, O+, O-
- **Components**: Whole Blood, RBC, Plasma, Platelets, Cryoprecipitate
- **Requests**: 80+ with various urgency levels
- **Donors**: 10+ with complete profiles

### 💊 Prescription Module
- **Prescriptions**: 200+ digital prescriptions
- **Drug Master**: 32+ medications
- **Categories**: Analgesics, Antibiotics, Cardiovascular, Antidiabetics, etc.
- **Schedule Classification**: OTC, H, H1, H2
- **Digital Signatures**: 70% of prescriptions

### 🏪 Pharmacy Module
- **Inventory Items**: 24+ enhanced items
- **Dispensing Logs**: 10+ with detailed breakdown
- **Stock Movements**: 100+ transactions
- **Payment Modes**: Cash, Card, UPI, Insurance
- **Controlled Drugs**: Proper tracking and alerts

## 📈 Dashboard Metrics Generated

### 🔬 Lab Dashboard
- Today's lab orders
- Pending and completed orders
- Critical results alert
- Category-wise statistics
- Turnaround time metrics

### 🩸 Blood Bank Dashboard
- Available blood units by type
- Critical stock alerts
- Pending requests
- Donor statistics
- Expiry tracking

### 💊 Prescription Dashboard
- Active prescriptions count
- Completed and expired prescriptions
- Drug category statistics
- Digital signature compliance
- Prescription trends

### 🏪 Pharmacy Dashboard
- Total inventory items
- Critical and low stock alerts
- Expiring drugs monitoring
- Today's revenue
- Monthly financial metrics

## 🔧 Configuration

### Database Connection
All scripts use the tenant ID: `f998a8f5-95b9-4fd7-a583-63cf574d65ed` (New Age Hospital)

### Data Quality
- **Realistic Values**: All data follows medical standards
- **Proper Distributions**: Blood types, ages, categories follow real-world patterns
- **Status Transitions**: Proper workflow states and transitions
- **Audit Trails**: Complete tracking for all operations

## 🔍 Validation

The validation script checks:
- ✅ Data completeness for each module
- ✅ Proper status distributions
- ✅ Critical alerts and monitoring
- ✅ Dashboard metrics accuracy
- ✅ Data quality and consistency

## 🎯 Use Cases

### Development & Testing
- Populate development environment with realistic data
- Test dashboard components with proper metrics
- Validate module functionality
- Performance testing with substantial data

### Demo & Presentation
- Show comprehensive EMR functionality
- Demonstrate dashboard capabilities
- Present healthcare standards compliance
- Display operational metrics

### Quality Assurance
- Validate data integrity
- Test module integrations
- Verify compliance features
- Check audit trail functionality

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database connection
node -e "import { query } from './server/db/connection.js'; query('SELECT 1').then(() => console.log('✅ DB Connected')).catch(e => console.error('❌ DB Error:', e))"
```

#### Module-Specific Errors
- **Lab**: Check if `service_requests` table exists
- **Blood Bank**: Verify `blood_units` and `blood_requests` tables
- **Prescription**: Ensure `prescriptions_enhanced` table exists
- **Pharmacy**: Check `pharmacy_inventory_enhanced` table

#### Data Validation Errors
- Run validation script to identify issues
- Check for constraint violations
- Verify foreign key relationships
- Ensure proper data types

### Reset Data
```bash
# Clear specific module data (use with caution)
# Note: This will delete all seeded data
```

## 📝 Notes

- **Tenant ID**: All scripts use hardcoded tenant ID for consistency
- **Data Relationships**: Foreign keys and relationships are properly maintained
- **Timestamps**: All data includes realistic timestamps
- **Status Distributions**: Proper mix of active, completed, pending states
- **Medical Accuracy**: All medical data follows healthcare standards

## 🚀 Next Steps

1. **Run Master Script**: Execute `node seed_all_modules.mjs`
2. **Validate Data**: Run `node validate_seeded_data.mjs`
3. **Check Dashboard**: Verify dashboard displays correct metrics
4. **Test Functionality**: Validate all module features work correctly
5. **Performance Test**: Test with realistic data volumes

## 📞 Support

For issues with seeding scripts:
1. Check database connection
2. Verify table schemas exist
3. Run validation script for diagnostics
4. Check logs for specific error messages

---

**🎉 Ready for comprehensive dashboard validation and testing!**
