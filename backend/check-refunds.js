const { prisma } = require("./db/db");

async function main() {
    const refunds = await prisma.refund.findMany();
    console.log("=== DB REFUNDS ===");
    console.log(JSON.stringify(refunds, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
