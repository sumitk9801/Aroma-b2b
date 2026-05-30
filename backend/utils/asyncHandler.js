/**
 * A higher-order function that wraps asynchronous Express controllers.
 * Automatically catches Promise rejections and forwards them to the global error middleware.
 * @param {function} requestHandler - The asynchronous controller handler function.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

module.exports = asyncHandler;
