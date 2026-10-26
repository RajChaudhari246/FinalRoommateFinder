/**
 * Roommate Finder - Automated Database Initializer
 * Creates the SQLite database file and executes schema.sql to build all tables and indexes.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR = path.join(__dirname);
const SQLITE_FILE = process.env.SQLITE_PATH || path.join(DB_DIR, 'roommate.sqlite');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

async function initializeDatabase() {
  console.log('==================================================');
  console.log('--- Roommate Finder: SQLite Database Initializer ---');
  console.log('==================================================');
  console.log(`Database path: ${SQLITE_FILE}`);
  console.log(`Schema file:   ${SCHEMA_FILE}`);

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found at: ${SCHEMA_FILE}`);
    }

    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');

    console.log('[Init] Opening SQLite database connection...');
    const db = await open({
      filename: SQLITE_FILE,
      driver: sqlite3.Database
    });

    await db.run('PRAGMA foreign_keys = ON;');
    await db.run('PRAGMA journal_mode = WAL;');

    console.log('[Init] Executing schema.sql DDL script...');
    await db.exec(schemaSql);

    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");

    console.log('\n✓ SQLite database and tables verified successfully:');
    tables.forEach(row => {
      console.log(`  - Table: ${row.name}`);
    });

    const indexes = await db.all("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name");
    console.log('\n✓ Indexes created:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name} on ${idx.tbl_name}`);
    });

    await db.close();

    console.log('\n==================================================');
    console.log('✓ SQLite database initialized successfully from schema.sql!');
    console.log('==================================================\n');
    return true;
  } catch (err) {
    console.error('\n✗ Database initialization failed:', err.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
