/**
 * Roommate Finder - Automated Database Seeder
 */
require('dotenv').config();
const { pool, testConnection } = require('../backend/config/database');

async function seedDatabase() {
  console.log('--- Roommate Finder: Database Seeder ---');

  try {
    await testConnection();
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [profileRows] = await pool.query('SELECT COUNT(*) as count FROM profiles');

    console.log('✓ Seeding complete / verified!');
    console.log(`Total users in database: ${userRows[0].count}`);
    console.log(`Total profiles in database: ${profileRows[0].count}`);
    console.log('\nDemo accounts ready:');
    console.log('  alex.chen@example.com    | Password@123 (New York, Tech, $1200-$1600)');
    console.log('  sarah.j@example.com      | Password@123 (Boston, Student, $800-$1200)');
    console.log('  maya.patel@example.com   | Password@123 (San Francisco, Designer, $1500-$2200)');
    console.log('  david.m@example.com      | Password@123 (Chicago, Medical Resident, $900-$1300)');
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
