const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = require('./app');
const { Server } = require("socket.io");
const registerRefundSocket = require("./sockets/refundSocket");
const { registerDailyCron }  = require("./analytics/jobs/precompute.cron");
const { registerSignalsCron } = require("./analytics/jobs/signals.cron");
const { registerTrendsCron }  = require("./analytics/jobs/trends.cron");

const port = process.env.PORT || process.env.port || 3000;

const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://aroma-b2b.vercel.app"
];

if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    envOrigins.forEach(o => {
        if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
    });
}

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
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
        credentials: true
    }
});

registerRefundSocket(io);

// ── Nightly Analytics Pipeline ─────────────────────────────────────────────
// Pipeline execution order (IST):
//   23:30 → signals.cron.js   (V2.4: External signals ingestion)
//   23:59 → precompute.cron.js (V1: DailyShopMetrics + DailyProductPerformance)
//   00:15 → trends.cron.js   (V2.5: Product trend velocity scoring)
registerSignalsCron();  // V2.4 — External signals (weather, festival, holiday)
registerDailyCron();    // V1.0 — Nightly shop + product metrics precomputation
registerTrendsCron();   // V2.5 — Product trend detection pipeline

server.listen(port, () => {
    console.log("server is live on port " + port);
});