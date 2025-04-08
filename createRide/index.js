const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Create Ride function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { pickup_addr, destination_addr, pickup_time, emp_id } = req.body;

        // Validate required fields
        if (!pickup_addr || !destination_addr || !pickup_time) {
            context.res = {
                status: 400,
                body: { message: 'Pickup address, destination address, and pickup time are required.' }
            };
            return;
        }

        const userId = emp_id || req.user.id;

        // Verify the employee exists
        const employeeResult = await db.query(
            'SELECT * FROM "employees" WHERE emp_id = $1',
            [userId]
        );

        if (employeeResult.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Employee not found.' }
            };
            return;
        }

        // Check if the user already has an active ride
        const activeRideResult = await db.query(
            'SELECT * FROM "rides" WHERE emp_id = $1 AND status NOT IN (\'completed\', \'cancelled\')',
            [userId]
        );

        if (activeRideResult.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'You already have an active ride.' }
            };
            return;
        }

        // Create a new ride
        const result = await db.query(
            'INSERT INTO "rides" (emp_id, ride_pickup_addr, ride_destination_addr, ride_pickup_time, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [userId, pickup_addr, destination_addr, new Date(pickup_time), 'pending']
        );

        context.res = {
            status: 201,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error creating ride:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};