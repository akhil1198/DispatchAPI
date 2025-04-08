const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Create Vehicle function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { vehicle_name, vehicle_company } = req.body;

        // Validate required fields
        if (!vehicle_name || !vehicle_company) {
            context.res = {
                status: 400,
                body: { message: 'Vehicle name and company are required.' }
            };
            return;
        }

        // Insert new vehicle
        const result = await db.query(
            'INSERT INTO "vehicles" (vehicle_name, vehicle_company, created_at) VALUES ($1, $2, NOW()) RETURNING *',
            [vehicle_name, vehicle_company]
        );

        context.res = {
            status: 201,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error creating vehicle:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
