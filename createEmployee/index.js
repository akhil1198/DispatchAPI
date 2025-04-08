const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Create Employee function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { f_name, l_name, email, phone, role, is_admin } = req.body;

        // Validate required fields
        if (!f_name || !l_name || !email || !phone || !role) {
            context.res = {
                status: 400,
                body: { message: 'All fields are required.' }
            };
            return;
        }

        // Check if email already exists
        const existingUser = await db.query(
            'SELECT * FROM "employees" WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'Email already exists.' }
            };
            return;
        }

        // Insert new employee
        const result = await db.query(
            'INSERT INTO "employees" (f_name, l_name, email, phone, role, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
            [f_name, l_name, email, phone, role, is_admin || false]
        );

        context.res = {
            status: 201,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error creating employee:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
