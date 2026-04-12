import { query } from '../db/connection.js';

/**
 * Get the tenant schema name dynamically based on tenant ID
 * @param {string} tenantId - The tenant UUID
 * @returns {Promise<string>} - The tenant schema name (e.g., 'demo_emr', 'nhgl_emr')
 */
export async function getTenantSchema(tenantId) {
  try {
    // First, get the tenant code from the main emr schema
    const tenantResult = await query(`
      SELECT code, subdomain 
      FROM emr.tenants 
      WHERE id = $1
    `, [tenantId]);
    
    if (tenantResult.rows.length === 0) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    
    const tenant = tenantResult.rows[0];
    const tenantCode = tenant.code.toLowerCase();
    
    // Construct the schema name: {code} (for NHGL) or {code}_emr (for others)
    const schemaName = tenantCode === 'nhgl' ? 'nhgl' : `${tenantCode}_emr`;
    
    // Verify the schema exists
    const schemaCheck = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);
    
    if (schemaCheck.rows.length === 0) {
      console.warn(`Schema ${schemaName} not found for tenant ${tenantId}, falling back to demo_emr`);
      return 'demo_emr';
    }
    
    return schemaName;
  } catch (error) {
    console.error('Error getting tenant schema:', error.message);
    // Fallback to demo_emr for safety
    return 'demo_emr';
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
