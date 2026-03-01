"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireUser = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new errors_1.AuthenticationError('No token provided');
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (decoded.type === 'user') {
            req.user = decoded;
        }
        else if (decoded.type === 'admin') {
            req.admin = decoded;
        }
        else {
            throw new errors_1.AuthenticationError('Invalid token type');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const requireUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'User authentication required' });
    }
    next();
};
exports.requireUser = requireUser;
const requireAdmin = (req, res, next) => {
    if (!req.admin) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
