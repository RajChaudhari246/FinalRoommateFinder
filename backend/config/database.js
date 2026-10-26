/**
 * Database Configuration & Connection Pool
 * Uses mysql2/promise for async/await queries and connection pooling.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'roommate_finder',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true
};

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
