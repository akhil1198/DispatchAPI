const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Get vehicles function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;
        const { available } = req.query;

        // If ID is provided, get a specific vehicle
        if (id) {
            const result = await db.query(
                'SELECT * FROM "vehicles" WHERE vehicle_id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                context.res = {
                    status: 404,
                    body: { message: 'Vehicle not found.' }
                };
                return;
            }

            context.res = {
                status: 200,
                body: result.rows[0]
            };
            return;
        }

        // If available=true, get only available vehicles (not assigned to active rides)
        if (available === 'true') {
            const result = await db.query(`
        SELECT v.* 
        FROM "vehicles" v
        WHERE NOT EXISTS (
          SELECT 1 
          FROM "driver_assigned" da 
          JOIN "rides" r ON da.ride_id = r.ride_id 
          WHERE da.vehicle_id = v.vehicle_id AND r.status NOT IN ('completed', 'cancelled')
        )
        ORDER BY v.created_at DESC
      `);

            context.res = {
                status: 200,
                body: result.rows
            };
            return;
        }

        // Otherwise, get all vehicles
        const result = await db.query('SELECT * FROM "vehicles" ORDER BY created_at DESC');

        context.res = {
            status: 200,
            body: result.rows
        };
    } catch (error) {
        context.log.error('Error fetching vehicles:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};