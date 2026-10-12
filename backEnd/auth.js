const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = process.env.JWT_TTL || '7d';

function requireJwtSecret() {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not set in environment');
    }
    return JWT_SECRET;
}

function signToken(organizer) {
    return jwt.sign(
        { id: organizer.id, email: organizer.email, name: organizer.name },
        requireJwtSecret(),
        { expiresIn: TOKEN_TTL }
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
    hashPassword,
    verifyPassword,
};
