/**
 * Roommate Finder - Automated Database Initializer
 * Safely creates database (if not exists) and applies schema.sql
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  console.log('--- Roommate Finder: Database Initialization ---');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'roommate_finder';

  console.log(`Connecting to MySQL server at ${host}:${port} as user '${user}'...`);

  let rootConnection;
  try {
    // Try connecting directly to target database first (works with dedicated scoped users)
    try {
      rootConnection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        multipleStatements: true
      });
      console.log(`✓ Successfully connected to MySQL database '${database}'.`);
    } catch (directErr) {
      // If database doesn't exist yet, connect to server to create it
      rootConnection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        multipleStatements: true
      });
      console.log('✓ Successfully connected to MySQL server.');

      await rootConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      console.log(`✓ Verified database '${database}' exists.`);
      await rootConnection.changeUser({ database });
    }

    // Step 3: Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema queries
    console.log('Applying schema definitions...');
    await rootConnection.query(schemaSql);

    console.log('✓ Schema applied successfully. Tables created / verified:');
    const [tables] = await rootConnection.query('SHOW TABLES');
    tables.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });

    console.log('==================================================');
    console.log('Database initialization completed successfully!');
    console.log('You can now run "npm run db:seed" to load sample profiles, or start the server.');
    console.log('==================================================');

  } catch (err) {
    console.error('✗ Database initialization failed!');
    console.error(`Error code: ${err.code || 'UNKNOWN'}`);
    console.error(`Message: ${err.message}`);

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n[Troubleshooting]');
      console.error('Access denied for the specified MySQL user and password.');
      console.error('Please configure your credentials in the .env file:');
      console.error('  DB_USER=your_mysql_username');
      console.error('  DB_PASSWORD=your_mysql_password');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n[Troubleshooting]');
      console.error('Could not connect to MySQL server on host/port. Verify MySQL service is running.');
    }
    process.exit(1);
  } finally {
    if (rootConnection) {
      await rootConnection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
