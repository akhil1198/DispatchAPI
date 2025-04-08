const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.emp_id,
            email: user.email,
            role: user.role,
            is_admin: user.is_admin
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

// Verify JWT token middleware
const verifyToken = (req, context) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        context.res = {
            status: 401,
            body: { message: 'Access denied. No token provided.' }
        };
        context.done();
        return false;
    }

    try {
        const token = authHeader.split(' ')[1]; // Bearer <token>
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return true;
    } catch (error) {
        context.res = {
            status: 401,
            body: { message: 'Invalid token.' }
        };
        context.done();
        return false;
    }
};

// Check if user is admin
const isAdmin = (req, context) => {
    if (!req.user || !req.user.is_admin) {
        context.res = {
            status: 403,
            body: { message: 'Access denied. Admin privileges required.' }
        };
        context.done();
        return false;
    }
    return true;
};

module.exports = {
    generateToken,
    verifyToken,
    isAdmin
};