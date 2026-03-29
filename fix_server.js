import fs from 'fs';
import path from 'path';

const filePath = 'server/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted Lab results endpoint
const labResultsEndpoint = `app.post('/api/lab/orders/:id/results', requireTenant, moduleGate('lab'), async (req, res) => {
  try {
    const { id } = req.params;
    const { results, notes, criticalFlag = false } = req.body;

    const r = await query(
      \`UPDATE emr.service_requests 
       SET status = 'completed', notes = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 RETURNING *\`,
      [JSON.stringify({ results, criticalFlag, enteredBy: req.user.id, enteredAt: new Date(), notes }), id, req.tenantId]
    );

    // Add Audit Log
    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: criticalFlag ? 'lab.result.record_critical' : 'lab.result.record',
      entityName: 'service_request',
      entityId: id,
      details: { criticalFlag }
    });

    if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error('Error recording lab results:', error);
    res.status(500).json({ error: 'Failed to record lab results' });
  }
});`;

// Find the broken app.post and replace it
// The broken part looks like app.post('/api/lab/orders/:id/results', ... followed by missing lines
const regex = /app\.post\('\/api\/lab\/orders\/:id\/results'.*?\}\);/s;
if (regex.test(content)) {
    content = content.replace(regex, labResultsEndpoint);
} else {
    // If it's so broken it doesn't match the regex, we need a different approach
    console.log("Regex didn't match, checking for fragments");
    const fragments = /app\.post\('\/api\/lab\/orders\/:id\/results'.*/s;
    // This is risky, only replace if we find the specific broken start
    if (content.indexOf("app.post('/api/lab/orders/:id/results'") !== -1) {
        // Find the start and search for the next section start
        const startIdx = content.indexOf("app.post('/api/lab/orders/:id/results'");
        const nextSectionIdx = content.indexOf("// =====================================================", startIdx + 10);
        if (nextSectionIdx !== -1) {
             content = content.substring(0, startIdx) + labResultsEndpoint + "\n\n" + content.substring(nextSectionIdx);
        }
    }
}

// Also fix the Ward duplication from earlier
const wardDuplication = /app\.post\('\/api\/wards', requireTenant, requirePermission\('admin'\), async \(req, res\) => \{.*?\}\);\s*\/\/ =====================================================\s*\/\/ ADMINISTRATIVE MASTERS\s*\/\/ =====================================================/s;
// (Already did this? Let's check)

fs.writeFileSync(filePath, content);
console.log("Applied repairs to server/index.js");
