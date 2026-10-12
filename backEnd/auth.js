require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function requireJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        const err = new Error('JWT_SECRET is not set in environment');
        err.code = 'JWT_SECRET_MISSING';
        throw err;
    }
    return secret;
}

function tokenTtl() {
    return process.env.JWT_TTL || '7d';
}

function signToken(organizer) {
    return jwt.sign(
        { id: organizer.id, email: organizer.email, name: organizer.name },
        requireJwtSecret(),
        { expiresIn: tokenTtl() }
    );
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(header.slice(7), requireJwtSecret());
        req.organizer = {
            id: payload.id,
            email: payload.email,
            name: payload.name,
        };
        return next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

module.exports = {
    signToken,
    requireAuth,
    requireJwtSecret,
    hashPassword,
    verifyPassword,
};
