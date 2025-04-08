// src/functions/drivers/updateDriver/index.js
const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Update Driver function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { id } = req.params;
        const { f_name, l_name, email, phone, role } = req.body;

        // Check if driver exists
        const existingDriver = await db.query(
            'SELECT * FROM "drivers" WHERE driver_id = $1',
            [id]
        );

        if (existingDriver.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Driver not found.' }
            };
            return;
        }

        // Build SET clause and params array dynamically
        let setClause = [];
        let params = [];
        let paramIndex = 1;

        if (f_name) {
            setClause.push(`f_name = $${paramIndex++}`);
            params.push(f_name);
        }

        if (l_name) {
            setClause.push(`l_name = $${paramIndex++}`);
            params.push(l_name);
        }

        if (email) {
            setClause.push(`email = $${paramIndex++}`);
            params.push(email);
        }

        if (phone) {
            setClause.push(`phone = $${paramIndex++}`);
            params.push(phone);
        }

        if (role) {
            setClause.push(`role = $${paramIndex++}`);
            params.push(role);
        }

        // Add ID as the last parameter
        params.push(id);

        // Update driver
        const result = await db.query(
            `UPDATE "drivers" SET ${setClause.join(', ')} WHERE driver_id = $${paramIndex} RETURNING *`,
            params
        );

        context.res = {
            status: 200,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error updating driver:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
