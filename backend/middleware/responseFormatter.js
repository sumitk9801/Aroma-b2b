const ApiResponse = require("../utils/ApiResponse");

/**
 * Express middleware that decorates the response (res) object with helper methods.
 * Ensures consistent execution of the centralized response format.
 */
const responseFormatter = (req, res, next) => {
    // Intercept res.json to sanitize technical details from error messages
    const originalJson = res.json;
    res.json = function (body) {
        if (body && typeof body === 'object') {
            if (body.success === false && typeof body.message === 'string') {
                const lowerMsg = body.message.toLowerCase();
                
                // If it is a technical Prisma / Database / SQL error
                if (
                    lowerMsg.includes('prisma') ||
                    lowerMsg.includes('database') ||
                    lowerMsg.includes('sql') ||
                    lowerMsg.includes('invocation') ||
                    lowerMsg.includes('unique constraint') ||
                    lowerMsg.includes('foreign key') ||
                    lowerMsg.includes('connectdb')
                ) {
                    body.message = 'An unexpected database error occurred. Please try again.';
                } 
                // If it's a leaked code system path or method error
                else if (
                    body.message.includes('\\') || 
                    body.message.includes('/') || 
                    lowerMsg.includes('service') || 
                    lowerMsg.includes('controller') ||
                    lowerMsg.includes('typeerror') ||
                    lowerMsg.includes('referenceerror') ||
                    lowerMsg.includes('syntaxerror')
                ) {
                    body.message = 'Something went wrong. Please try again.';
                }
            }

            // Remove stack traces in production
            if (process.env.NODE_ENV !== 'development' && body.stack) {
                delete body.stack;
            }
        }
        return originalJson.call(this, body);
    };

    /**
     * Sends a standardized HTTP 200 OK success response.
     * @param {*} data - Payload object/array.
     * @param {string} [message="Success"] - Short description message.
     */
    res.ok = (data, message = "Success") => {
        const response = new ApiResponse(200, data, message);
        return res.status(200).json(response);
    };

    /**
     * Sends a standardized HTTP 201 Created success response.
     * @param {*} data - Payload object/array.
     * @param {string} [message="Resource created successfully"] - Short description message.
     */
    res.created = (data, message = "Resource created successfully") => {
        const response = new ApiResponse(201, data, message);
        return res.status(201).json(response);
    };

    next();
};

module.exports = responseFormatter;
