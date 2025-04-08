const db = require('../db');
const { generateToken } = require('../shared/middleware/auth');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {
    context.log('Signup function processed a request.');

    try {
        const { email, password, f_name, l_name, phone } = req.body;

        // Validate required fields
        if (!email || !password || !f_name || !l_name || !phone) {
            context.res = {
                status: 400,
                body: { message: 'All fields are required.' }
            };
            return;
        }

        // Check if email exists
        const existingUser = await db.query(
            'SELECT * FROM "employees" WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            // If employee exists but no password (invited by admin)
            const employee = existingUser.rows[0];
            if (!employee.password) {
                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Update employee with password
                const result = await db.query(
                    'UPDATE "employees" SET password = $1 WHERE emp_id = $2 RETURNING *',
                    [hashedPassword, employee.emp_id]
                );

                // Generate token
                const token = generateToken(result.rows[0]);

                context.res = {
                    status: 200,
                    body: {
                        message: 'Account setup complete',
                        token,
                        employee: {
                            id: result.rows[0].emp_id,
                            email: result.rows[0].email,
                            f_name: result.rows[0].f_name,
                            l_name: result.rows[0].l_name,
                            role: result.rows[0].role,
                            is_admin: result.rows[0].is_admin
                        }
                    }
                };
                return;
            }

            context.res = {
                status: 400,
                body: { message: 'Email already registered.' }
            };
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("hashedpass = ", hashedPassword)
        // Insert new employee (self-registered employees are not admins by default)
        const result = await db.query(
            'INSERT INTO "employees" (f_name, l_name, email, phone, role, is_admin, password, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
            [f_name, l_name, email, phone, 'employee', false, hashedPassword]
        );

        // Generate token
        const token = generateToken(result.rows[0]);

        context.res = {
            status: 201,
            body: {
                message: 'Registration successful',
                token,
                employee: {
                    id: result.rows[0].emp_id,
                    email: result.rows[0].email,
                    f_name: result.rows[0].f_name,
                    l_name: result.rows[0].l_name,
                    role: result.rows[0].role,
                    is_admin: result.rows[0].is_admin
                }
            }
        };
    } catch (error) {
        context.log.error('Error during signup:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};