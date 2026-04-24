import { query } from '../db/connection.js';

/**
 * Get the tenant schema name dynamically based on tenant ID
 * @param {string} tenantId - The tenant UUID
 * @returns {Promise<string>} - The tenant schema name (e.g., 'demo_emr', 'nhgl_emr')
 */
export async function getTenantSchema(tenantId) {
  try {
    // First, try looking up the registered schema in management_tenants (most accurate)
    const mgmtResult = await query(`
      SELECT schema_name FROM emr.management_tenants 
      WHERE id::text = $1::text AND schema_name IS NOT NULL
    `, [tenantId]);

    if (mgmtResult.rows.length > 0) {
      const schemaName = mgmtResult.rows[0].schema_name;
      // Verify the schema exists
      const schemaCheck = await query(`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
      `, [schemaName]);
      if (schemaCheck.rows.length > 0) return schemaName;
    }

    // Fallback: derive from emr.tenants schema_name or code
    const tenantResult = await query(`
      SELECT code, schema_name FROM emr.tenants WHERE id::text = $1::text
    `, [tenantId]);

    if (tenantResult.rows.length === 0) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const tenantCode = tenantResult.rows[0].code?.toLowerCase();
    const explicitSchema = tenantResult.rows[0].schema_name?.toLowerCase();

    // Try explicit schema first, then exact code, then code_emr pattern
    const candidates = [];
    if (explicitSchema) candidates.push(explicitSchema);
    if (tenantCode) {
      candidates.push(tenantCode);
      candidates.push(`${tenantCode}_emr`);
    }

    for (const candidate of candidates) {
      if (!candidate) continue;
      const schemaCheck = await query(`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
      `, [candidate]);
      if (schemaCheck.rows.length > 0) return candidate;
    }

    console.warn(`No schema found for tenant ${tenantId} (code: ${tenantCode}, schema: ${explicitSchema}), falling back to emr`);
    return 'emr';
  } catch (error) {
    console.error('Error getting tenant schema:', error.message);
    return 'emr';
  }
}

/**
 * Execute a query with dynamic tenant schema
 * @param {string} tenantId - The tenant UUID
 * @param {string} queryText - The SQL query with placeholder {schema}
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
export async function queryWithTenantSchema(tenantId, queryText, params = []) {
  const schemaName = await getTenantSchema(tenantId);
  
  // Replace {schema} placeholder with actual schema name
  const dynamicQuery = queryText.replace(/\{schema\}/g, schemaName);
  
  return await query(dynamicQuery, params);
}

/**
 * Get all available tenant schemas
 * @returns {Promise<Array>} - Array of tenant schema information
 */
export async function getAvailableTenantSchemas() {
  try {
    const result = await query(`
      SELECT 
        t.id as tenant_id,
        t.code as tenant_code,
        t.name as tenant_name,
        t.subdomain,
        CASE 
          WHEN s.schema_name IS NOT NULL THEN s.schema_name
          ELSE CONCAT(LOWER(t.code), '_emr')
        END as schema_name,
        CASE 
          WHEN s.schema_name IS NOT NULL THEN true
          ELSE false
        END as schema_exists
      FROM emr.tenants t
      LEFT JOIN information_schema.schemata s ON s.schema_name = CONCAT(LOWER(t.code), '_emr')
      ORDER BY t.code
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting tenant schemas:', error.message);
    return [];
  }
}

/**
 * Create tenant schema if it doesn't exist
 * @param {string} tenantId - The tenant UUID
 * @returns {Promise<string>} - The schema name
 */
export async function ensureTenantSchema(tenantId) {
  try {
    const schemaName = await getTenantSchema(tenantId);
    
    // Check if schema exists
    const schemaCheck = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);
    
    if (schemaCheck.rows.length === 0) {
      console.log(`Creating tenant schema: ${schemaName}`);
      await query(`CREATE SCHEMA ${schemaName}`);
      console.log(`Tenant schema ${schemaName} created successfully`);
    }
    
    return schemaName;
  } catch (error) {
    console.error('Error ensuring tenant schema:', error.message);
    throw error;
  }
}
