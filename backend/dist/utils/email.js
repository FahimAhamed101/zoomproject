"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendEmailVerificationEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpPort = Number(process.env.SMTP_PORT || 587);
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html,
        });
    }
    catch (error) {
        console.error('Email sending failed:', error);
    }
};
exports.sendEmail = sendEmail;
const sendEmailVerificationEmail = (email, verificationLink) => {
    return (0, exports.sendEmail)(email, 'Verify Your Email', `
      <h2>Welcome to Zoomit!</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `);
};
exports.sendEmailVerificationEmail = sendEmailVerificationEmail;
const sendPasswordResetEmail = (email, resetLink) => {
    return (0, exports.sendEmail)(email, 'Reset Your Password', `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `);
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
