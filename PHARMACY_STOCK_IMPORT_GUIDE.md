# 🏪 Pharmacy Stock Import Feature Guide

## 📋 Overview

The EMR application includes a comprehensive **Pharmacy Stock Import** feature that allows bulk import of inventory data through CSV files. This feature is designed for efficient stock replenishment and initial setup.

---

## 🚀 **Available Import Features**

### **1. CSV Stock Import**
- **Endpoint**: `POST /api/pharmacy/v1/stock/import`
- **Frontend Component**: `PharmacyProcurement.jsx`
- **Purpose**: Bulk import of pharmacy inventory from CSV files
- **Access**: Users with roles (Nurse, Lab, Pharmacy)

### **2. Enhanced Bulk Import** (New Enhancement)
- **Endpoint**: `POST /api/pharmacy/inventory/bulk-import`
- **API Function**: `bulkImportPharmacyInventory()`
- **Purpose**: Advanced bulk import with enhanced validation
- **Features**: Drug master creation, batch tracking, expiry management

---

## 📁 **Implementation Details**

### **Backend Implementation**

#### **Route Definition**
```javascript
// pharmacy-service/src/routes/pharmacy.routes.js
router.post('/stock/import', requireRole('Nurse', 'Lab', 'Pharmacy'), importStock);
```

#### **Controller Function**
```javascript
// pharmacy-service/src/controllers/pharmacy.controller.js
export const importStock = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { items } = req.body;
    const result = await inventoryService.importStockFromCSV(tenantId, req.user?.id, items);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### **Service Implementation**
```javascript
// pharmacy-service/src/services/pharmacy.service.js
async importStockFromCSV(tenantId, userId, stockItems) {
  // 1. Find or create drug in master
  // 2. Add batch with expiry tracking
  // 3. Update inventory levels
  // 4. Generate audit trail
  // 5. Return import results
}
```

### **Frontend Implementation**

#### **React Component**
```javascript
// client/src/components/pharmacy/PharmacyProcurement.jsx
const handleCSVImport = async (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    const text = event.target.result;
    const items = parseCSVToJSON(text);
    
    try {
      const res = await api.importPharmacyStock(tenant.id, items);
      setImportResults(res.data);
      loadPurchaseOrders(); // refresh data
    } catch (err) {
      alert('Import Error: ' + err.message);
    }
  };
  
  reader.readAsText(file);
};
```

#### **API Client Function**
```javascript
// client/src/api.js
export async function importPharmacyStock(tenantId, items) {
  return await apiRequest('/pharmacy/v1/stock/import', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify({ items }),
  });
}
```

---

## 📊 **CSV Format Requirements**

### **Standard CSV Format**
```csv
genericName,batchNumber,expiryDate,quantity,manufacturer,supplierName
Paracetamol,BT2024001,2025-12-31,500,GSK,Medical Suppliers Ltd
Ibuprofen,BT2024002,2025-08-15,300,Abbott,Pharma Corp
```

### **Enhanced CSV Format** (Recommended)
```csv
genericName,brandName,batchNumber,expiryDate,quantity,manufacturer,supplierName,purchaseRate,saleRate,mrp,storageLocation
Paracetamol,Crocin,CRN2024001,2025-12-31,1000,GSK,Medical Suppliers,12.00,15.50,15.50,Rack-A1
Ibuprofen,Brufen,BRF2024002,2025-08-15,500,Abbott,Pharma Corp,20.00,25.00,25.00,Rack-B2
```

### **Required Fields**
- **genericName**: Drug generic name (required)
- **batchNumber**: Batch identification (required)
- **expiryDate**: Expiry date in YYYY-MM-DD format (required)
- **quantity**: Quantity to import (required)

### **Optional Fields**
- **brandName**: Brand/Trade name
- **manufacturer**: Manufacturer name
- **supplierName**: Supplier/vendor name
- **purchaseRate**: Purchase cost per unit
- **saleRate**: Sale price per unit
- **mrp**: Maximum retail price
- **storageLocation**: Storage location/rack

---

## 🔧 **How to Use the Import Feature**

### **Method 1: Through Pharmacy Procurement Interface**

1. **Navigate to Pharmacy Module**
   - Go to Pharmacy section in EMR
   - Click on "Procurement" or "Stock Management"

2. **Access Import Feature**
   - Look for "Stock Replenishment" card
   - Click "Upload Stock Manifest" button
   - Select CSV file from your computer

3. **Upload and Process**
   - System will parse CSV file
   - Validate data format and required fields
   - Process each item sequentially
   - Show import results summary

4. **Review Results**
   - Success: Number of items imported
   - Skipped: Items with errors
   - Errors: Detailed error messages

### **Method 2: Through API Directly**

```javascript
// Prepare import data
const stockItems = [
  {
    genericName: 'Paracetamol',
    batchNumber: 'BT2024001',
    expiryDate: '2025-12-31',
    quantity: 500,
    manufacturer: 'GSK',
    supplierName: 'Medical Suppliers Ltd'
  }
];

// Import via API
const result = await api.importPharmacyStock(tenantId, stockItems);
console.log('Import Results:', result);
```

---

## 🎯 **Import Process Flow**

### **Step 1: File Validation**
- Check CSV format
- Validate required fields
- Verify data types
- Check for duplicate entries

### **Step 2: Drug Master Management**
- Search for existing drug by generic name
- Create new drug entry if not found
- Update drug master with new information

### **Step 3: Batch Creation**
- Create batch records with expiry tracking
- Set initial quantities and costs
- Assign storage locations
- Generate batch numbers if not provided

### **Step 4: Inventory Update**
- Update current stock levels
- Calculate reorder points
- Set minimum/maximum stock levels
- Generate stock alerts if needed

### **Step 5: Audit Trail**
- Log all import operations
- Track user who performed import
- Record timestamp and changes
- Maintain compliance audit trail

---

## 📈 **Import Results and Reporting**

### **Success Response**
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "skipped": 3,
    "errors": [],
    "processingTime": "2.3 seconds"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Invalid CSV format: Missing required field 'genericName'"
}
```

