# Institutional Configuration & Provisioning

This directory contains the canonical structural definitions and baseline configurations for the MedFlow EMR platform.

## Key Files

### [tenant_plane_provisioning.sql](./tenant_plane_provisioning.sql)
**Purpose**: The definitive DDL (Data Definition Language) script for the Clinical Data Plane.
- **Scope**: Clinical Records, Patients, Inventory, Billing, and HR.
- **Architecture**: This script is executed for every new institutional shard creation.
- **Automation**: Includes built-in PostgreSQL triggers for automated `updated_at` timestamp management.
- **Integrity**: Enforces strict referential integrity with CASCADE rules to ensure data consistency in isolated shards.

## Architectural Notes
- **Control Plane**: Managed via the `emr` schema in the primary database.
- **Data Plane**: Managed via isolated institution-specific schemas (shards), provisioned using the SQL script in this directory.
- **Syncing**: The `server/auto_migrate.js` engine automatically synchronizes all shards with this baseline on system startup.

---
**Standardization**: All business logic and clinical features must be defined here before being propagated to individual hospital nodes.
