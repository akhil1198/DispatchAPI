const db = require('../db');
const { generateToken } = require('../shared/middleware/auth');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {
    context.log('Login function processed a request.');

    try {
        const { email, password } = req.body;
        console.log(req.body)

        // Validate required fields
        if (!email || !password) {
            context.res = {
                status: 400,
                body: { message: 'Email and password are required.' }
            };
            return;
        }
        console.log(email, password)
        // Find employee by email
        const result = await db.query(
            'SELECT * FROM "employees" WHERE email = $1',
            [email]
        );


        if (result && result.rows.length === 0) {
            console.log("result = ", result.rows.length)

            context.res = {
                status: 401,
                body: { message: 'Invalid email or password.' }
            };
            return;
        }

        const employee = result.rows[0];

        // Check if employee has a password (might be first login)
        if (!employee.password) {
            context.res = {
                status: 401,
                body: { message: 'Please use the signup process to set your password.' }
            };
            return;
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            context.res = {
                status: 401,
                body: { message: 'Invalid email or password.' }
            };
            return;
        }

        // Generate JWT token
        const token = generateToken(employee);
        context.res = {
            status: 200,
            body: {
                token,
                employee: {
                    id: employee.emp_id,
                    email: employee.email,
                    f_name: employee.f_name,
                    l_name: employee.l_name,
                    role: employee.role,
                    is_admin: employee.is_admin
                }
            }
        };
    } catch (error) {
        context.log.error('Error during login:', error);
        context.res = {
            status: 500,
            body: { message: 'Internal server error.' }
        };
    }
};
