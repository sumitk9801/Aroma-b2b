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
const productRequestRoute = require("./routes/productRequestRoute");
const customersRoute = require("./routes/customersRoute");
const suppliersRoute = require("./routes/suppliersRoute");
const damagedStockRoute = require("./routes/damagedStockRoute");

// ── V2 Intelligence & AI Routes ───────────────────────────────────────────────
const v2ForecastRoute        = require("./routes/v2/forecast.routes");
const v2IntelligenceRoute    = require("./routes/v2/intelligence.routes");
const v2RecommendationsRoute = require("./routes/v2/recommendations.routes");
const v2SignalsRoute         = require("./routes/v2/signals.routes");
const v2TrendsRoute          = require("./routes/v2/trends.routes");
const v2AssistantRoute       = require("./routes/v2/assistant.routes");



// Rate limiters to protect DB and server resources
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Limit each IP to 10000 requests per windowMs (high limit for development/B2B usage)
    message: {
        success: false,
        message: "Too many requests, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Limit each IP to 10000 requests per windowMs (high limit for development/B2B usage)
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
// Build the list of allowed origins
let allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://aroma-b2b.vercel.app"
];

if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    allowedOrigins = [...new Set([...allowedOrigins, ...envOrigins])];
}

app.use(cors({ // allow cross origin requests and responses from different domains
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.startsWith("http://localhost:") || 
                          origin.endsWith(".vercel.app");
                          
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-shop-id']
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
app.use("/api/v1/product-requests", productRequestRoute);
app.use("/api/v1/purchases", purchasesRoute);
app.use("/api/v1/sales", salesRoute);
app.use("/api/v1/stock-movements", stockMovementsRoute);
app.use("/api/v1/reports", reportsRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/uploads", uploadsRoute);
app.use("/api/v1/customers", customersRoute);
app.use("/api/v1/suppliers", suppliersRoute);
app.use("/api/v1/damaged-stock", damagedStockRoute);
app.use("/health", healthRoute);

// ── V2 Intelligence & AI Routes ───────────────────────────────────────────────
// All new modules use /api/v2/ namespace — v1 routes are never modified.
app.use("/api/v2/forecast",        v2ForecastRoute);
app.use("/api/v2/intelligence",    v2IntelligenceRoute);
app.use("/api/v2/recommendations", v2RecommendationsRoute);
app.use("/api/v2/signals",         v2SignalsRoute);
app.use("/api/v2/trends",          v2TrendsRoute);
app.use("/api/v2/assistant",       v2AssistantRoute);


// Mount the global error formatting middleware as the final interceptor in the Express stack
const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

module.exports = app;



