// src/functions/drivers/deleteDriver/index.js
const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Delete Driver function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { id } = req.params;

        // Check if driver exists
        const existingDriver = await db.query(
            'SELECT * FROM "drivers" WHERE driver_id = $1',
            [id]
        );

        if (existingDriver.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Driver not found.' }
            };
            return;
        }

        // Check if driver is assigned to any active rides
        const activeAssignmentResult = await db.query(
            `SELECT da.* FROM "driver_assigned" da
       JOIN "rides" r ON da.ride_id = r.ride_id
       WHERE da.driver_id = $1 AND r.status NOT IN ('completed', 'cancelled')`,
            [id]
        );

        if (activeAssignmentResult.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'Cannot delete driver with active ride assignments.' }
            };
            return;
        }

        // Delete driver
        await db.query(
            'DELETE FROM "drivers" WHERE driver_id = $1',
            [id]
        );

        context.res = {
            status: 200,
            body: { message: 'Driver deleted successfully.' }
        };
    } catch (error) {
        context.log.error('Error deleting driver:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};