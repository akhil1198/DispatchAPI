const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Get employees function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;

        // If ID is provided, get a specific employee
        if (id) {
            const result = await db.query(
                'SELECT * FROM employees WHERE emp_id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                context.res = {
                    status: 404,
                    body: { message: 'Employee not found.' }
                };
                return;
            }

            context.res = {
                status: 200,
                body: result.rows[0]
            };
            return;
        }

        // Otherwise, get all employees
        const result = await db.query('SELECT * FROM employees ORDER BY created_at DESC');

        context.res = {
            status: 200,
            body: result.rows
        };
    } catch (error) {
        context.log.error('Error fetching employees:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};