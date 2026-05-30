const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
    try {
        // Validate request body, query, and params against the Zod schema
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        
        // Coerce/assign the validated data back to req objects
        req.body = parsed.body || req.body;
        req.query = parsed.query || req.query;
        req.params = parsed.params || req.params;
        
        next();
        } catch (err) {
        if (err instanceof ZodError) {
            const errorList = err.errors || err.issues;
            const errors = errorList.map(e => ({
                field: e.path.slice(1).join("."), // removes 'body'/'query' prefix from path
                message: e.message
            }));
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors
            });
        }
        next(err);
    }
};

module.exports = validate;
