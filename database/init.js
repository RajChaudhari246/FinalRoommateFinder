/**
 * Roommate Finder - Automated Database Initializer
 */
require('dotenv').config();
const { pool, testConnection } = require('../backend/config/database');

async function initializeDatabase() {
  console.log('--- Roommate Finder: Database Initialization ---');

  try {
    await testConnection();
    const [tables] = await pool.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    console.log('✓ Tables verified in embedded database:');
    tables.forEach(row => {
      console.log(`  - ${row.name}`);
    });

    console.log('==================================================');
    console.log('Database initialization completed successfully!');
    console.log('==================================================');
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
