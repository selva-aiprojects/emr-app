# EMR Schema Updates for MAGNUM Tenant - Multi-Tenant Deployment Plan

## Status: In Progress

### Step 1: Create TODO.md [COMPLETED]

### Step 2: Update database/NEXUS_MASTER_BASELINE.sql
- Add idempotent INSERT for MAGNUM GROUP OF HOSPITALS LTD in management_tenants (code='magnum', schema_name='magnum', tier='Enterprise')
- Add legacy tenants entry
- Seed Enterprise subscription
- Add default superadmin
- Call refresh_metrics for magnum
- [COMPLETED ✅]

### Step 3: Update database/SHARD_MASTER_BASELINE.sql
- Add RLS policies using current_tenant_id()
- Add Enterprise seed data: departments, wards (50 beds), services/pricing, insurance_providers, corporate_clients
- Version comments
- [COMPLETED ✅]

### Step 4: Verify updates
- No tool needed, manual review post-edits
- [PENDING]

### Step 5: Update TODO.md with completion
- [PENDING]

### Step 6: Final verification & completion
- Run SQLs in test DB if possible
- [PENDING]

