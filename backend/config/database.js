/**
 * Database Configuration & Connection Pool
 * Uses mysql2/promise for async/await queries and connection pooling.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

let dbConfig = {};

const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionString) {
  try {
    const parsed = new URL(connectionString);
    dbConfig = {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true
    };
  } catch (err) {
    console.warn('[Database] Could not parse DATABASE_URL, using individual env vars:', err.message);
  }
}

if (!dbConfig.host) {
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roommate_finder',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true
  };
}

// Enable SSL if requested or if connecting to a remote host in production (e.g. cloud MySQL)
const isRemoteHost = dbConfig.host && !['localhost', '127.0.0.1'].includes(dbConfig.host);
if (process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && isRemoteHost)) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

// Helper function to test connection without exposing credentials
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected to MySQL (${dbConfig.database} at ${dbConfig.host}:${dbConfig.port})`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[Database Error] Failed to connect: ${error.message} (Code: ${error.code || 'UNKNOWN'})`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  dbConfig
};
