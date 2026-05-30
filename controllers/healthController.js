const healthService = require("../services/healthService");

const checkHealth = async (req, res) => {
    try {
        await healthService.checkHealth();
        res.status(200).json({
            success: true,
            status: "UP",
            message: "Database and server are healthy",
            timestamp: new Date()
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            status: "DOWN",
            message: "Database connection failed",
            error: err.message,
            timestamp: new Date()
        });
    }
};

module.exports = { checkHealth };
