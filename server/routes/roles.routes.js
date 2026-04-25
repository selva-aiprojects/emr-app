import express from 'express';
import { query } from '../db/connection.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();



/**
 * @route   GET /api/roles
 * @desc    Get all roles for the current tenant
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await query(`
            SELECT r.*, (SELECT COUNT(*) FROM users WHERE role = r.id) as user_count
            FROM roles r
            ORDER BY r.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/roles
 * @desc    Create a new role
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const result = await query(`
            INSERT INTO roles (id, name, description, permissions)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [id, name, description, JSON.stringify(permissions || [])]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   PUT /api/roles/:id
 * @desc    Update an existing role
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const result = await query(`
            UPDATE roles 
            SET name = $1, description = $2, permissions = $3, updated_at = NOW()
            WHERE id = $4 RETURNING *
        `, [name, description, JSON.stringify(permissions || []), req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete a role
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userCheck = await query(`SELECT COUNT(*) FROM users WHERE role = $1`, [req.params.id]);
        if (parseInt(userCheck.rows[0].count) > 0) {
            return res.status(400).json({ error: 'Cannot delete role: identities are still assigned to this protocol.' });
        }
        
        await query(`DELETE FROM roles WHERE id = $1`, [req.params.id]);
        res.status(204).end();
    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
