const ApiResponse = require("../utils/ApiResponse");

/**
 * Express middleware that decorates the response (res) object with helper methods.
 * Ensures consistent execution of the centralized response format.
 */
const responseFormatter = (req, res, next) => {
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
