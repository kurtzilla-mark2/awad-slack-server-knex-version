require('dotenv').config({ silent: true });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      host: process.env.DB_HOST
    },
    DEBUG: true
  },
  production: {
    client: 'pg',
    connection: {
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      host: process.env.DB_HOST
    }
  },
  migrations: {
    directory: './migrations',
    tableName: '_migrations'
  },
  seeds: {
    directory: './seeds/dev'
  }
};
