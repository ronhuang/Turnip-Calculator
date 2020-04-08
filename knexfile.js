// Update with your config settings.

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3",
    },
  },

  production: {
    client: "mysql",
    connection: {
      host: process.env.DATABASE_HOST,
      database: "turnip_calculator",
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    },
  },
};
