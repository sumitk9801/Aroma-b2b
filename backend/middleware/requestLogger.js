const logger = require("../utils/logger");

/**
 * Express middleware that intercepts incoming HTTP calls.
 * Logs execution duration, request parameters, source IP, and browser context.
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
        const userAgent = req.headers["user-agent"] || "Unknown";
        const method = req.method;
        const url = req.originalUrl || req.url;
        const status = res.statusCode;

        logger.info(`${method} ${url} | Status: ${status} | IP: ${ip} | Duration: ${duration}ms | UA: ${userAgent}`);
    });

    next();
};

module.exports = requestLogger;
