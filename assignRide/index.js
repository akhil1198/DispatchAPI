// src/functions/rides/assignRide/index.js
const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Assign Ride function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { ride_id, driver_id, vehicle_id } = req.body;

        // Validate required fields
        if (!ride_id || !driver_id || !vehicle_id) {
            context.res = {
                status: 400,
                body: { message: 'Ride ID, driver ID, and vehicle ID are required.' }
            };
            return;
        }

        // Verify the ride exists and is in pending status
        const rideResult = await db.query(
            'SELECT * FROM "rides" WHERE ride_id = $1',
            [ride_id]
        );

        if (rideResult.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Ride not found.' }
            };
            return;
        }

        if (rideResult.rows[0].status !== 'pending') {
            context.res = {
                status: 400,
                body: { message: `Cannot assign a ride with status "${rideResult.rows[0].status}".` }
            };
            return;
        }

        // Verify driver exists
        const driverResult = await db.query(
            'SELECT * FROM "drivers" WHERE driver_id = $1',
            [driver_id]
        );

        if (driverResult.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Driver not found.' }
            };
            return;
        }

        // Verify vehicle exists
        const vehicleResult = await db.query(
            'SELECT * FROM "vehicles" WHERE vehicle_id = $1',
            [vehicle_id]
        );

        if (vehicleResult.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Vehicle not found.' }
            };
            return;
        }

        // Check if driver is already assigned to another active ride
        const activeDriverAssignmentResult = await db.query(
            `SELECT da.* FROM "driver_assigned" da
       JOIN "rides" r ON da.ride_id = r.ride_id
       WHERE da.driver_id = $1 AND r.status NOT IN ('completed', 'cancelled')`,
            [driver_id]
        );

        if (activeDriverAssignmentResult.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'Driver is already assigned to another active ride.' }
            };
            return;
        }

        // Check if vehicle is already assigned to another active ride
        const activeVehicleAssignmentResult = await db.query(
            `SELECT da.* FROM "driver_assigned" da
       JOIN "rides" r ON da.ride_id = r.ride_id
       WHERE da.vehicle_id = $1 AND r.status NOT IN ('completed', 'cancelled')`,
            [vehicle_id]
        );

        if (activeVehicleAssignmentResult.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'Vehicle is already assigned to another active ride.' }
            };
            return;
        }

        // Begin a transaction
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // Insert driver assignment
            const assignmentResult = await client.query(
                'INSERT INTO "driver_assigned" (ride_id, driver_id, vehicle_id, assigned_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
                [ride_id, driver_id, vehicle_id]
            );

            // Update ride status
            await client.query(
                'UPDATE "rides" SET status = $1 WHERE ride_id = $2',
                ['assigned', ride_id]
            );

            await client.query('COMMIT');

            context.res = {
                status: 200,
                body: {
                    message: 'Ride assigned successfully.',
                    assignment: assignmentResult.rows[0]
                }
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        context.log.error('Error assigning ride:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
}