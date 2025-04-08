const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Update Vehicle function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { id } = req.params;
        const { vehicle_name, vehicle_company } = req.body;

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

        // Build SET clause and params array dynamically
        let setClause = [];
        let params = [];
        let paramIndex = 1;

        if (vehicle_name) {
            setClause.push(`vehicle_name = $${paramIndex++}`);
            params.push(vehicle_name);
        }

        if (vehicle_company) {
            setClause.push(`vehicle_company = $${paramIndex++}`);
            params.push(vehicle_company);
        }

        // Add ID as the last parameter
        params.push(id);

        // Update vehicle
        const result = await db.query(
            `UPDATE "vehicles" SET ${setClause.join(', ')} WHERE vehicle_id = $${paramIndex} RETURNING *`,
            params
        );

        context.res = {
            status: 200,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error updating vehicle:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};