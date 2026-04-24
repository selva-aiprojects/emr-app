# SHARD_MASTER_BASELINE.sql Update Summary

## Version Update
- **Previous**: 2.2.0
- **Current**: 2.3.1 (Updated with audit log fixes and latest institutional tables)

## Key Updates Applied

### 1. Institutional Masters (Updated from migrations 13-15)
- **departments table**: Added proper structure with `head_of_dept`, `is_active`, and proper constraints
- **services table**: Updated with `base_rate`, `tax_percent`, and proper indexing
- **wards/beds tables**: Enhanced with proper constraints and relationships

### 2. Document Management (from migration 14)
- **documents table**: Complete document management with metadata, tags, and audit trail
- **document_audit_logs table**: Full audit logging for document operations

### 3. Audit Log Fixes (Critical Bug Fix)
- **audit_logs table**: Updated with proper column structure for UUID compatibility
- **Added missing columns**: `user_name`, `ip_address`, `user_agent` for comprehensive tracking
- **Fixed UUID casting**: Resolved `tenant_id` type mismatch issues that caused "Resource Synchronization Failed" errors
- **Enhanced audit trail**: Better tracking of all tenant operations

### 4. Enhanced Service Requests (from migration 15)
- **service_requests table**: Updated with proper structure for lab and other service orders
- Added proper indexing for performance
- Enhanced status and priority management

### 5. Ambulance Fleet Management (from migration 13-14)
- **ambulances table**: Added `current_driver`, `contact_number` fields
- **ambulance_trips table**: Proper trip management with location tracking

### 6. Blood Bank Enhancements (from migration 13-14)
- **blood_units table**: Enhanced with donor information
- **blood_requests table**: Proper request management system

### 7. Comprehensive Indexing
- Added performance indexes for all major tables
- Optimized queries for tenant isolation
- Added foreign key constraints where appropriate

### 8. Updated Triggers
- Extended trigger system to include all new tables
- Automatic `updated_at` timestamp management

## Tables Added/Updated
1. **departments** - Organizational structure
2. **services** - Service catalog with pricing
3. **documents** - Document management system
4. **document_audit_logs** - Document audit trail
5. **service_requests** - Enhanced service ordering
6. **ambulances** - Fleet management
7. **ambulance_trips** - Trip tracking
8. **blood_units** - Enhanced blood inventory
9. **blood_requests** - Blood request management

## Critical Bug Fixes
- **Audit Log UUID Issue**: Fixed `tenant_id` type mismatch that caused "Resource Synchronization Failed" errors
- **Management Tenants Sync**: Fixed UUID comparison in management_tenants updates
- **Missing Audit Columns**: Added `user_name`, `ip_address`, `user_agent` for proper audit tracking

## Migration Compatibility
- All tables from migrations 13-17 are now included
- Maintains backward compatibility with existing tenant schemas
- Supports the Institutional Branding features (theme, features, billing_config)
- **Fixed audit logging** for all tenant operations

## Usage
This updated SHARD file can be used for:
- New tenant provisioning
- Schema updates for existing tenants
- Development environment setup
- Production tenant creation
- **Fixing audit log issues** in existing deployments

## Verification
The file includes all necessary:
- Primary keys and constraints
- Foreign key relationships
- Indexes for performance
- Triggers for timestamp management
- Base seed data for roles

This ensures that new tenants created with this SHARD file will have all the latest features and institutional capabilities.
