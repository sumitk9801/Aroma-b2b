module.exports = {
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/aroma_b2b",
  },
};
