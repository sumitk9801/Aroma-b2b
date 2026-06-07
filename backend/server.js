const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = require('./app');
const { Server } = require("socket.io");
const registerRefundSocket = require("./sockets/refundSocket");
const { registerDailyCron } = require("./analytics/jobs/precompute.cron");

const port = process.env.PORT || process.env.port || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true
    }
});

registerRefundSocket(io);

// Register nightly analytics precomputation job (runs at 23:59 IST every day)
registerDailyCron();

server.listen(port, () => {
    console.log("server is live on port " + port);
});