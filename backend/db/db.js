const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/aroma_b2b";

// Enable SSL configuration for Neon Postgres or if sslmode=require is present
const isNeon = connectionString.includes("neon.tech") || connectionString.includes("sslmode=require");
const pool = new Pool({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : false
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connectdb = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected successfully");
    } catch (err) {
        console.log("Database connection failed:", err.message);
    }
}

module.exports = connectdb;
module.exports.prisma = prisma;
