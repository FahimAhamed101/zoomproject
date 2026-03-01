"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof errors_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }
    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
