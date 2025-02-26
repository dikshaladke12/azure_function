const jwt = require('jsonwebtoken');
require('dotenv').config();

function verify_token(authHeader) {
    if (!authHeader) {
        throw new Error('Authorization token is required.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error('Invalid token format.');
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired token.');
    }
}

module.exports = { verify_token };
