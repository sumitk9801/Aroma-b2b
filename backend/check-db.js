const { prisma } = require("./db/db");

async function main() {
    const user = await prisma.user.findUnique({
        where: { id: "0051cff9-38ad-416f-84b7-10b9b498b16d" }
    });
    console.log("USER:", user);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
