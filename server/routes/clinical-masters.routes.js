import express from 'express';
import { query } from '../db/connection.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();



// --- SPECIALITIES ---
router.get('/specialities', authenticate, async (req, res) => {
    try {
        const result = await query(`SELECT * FROM specialities WHERE tenant_id = $1 ORDER BY name ASC`, [req.tenantId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/specialities', authenticate, async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await query(`
            INSERT INTO specialities (tenant_id, name, description)
            VALUES ($1, $2, $3) RETURNING *
        `, [req.tenantId, name, description]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/specialities/:id', authenticate, async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await query(`
            UPDATE specialities SET name = $1, description = $2, updated_at = NOW()
            WHERE id = $3 AND tenant_id = $4 RETURNING *
        `, [name, description, req.params.id, req.tenantId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/specialities/:id', authenticate, async (req, res) => {
    try {
        await query(`DELETE FROM specialities WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.tenantId]);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DISEASES ---
router.get('/diseases', authenticate, async (req, res) => {
    try {
        const result = await query(`SELECT * FROM diseases WHERE tenant_id = $1 ORDER BY code ASC`, [req.tenantId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/diseases', authenticate, async (req, res) => {
    try {
        const { code, name, category, description } = req.body;
        const result = await query(`
            INSERT INTO diseases (tenant_id, code, name, category, description)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [req.tenantId, code, name, category, description]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/diseases/:id', authenticate, async (req, res) => {
    try {
        const { code, name, category, description } = req.body;
        const result = await query(`
            UPDATE diseases SET code = $1, name = $2, category = $3, description = $4, updated_at = NOW()
            WHERE id = $5 AND tenant_id = $6 RETURNING *
        `, [code, name, category, description, req.params.id, req.tenantId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/diseases/:id', authenticate, async (req, res) => {
    try {
        await query(`DELETE FROM diseases WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.tenantId]);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TREATMENTS ---
router.get('/treatments', authenticate, async (req, res) => {
    try {
        const result = await query(`SELECT * FROM treatments WHERE tenant_id = $1 ORDER BY code ASC`, [req.tenantId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/treatments', authenticate, async (req, res) => {
    try {
        const { code, name, category, base_cost } = req.body;
        const result = await query(`
            INSERT INTO treatments (tenant_id, code, name, category, base_cost)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [req.tenantId, code, name, category, base_cost]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/treatments/:id', authenticate, async (req, res) => {
    try {
        const { code, name, category, base_cost } = req.body;
        const result = await query(`
            UPDATE treatments SET code = $1, name = $2, category = $3, base_cost = $4, updated_at = NOW()
            WHERE id = $5 AND tenant_id = $6 RETURNING *
        `, [code, name, category, base_cost, req.params.id, req.tenantId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/treatments/:id', authenticate, async (req, res) => {
    try {
        await query(`DELETE FROM treatments WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.tenantId]);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
