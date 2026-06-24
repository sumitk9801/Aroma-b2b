const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
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