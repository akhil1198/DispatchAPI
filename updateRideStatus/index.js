// src/functions/rides/updateRideStatus/index.js
const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Update Ride Status function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate required fields
        if (!status) {
            context.res = {
                status: 400,
                body: { message: 'Status is required.' }
            };
            return;
        }

        // Validate status
        const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            context.res = {
                status: 400,
                body: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` }
            };
            return;
        }

        // Verify the ride exists
        const rideResult = await db.query(
            'SELECT r.*, da.driver_id FROM "rides" r LEFT JOIN "driver_assigned" da ON r.ride_id = da.ride_id WHERE r.ride_id = $1',
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

        // Check authorization: only admins, assigned drivers, or the ride owner can update status
        if (!req.user.is_admin && req.user.id !== ride.emp_id && req.user.id !== ride.driver_id) {
            context.res = {
                status: 403,
                body: { message: 'You are not authorized to update this ride.' }
            };
            return;
        }

        // Validate status transition
        const currentStatus = ride.status;
        let isValidTransition = false;

        switch (currentStatus) {
            case 'pending':
                isValidTransition = ['assigned', 'cancelled'].includes(status);
                break;
            case 'assigned':
                isValidTransition = ['in_progress', 'cancelled'].includes(status);
                break;
            case 'in_progress':
                isValidTransition = ['completed', 'cancelled'].includes(status);
                break;
            case 'completed':
            case 'cancelled':
                isValidTransition = false; // Terminal states
                break;
        }

        if (!isValidTransition && !req.user.is_admin) {
            context.res = {
                status: 400,
                body: { message: `Cannot transition from "${currentStatus}" to "${status}". Invalid state transition.` }
            };
            return;
        }

        // Update ride status
        const updateFields = ['status'];
        const updateValues = [status];
        let paramIndex = 2; // Start with 2 because $1 is for the ride_id

        // If status is in_progress, set ride_start_time
        if (status === 'in_progress') {
            updateFields.push('ride_start_time');
            updateValues.push('NOW()');
        }

        // If status is completed, set ride_end_time
        if (status === 'completed') {
            updateFields.push('ride_end_time');
            updateValues.push('NOW()');
        }

        // Build the query
        let query = `UPDATE "rides" SET ${updateFields.map((field, i) =>
            field === 'ride_start_time' || field === 'ride_end_time'
                ? `${field} = ${updateValues[i]}`
                : `${field} = ${i + 1}`
        ).join(', ')} WHERE ride_id = ${paramIndex} RETURNING *`;

        // Filter out non-parameter values (NOW())
        const params = updateValues.filter(value => value !== 'NOW()');
        params.push(id);

        const result = await db.query(query, params);

        context.res = {
            status: 200,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error updating ride status:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};