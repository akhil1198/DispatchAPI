const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Update Employee function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;
        const { f_name, l_name, email, phone, role, is_admin } = req.body;

        // Check if employee exists
        const existingEmployee = await db.query(
            'SELECT * FROM "employees" WHERE emp_id = $1',
            [id]
        );

        if (existingEmployee.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Employee not found.' }
            };
            return;
        }

        // Users can update their own basic info, but only admins can change roles or admin status
        if (!req.user.is_admin && (is_admin !== undefined || role !== undefined || req.user.id !== parseInt(id))) {
            context.res = {
                status: 403,
                body: { message: 'You can only update your own profile and cannot change role or admin status.' }
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

        if (role && req.user.is_admin) {
            setClause.push(`role = $${paramIndex++}`);
            params.push(role);
        }

        if (is_admin !== undefined && req.user.is_admin) {
            setClause.push(`is_admin = $${paramIndex++}`);
            params.push(is_admin);
        }

        // Add ID as the last parameter
        params.push(id);

        // Update employee
        const result = await db.query(
            `UPDATE "employees" SET ${setClause.join(', ')} WHERE emp_id = $${paramIndex} RETURNING *`,
            params
        );

        context.res = {
            status: 200,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error updating employee:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
