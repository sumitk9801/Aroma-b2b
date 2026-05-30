const { prisma } = require("../db/db");

const checkHealth = async () => {
    // Run basic select 1 to test db link
    await prisma.$queryRaw`SELECT 1`;
    return true;
};

module.exports = { checkHealth };
