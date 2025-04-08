const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Delete Vehicle function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { id } = req.params;

        // Check if vehicle exists
        const existingVehicle = await db.query(
            'SELECT * FROM "vehicles" WHERE vehicle_id = $1',
            [id]
        );

        if (existingVehicle.rows.length === 0) {
            context.res = {
                status: 404,
                body: { message: 'Vehicle not found.' }
            };
            return;
        }

        // Check if vehicle is assigned to any active rides
        const activeAssignmentResult = await db.query(
            `SELECT da.* FROM "driver_assigned" da
       JOIN "rides" r ON da.ride_id = r.ride_id
       WHERE da.vehicle_id = $1 AND r.status NOT IN ('completed', 'cancelled')`,
            [id]
        );

        if (activeAssignmentResult.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'Cannot delete vehicle with active ride assignments.' }
            };
            return;
        }

        // Delete vehicle
        await db.query(
            'DELETE FROM "vehicles" WHERE vehicle_id = $1',
            [id]
        );

        context.res = {
            status: 200,
            body: { message: 'Vehicle deleted successfully.' }
        };
    } catch (error) {
        context.log.error('Error deleting vehicle:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};