require('dotenv').config();

const dbPort = Number(process.env.DB_PORT || 5432);
const useSsl = process.env.DB_SSL === 'true'
  || dbPort === 6543
  || process.env.DB_HOST?.includes('supabase.com');

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'lentera-al-husna',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'lentera_test_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  production: {
    ...(process.env.DATABASE_URL ? { use_env_variable: 'DATABASE_URL' } : {}),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: process.env.DATABASE_URL || useSsl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  },
};
