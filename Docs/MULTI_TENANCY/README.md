# Multi-Tenancy Documentation

## Overview
This section contains comprehensive documentation for the multi-tenant architecture and dynamic schema system.

## Key Documents

### **[Dynamic Schema System](./DYNAMIC_SCHEMA_SYSTEM.md)**
- Complete technical documentation of the dynamic schema resolution system
- Schema naming conventions and tenant isolation strategy
- Implementation details and troubleshooting

### **[Tenant Provisioning Guide](./TENANT_PROVISIONING.md)**
- Step-by-step guide for provisioning new tenants
- Automated provisioning scripts and procedures
- Data seeding and verification processes

### **[Schema Reference](./SCHEMA_REFERENCE.md)**
- Complete database schema documentation
- Table structures, relationships, and constraints
- Migration and versioning information

### **[Reports & Analysis](./REPORTS_ANALYSIS.md)**
- Reports API documentation and troubleshooting
- Dashboard metrics and data flow
- Multi-tenant data isolation and security

## Architecture Summary

```
emr (Global Schema)
  - tenants (tenant management)
  - users (authentication)
  - roles (permissions)

<tenant_code>_emr or nhgl (Tenant Schemas)
  - patients, appointments, invoices
  - Clinical data and operations
  - Isolated per tenant
```

## Quick Links

- [Schema Files](../../database/) - Database schema definitions
- [Provisioning Scripts](../../scripts/) - Automated tenant setup
- [API Documentation](../API/) - REST API reference
