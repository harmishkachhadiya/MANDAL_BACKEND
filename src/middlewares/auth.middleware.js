const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Format: Bearer <token>
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid Token' });
        }
        
        // Add the user payload to the request
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