### **Detailed Error Reporting**
- **Line-by-line error tracking**
- **Field-specific error messages**
- **Validation failure details**
- **Suggested corrections**

---

## 🔍 **Validation and Error Handling**

### **Data Validation Rules**
- **Required Fields**: genericName, batchNumber, expiryDate, quantity
- **Date Format**: YYYY-MM-DD for expiry dates
- **Numeric Fields**: quantity must be positive integer
- **String Length**: Batch numbers max 50 characters
- **Future Dates**: Expiry dates must be in the future

### **Business Logic Validation**
- **Duplicate Batches**: Check for existing batch numbers
- **Expired Drugs**: Reject drugs already expired
- **Quantity Limits**: Validate reasonable quantity ranges
- **Drug Master**: Ensure drug exists or create new entry

### **Error Recovery**
- **Partial Import**: Continue processing other items if one fails
- **Rollback Capability**: Transaction-based processing
- **Detailed Logging**: Comprehensive error tracking
- **User Notifications**: Clear error messages and guidance

---

## 🛡️ **Security and Compliance**

### **Access Control**
- **Role-Based Access**: Only authorized roles can import
- **Tenant Isolation**: Data isolated by tenant
- **User Authentication**: Require valid user session
- **Audit Logging**: Complete operation audit trail

### **Data Validation**
- **Input Sanitization**: Clean and validate all inputs
- **SQL Injection Prevention**: Use parameterized queries
- **File Type Validation**: Accept only CSV files
- **Size Limits**: Reasonable file size restrictions

### **Regulatory Compliance**
- **Batch Tracking**: Complete batch number tracking
- **Expiry Management**: Proper expiry date handling
- **Audit Trail**: Full compliance audit logging
- **Controlled Substances**: Special handling for scheduled drugs

---

## 📊 **Enhanced Features Available**

### **1. Bulk Import API** (Enhanced)
```javascript
// Enhanced bulk import with additional features
const result = await bulkImportPharmacyInventory(tenantId, inventoryData);
```

**Features:**
- **Enhanced Validation**: Stricter data validation
- **Drug Master Creation**: Automatic drug creation
- **Batch Management**: Advanced batch tracking
- **Price Management**: Purchase/sale price handling
- **Storage Location**: Location-based tracking

### **2. Template Download**
- **CSV Template**: Download sample CSV format
- **Field Documentation**: Detailed field descriptions
- **Example Data**: Sample data for reference
- **Validation Rules**: Clear validation criteria

### **3. Import History**
- **Import Logs**: Track all import operations
- **User Activity**: Monitor who imported what
- **Error Analysis**: Analyze common import errors
- **Performance Metrics**: Import speed and success rates

---

## 🚀 **Best Practices**

### **Before Import**
1. **Validate CSV Format**: Ensure correct column headers
2. **Check Data Quality**: Verify data accuracy
3. **Backup Current Data**: Create backup before import
4. **Test with Small Sample**: Import small batch first

### **During Import**
1. **Monitor Progress**: Watch import progress indicators
2. **Check Results**: Review import summary
3. **Handle Errors**: Address any import errors
4. **Verify Data**: Confirm data accuracy post-import

### **After Import**
1. **Verify Inventory**: Check stock levels
2. **Update Prices**: Verify pricing information
3. **Set Alerts**: Configure stock alerts
4. **Audit Trail**: Review import audit logs

---

## 🔧 **Troubleshooting**

### **Common Issues and Solutions**

#### **CSV Format Issues**
- **Problem**: Invalid CSV format
- **Solution**: Use provided template, check comma separators
- **Check**: Headers match required field names

#### **Date Format Issues**
- **Problem**: Invalid expiry date format
- **Solution**: Use YYYY-MM-DD format
- **Example**: 2025-12-31 instead of 31/12/2025

#### **Drug Not Found**
- **Problem**: Generic name not in drug master
- **Solution**: System creates new drug entry automatically
- **Recommendation**: Use consistent generic names

#### **Batch Number Conflicts**
- **Problem**: Duplicate batch numbers
- **Solution**: System logs error and skips duplicate
- **Recommendation**: Use unique batch numbers

#### **Large File Issues**
- **Problem**: File size too large
- **Solution**: Split into smaller files
- **Recommendation**: Import in batches of 100-200 items

---

## 📞 **Support and Help**

### **Getting Help**
1. **Check Documentation**: Review this guide thoroughly
2. **Use Template**: Download and use provided CSV template
3. **Test Environment**: Try imports in test environment first
4. **Contact Support**: Reach out for technical assistance

### **Additional Resources**
- **CSV Template**: Available in pharmacy module
- **Field Documentation**: Detailed field descriptions
- **Validation Rules**: Complete validation criteria
- **Error Codes**: Comprehensive error code reference

---

## 🎉 **Summary**

The Pharmacy Stock Import feature provides:

✅ **Easy CSV Import**: Simple file-based bulk import
✅ **Data Validation**: Comprehensive validation and error handling
✅ **Drug Master Management**: Automatic drug creation and updates
✅ **Batch Tracking**: Complete batch and expiry management
✅ **Audit Trail**: Full compliance and audit logging
✅ **Error Recovery**: Robust error handling and reporting
✅ **Security**: Role-based access and data protection
✅ **Performance**: Efficient processing of large datasets

**🚀 Ready for efficient pharmacy inventory management!**
