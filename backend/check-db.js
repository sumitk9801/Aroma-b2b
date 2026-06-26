const { prisma } = require("./db/db");

async function main() {
    try {
        console.log("Checking database connection...");
        await prisma.$connect();
        console.log("Connected successfully!");

        console.log("Querying all tables in non-system schemas...");
        const tables = await prisma.$queryRaw`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
        `;
        
        console.log("Tables found:", tables);
        
        if (tables.length === 0) {
            console.log("⚠️ No tables exist in any schema in this database.");
        } else {
            console.log(`✅ Found ${tables.length} tables total.`);
        }
    } catch (err) {
        console.error("❌ Database connection/query failed:", err);
    }
}

main()
  .finally(() => prisma.$disconnect());
