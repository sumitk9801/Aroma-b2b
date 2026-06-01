const { ZodError } = require("zod");
const ApiError = require("../utils/ApiError");
const Logger = require("../utils/logger");

/**
 * Global Express error handling middleware.
 * Intercepts all operational, validation, database, and generic runtime exceptions.
 */
const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];
    let success = false;

    // Log the error detailed context with stack trace automatically
    Logger.error(err.message || "Generic Exception Captured", err.stack);

    // Handle Zod Schema Validation errors
    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation failed";
        const errorList = err.errors || err.issues;
        errors = errorList.map(e => ({
            field: e.path.slice(1).join("."), // removes 'body'/'query' prefix
            message: e.message
        }));
    }
    // Handle standard operational ApiErrors
    else if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    // Clean details for database exceptions to prevent raw DB leakage
    else if (err.name && (err.name.startsWith("PrismaClient") || err.name.includes("Prisma"))) {
        statusCode = 400;
        message = "An unexpected database error occurred. Please try again.";
        errors = [];
    }
    // Handle all other unhandled runtime or programming exceptions (e.g. TypeError, ReferenceError)
    else {
        statusCode = 500;
        message = "Something went wrong. Please try again.";
        errors = [];
    }

    const response = {
        success,
        message,
        errors
    };

    // Attach stack trace only in development configurations
    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
