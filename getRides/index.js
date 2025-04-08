const db = require('../db');
const { verifyToken } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Get rides function processed a request.');

    // Verify token
    if (!verifyToken(req, context)) {
        return;
    }

    try {
        const { id } = req.params;
        const { status, emp_id } = req.query;

        // If ID is provided, get a specific ride
        if (id) {
            const result = await db.query(
                `SELECT r.*, e.f_name, e.l_name, e.email, e.phone, 
          v.vehicle_name, v.vehicle_company,
          d.f_name as driver_fname, d.l_name as driver_lname, d.phone as driver_phone
        FROM "rides" r
        LEFT JOIN "employees" e ON r.emp_id = e.emp_id
        LEFT JOIN "driver_assigned" da ON r.ride_id = da.ride_id
        LEFT JOIN "drivers" d ON da.driver_id = d.driver_id
        LEFT JOIN "vehicles" v ON da.vehicle_id = v.vehicle_id
        WHERE r.ride_id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                context.res = {
                    status: 404,
                    body: { message: 'Ride not found.' }
                };
                return;
            }

            // Check if the user is authorized to view this ride
            if (!req.user.is_admin && req.user.id !== result.rows[0].emp_id) {
                context.res = {
                    status: 403,
                    body: { message: 'You are not authorized to view this ride.' }
                };
                return;
            }

            context.res = {
                status: 200,
                body: result.rows[0]
            };
            return;
        }

        // Build query based on filters
        let query = `
      SELECT r.*, e.f_name, e.l_name, e.email, e.phone
      FROM "rides" r
      JOIN "employees" e ON r.emp_id = e.emp_id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        // Filter by status
        if (status) {
            query += ` AND r.status = $${paramIndex++}`;
            params.push(status);
        }

        // Filter by employee ID or restrict to admin
        if (emp_id) {
            query += ` AND r.emp_id = $${paramIndex++}`;
            params.push(emp_id);
        } else if (!req.user.is_admin) {
            // Non-admin users can only see their own rides
            query += ` AND r.emp_id = $${paramIndex++}`;
            params.push(req.user.id);
        }

        // Order by creation date
        query += ' ORDER BY r.created_at DESC';

        // Execute query
        const result = await db.query(query, params);

        context.res = {
            status: 200,
            body: result.rows
        };
    } catch (error) {
        context.log.error('Error fetching rides:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
