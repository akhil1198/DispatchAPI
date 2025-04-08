const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Delete Employee function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { id } = req.params;

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

        // Delete employee
        await db.query(
            'DELETE FROM "employees" WHERE emp_id = $1',
            [id]
        );

        context.res = {
            status: 200,
            body: { message: 'Employee deleted successfully.' }
        };
    } catch (error) {
        context.log.error('Error deleting employee:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};