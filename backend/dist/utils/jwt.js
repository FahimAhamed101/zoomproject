"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPasswordResetToken = exports.verifyEmailToken = exports.verifyToken = exports.generatePasswordResetToken = exports.generateEmailVerificationToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const generateToken = (payload, expiresIn = '24h') => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
};
exports.generateToken = generateToken;
const generateEmailVerificationToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'email-verification' }, JWT_SECRET, { expiresIn: '24h' });
};
exports.generateEmailVerificationToken = generateEmailVerificationToken;
const generatePasswordResetToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
const verifyEmailToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'email-verification') {
            throw new Error('Invalid token type');
        }
        return { userId: decoded.userId };
    }
    catch (error) {
        throw new Error('Invalid email verification token');
    }
};
exports.verifyEmailToken = verifyEmailToken;
const verifyPasswordResetToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'password-reset') {
            throw new Error('Invalid token type');
        }
        return { userId: decoded.userId };
    }
    catch (error) {
        throw new Error('Invalid password reset token');
    }
};
exports.verifyPasswordResetToken = verifyPasswordResetToken;
