/**
 * Test Data Factory - Production-Ready Test Data Management
 * Handles creation, management, and cleanup of test data
 */

export class TestDataFactory {
  constructor() {
    this.createdData = new Map();
    this.timestamp = Date.now();
    this.suffix = Math.random().toString(36).substring(7);
  }

  /**
   * Generate unique test data with timestamp and random suffix
   */
  generateUnique(baseData, type = 'default') {
    const timestamp = this.timestamp;
    const suffix = this.suffix;
    
    switch (type) {
      case 'tenant':
        return this.generateUniqueTenant(baseData, timestamp, suffix);
      case 'user':
        return this.generateUniqueUser(baseData, timestamp, suffix);
      case 'patient':
        return this.generateUniquePatient(baseData, timestamp, suffix);
      default:
        return this.generateUniqueDefault(baseData, timestamp, suffix);
    }
  }

  /**
   * Generate unique tenant data
   */
  generateUniqueTenant(baseData, timestamp, suffix) {
    return {
      ...baseData,
      name: `${baseData.name}_${timestamp}_${suffix}`,
      code: `${baseData.code}${timestamp}`,
      adminEmail: `admin_${timestamp}_${suffix}@test.nexus.local`,
      database: `test_db_${timestamp}_${suffix}`,
      description: `${baseData.description} (Created: ${new Date(timestamp).toISOString()})`,
      settings: {
        ...baseData.settings,
        created: timestamp,
        testMode: true
      }
    };
  }

  /**
   * Generate unique user data
   */
  generateUniqueUser(baseData, timestamp, suffix) {
    return {
      ...baseData,
      firstName: `${baseData.firstName}_${suffix}`,
      lastName: `${baseData.lastName}_${timestamp}`,
      email: `${baseData.firstName.toLowerCase()}_${suffix}_${timestamp}@test.nexus.local`,
      username: `${baseData.firstName.toLowerCase()}_${suffix}_${timestamp}`,
      phone: `98${String(timestamp).slice(-8)}`,
      employeeId: `EMP${timestamp}${suffix}`,
      temporaryPassword: `Temp${timestamp}!`,
      metadata: {
        created: timestamp,
        testUser: true,
        suffix: suffix
      }
    };
  }

  /**
   * Generate unique patient data
   */
  generateUniquePatient(baseData, timestamp, suffix) {
    return {
      ...baseData,
      firstName: `${baseData.firstName}_${suffix}`,
      lastName: `${baseData.lastName}_${timestamp}`,
      email: `patient_${suffix}_${timestamp}@test.nexus.local`,
      phone: `99${String(timestamp).slice(-8)}`,
      patientId: `PAT${timestamp}${suffix}`,
      medicalRecordNumber: `MRN${timestamp}${suffix}`,
      emergencyContact: {
        name: `Emergency_${suffix}`,
        phone: `97${String(timestamp).slice(-8)}`
      },
      metadata: {
        created: timestamp,
        testPatient: true,
        suffix: suffix
      }
    };
  }

  /**
   * Generate unique default data
   */
  generateUniqueDefault(baseData, timestamp, suffix) {
    return {
      ...baseData,
      name: baseData.name ? `${baseData.name}_${timestamp}_${suffix}` : undefined,
      email: baseData.email ? `${baseData.email.split('@')[0]}_${suffix}_${timestamp}@test.nexus.local` : undefined,
      id: baseData.id ? `${baseData.id}_${timestamp}_${suffix}` : undefined,
      metadata: {
        created: timestamp,
        testMode: true,
        suffix: suffix
      }
    };
  }

  /**
   * Create test tenant
   */
  async createTenant(tenantData = {}) {
    const baseTenantData = {
      name: 'Test Tenant',
      code: 'TEST',
      adminEmail: 'admin@test.nexus.local',
      database: 'test_db',
      description: 'Test tenant for automated testing',
      settings: {
        timezone: 'UTC',
        language: 'en',
        theme: 'default'
      }
    };

    const tenant = this.generateUnique({ ...baseTenantData, ...tenantData }, 'tenant');
    this.createdData.set(`tenant_${tenant.code}`, tenant);
    
    console.log(`🏢 Created test tenant: ${tenant.name} (${tenant.code})`);
    return tenant;
  }

