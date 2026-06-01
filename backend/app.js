const express = require('express');
const app = express();
const connectdb = require('./db/db.js');
const helmet = require('helmet');
// const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoute = require("./routes/authRoute");
const usersRoute = require("./routes/usersRoute");
const shopRoute = require("./routes/shopRoute");
const categoriesRoute = require("./routes/categoriesRoute");
const productRoute = require("./routes/productRoute");
const purchasesRoute = require("./routes/purchasesRoute");
const salesRoute = require("./routes/salesRoute");
const stockMovementsRoute = require("./routes/stock-movementsRoute");
const reportsRoute = require("./routes/reportsRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const uploadsRoute = require("./routes/uploadsRoute");
const healthRoute = require("./routes/healthRoute");


// Rate limiters to protect DB and server resources
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // Strict limit for auth/login/register to prevent brute-force attacks
    message: {
        success: false,
        message: "Too many authentication requests, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Database connection initialization
connectdb();

// Apply security middleware layers
app.use(helmet()); // Secure HTTP headers
app.use(cookieParser()); // Parse cookies from request headers
app.use(express.json({ limit: "10kb" })); // Body parser with body payload size limit
// app.use(xss()); // Sanitize request fields to protect DB against XSS injections
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(cors({ // allow cross origin requests and responses from different domains
    origin: ["http://localhost:5173", "http://localhost:5174"],    
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']

}));

// Mount the centralized request monitoring logger middleware
const requestLogger = require("./middleware/requestLogger");
app.use(requestLogger);

// Mount the centralized response formatting decorator middleware
const responseFormatter = require("./middleware/responseFormatter");
app.use(responseFormatter);



// Rate limiters routing
app.use("/api", generalLimiter);
app.use("/api/v1/auth", authLimiter);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/shops", shopRoute);
app.use("/api/v1/categories", categoriesRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/purchases", purchasesRoute);
app.use("/api/v1/sales", salesRoute);
app.use("/api/v1/stock-movements", stockMovementsRoute);
app.use("/api/v1/reports", reportsRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/uploads", uploadsRoute);
app.use("/health", healthRoute);

// Mount the global error formatting middleware as the final interceptor in the Express stack
const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

module.exports = app;



