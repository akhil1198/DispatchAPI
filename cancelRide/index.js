// src/functions/rides/cancelRide/index.js
const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Cancel Ride function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;

        // Verify the ride exists
        const rideResult = await db.query(
            'SELECT * FROM "rides" WHERE ride_id = $1',
            [id]
        );

        if (rideResult.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Ride not found.' }
            };
            return;
        }

        const ride = rideResult.rows[0];

        // Check if the ride is already in a terminal state
        if (ride.status === 'completed' || ride.status === 'cancelled') {
            context.res = {
                status: 400,
                body: { message: `Cannot cancel a ride with status "${ride.status}".` }
            };
            return;
        }

        // Check authorization: only admins or the ride owner can cancel
        if (!req.user.is_admin && req.user.id !== ride.emp_id) {
            context.res = {
                status: 403,
                body: { message: 'You are not authorized to cancel this ride.' }
            };
            return;
        }

        // Update ride status to cancelled
        const result = await db.query(
            'UPDATE "rides" SET status = $1 WHERE ride_id = $2 RETURNING *',
            ['cancelled', id]
        );

        context.res = {
            status: 200,
            body: {
                message: 'Ride cancelled successfully.',
                ride: result.rows[0]
            }
        };
    } catch (error) {
        context.log.error('Error cancelling ride:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};