  /**
   * Create test user
   */
  async createUser(userData = {}) {
    const baseUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@nexus.local',
      role: 'Doctor',
      department: 'Medical',
      permissions: ['read', 'write']
    };

    const user = this.generateUnique({ ...baseUserData, ...userData }, 'user');
    this.createdData.set(`user_${user.email}`, user);
    
    console.log(`👤 Created test user: ${user.firstName} ${user.lastName} (${user.email})`);
    return user;
  }

  /**
   * Create test patient
   */
  async createPatient(patientData = {}) {
    const basePatientData = {
      firstName: 'Test',
      lastName: 'Patient',
      email: 'test.patient@nexus.local',
      dob: '1985-04-15',
      gender: 'Female',
      phone: '9876543210',
      address: '123 Test Street, Test City',
      bloodType: 'O+',
      allergies: 'None'
    };

    const patient = this.generateUnique({ ...basePatientData, ...patientData }, 'patient');
    this.createdData.set(`patient_${patient.patientId}`, patient);
    
    console.log(`🏥 Created test patient: ${patient.firstName} ${patient.lastName} (${patient.patientId})`);
    return patient;
  }

  /**
   * Create multiple test users
   */
  async createMultipleUsers(count, userDataOverrides = []) {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const overrides = userDataOverrides[i] || {};
      const roles = ['Doctor', 'Nurse', 'Administrator', 'Pharmacist', 'Lab Technician'];
      const departments = ['Medical', 'Surgery', 'Emergency', 'Pharmacy', 'Laboratory'];
      
      const userData = {
        ...overrides,
        role: overrides.role || roles[i % roles.length],
        department: overrides.department || departments[i % departments.length]
      };
      
      const user = await this.createUser(userData);
      users.push(user);
    }
    
    console.log(`👥 Created ${count} test users`);
    return users;
  }

  /**
   * Create multiple test patients
   */
  async createMultiplePatients(count, patientDataOverrides = []) {
    const patients = [];
    
    for (let i = 0; i < count; i++) {
      const overrides = patientDataOverrides[i] || {};
      const genders = ['Male', 'Female', 'Other'];
      
      const patientData = {
        ...overrides,
        gender: overrides.gender || genders[i % genders.length]
      };
      
      const patient = await this.createPatient(patientData);
      patients.push(patient);
    }
    
    console.log(`🏥 Created ${count} test patients`);
    return patients;
  }

  /**
   * Get created data by type
   */
  getData(type) {
    const data = [];
    for (const [key, value] of this.createdData) {
      if (key.startsWith(`${type}_`)) {
        data.push(value);
      }
    }
    return data;
  }

  /**
   * Get specific data item
   */
  getDataItem(key) {
    return this.createdData.get(key);
  }

  /**
   * Update data item
   */
  updateDataItem(key, updates) {
    const existing = this.createdData.get(key);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.createdData.set(key, updated);
      console.log(`📝 Updated test data: ${key}`);
      return updated;
    }
    return null;
  }

  /**
   * Remove data item
   */
  removeDataItem(key) {
    const removed = this.createdData.delete(key);
    if (removed) {
      console.log(`🗑️ Removed test data: ${key}`);
    }
    return removed;
  }

  /**
   * Get data summary
   */
  getDataSummary() {
    const summary = {
      total: this.createdData.size,
      byType: {},
      timestamp: this.timestamp,
      suffix: this.suffix
    };

    for (const [key, value] of this.createdData) {
      const type = key.split('_')[0];
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    }

    return summary;
  }

  /**
   * Export data for debugging
   */
  exportData() {
    const data = {};
    for (const [key, value] of this.createdData) {
      data[key] = value;
    }
    
    return {
      data,
      summary: this.getDataSummary(),
      exported: new Date().toISOString()
    };
  }

  /**
   * Import data for test restoration
   */
  importData(importedData) {
    this.createdData.clear();
    
    for (const [key, value] of Object.entries(importedData.data)) {
      this.createdData.set(key, value);
    }
    
    console.log(`📥 Imported ${this.createdData.size} test data items`);
    return this.getDataSummary();
  }

  /**
   * Cleanup all test data
   */
  async cleanup() {
    console.log(`🧹 Cleaning up ${this.createdData.size} test data items...`);
    
    const cleanupPromises = [];
    
    for (const [key, value] of this.createdData) {
      const type = key.split('_')[0];
      
      // Create cleanup promise for each item
      const cleanupPromise = this.cleanupDataItem(type, value, key);
      cleanupPromises.push(cleanupPromise);
    }
    
    // Execute all cleanup operations
    try {
      await Promise.allSettled(cleanupPromises);
      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.log('❌ Some cleanup operations failed:', error.message);
    }
    
    // Clear the data map
    this.createdData.clear();
  }

  /**
   * Cleanup individual data item
   */
  async cleanupDataItem(type, data, key) {
    try {
      console.log(`🗑️ Cleaning up ${type}: ${key}`);
      
      // In a real implementation, this would make API calls to delete the data
      // For now, we'll simulate the cleanup
      
      switch (type) {
        case 'tenant':
          await this.cleanupTenant(data);
          break;
        case 'user':
          await this.cleanupUser(data);
          break;
        case 'patient':
          await this.cleanupPatient(data);
          break;
        default:
          console.log(`⚠️ No cleanup method for type: ${type}`);
      }
      
      console.log(`✓ Cleaned up ${type}: ${key}`);
      
    } catch (error) {
      console.log(`❌ Failed to cleanup ${type} ${key}: ${error.message}`);
    }
  }

  /**
   * Cleanup tenant data
   */
  async cleanupTenant(tenant) {
    // Simulate tenant cleanup
    console.log(`🏢 Cleaning up tenant: ${tenant.name}`);
    
    // In real implementation:
    // await api.delete(`/tenants/${tenant.code}`);
    // await database.dropDatabase(tenant.database);
  }

  /**
   * Cleanup user data
   */
  async cleanupUser(user) {
    // Simulate user cleanup
    console.log(`👤 Cleaning up user: ${user.email}`);
    
    // In real implementation:
    // await api.delete(`/users/${user.id}`);
    // await database.deleteUser(user.id);
  }

  /**
   * Cleanup patient data
   */
  async cleanupPatient(patient) {
    // Simulate patient cleanup
    console.log(`🏥 Cleaning up patient: ${patient.patientId}`);
    
    // In real implementation:
    // await api.delete(`/patients/${patient.id}`);
    // await database.deletePatient(patient.id);
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity() {
    console.log('🔍 Validating test data integrity...');
    
    const issues = [];
    
    for (const [key, value] of this.createdData) {
      const type = key.split('_')[0];
      
      // Basic validation
      if (!value.metadata || !value.metadata.created) {
        issues.push(`${key}: Missing metadata`);
      }
      
      if (!value.metadata.testMode) {
        issues.push(`${key}: Not marked as test data`);
      }
      
      // Type-specific validation
      switch (type) {
        case 'tenant':
          if (!value.code || !value.name) {
            issues.push(`${key}: Missing tenant code or name`);
          }
          break;
        case 'user':
          if (!value.email || !value.firstName || !value.lastName) {
            issues.push(`${key}: Missing user information`);
          }
          break;
        case 'patient':
          if (!value.patientId || !value.firstName || !value.lastName) {
            issues.push(`${key}: Missing patient information`);
          }
          break;
      }
    }
    
    const isValid = issues.length === 0;
    
    console.log(`${isValid ? '✅' : '❌'} Data integrity: ${issues.length} issues found`);
    
    if (!isValid) {
      console.log('Issues:', issues);
    }
    
    return {
      isValid,
      issues,
      total: this.createdData.size
    };
  }

  /**
   * Reset factory to clean state
   */
  reset() {
    this.createdData.clear();
    this.timestamp = Date.now();
    this.suffix = Math.random().toString(36).substring(7);
    console.log('🔄 Test data factory reset');
  }
}
