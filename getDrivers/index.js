const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Get drivers function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;

        // If ID is provided, get a specific driver
        if (id) {
            const result = await db.query(
                'SELECT * FROM "drivers" WHERE driver_id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                context.res = {
                    status: 404,
                    body: { message: 'Driver not found.' }
                };
                return;
            }

            context.res = {
                status: 200,
                body: result.rows[0]
            };
            return;
        }

        // Otherwise, get all drivers
        const result = await db.query('SELECT * FROM "drivers" ORDER BY created_at DESC');

        context.res = {
            status: 200,
            body: result.rows
        };
    } catch (error) {
        context.log.error('Error fetching drivers:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
