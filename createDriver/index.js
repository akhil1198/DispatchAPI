// src/functions/drivers/createDriver/index.js
const db = require('../db');
const { verifyToken, isAdmin } = require('../shared/middleware/auth');

module.exports = async function (context, req) {
    context.log('Create Driver function processed a request.');

    // Verify token and admin privileges
    if (!verifyToken(req, context) || !isAdmin(req, context)) {
        return;
    }

    try {
        const { f_name, l_name, email, phone, role } = req.body;

        // Validate required fields
        if (!f_name || !l_name || !email || !phone) {
            context.res = {
                status: 400,
                body: { message: 'All fields are required.' }
            };
            return;
        }

        // Check if email already exists
        const existingDriver = await db.query(
            'SELECT * FROM "drivers" WHERE email = $1',
            [email]
        );

        if (existingDriver.rows.length > 0) {
            context.res = {
                status: 400,
                body: { message: 'Email already exists.' }
            };
            return;
        }

        // Insert new driver
        const result = await db.query(
            'INSERT INTO "drivers" (f_name, l_name, email, phone, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [f_name, l_name, email, phone, role || 'driver']
        );

        context.res = {
            status: 201,
            body: result.rows[0]
        };
    } catch (error) {
        context.log.error('Error creating driver:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};