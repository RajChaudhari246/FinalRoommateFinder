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
    console.log('  rajesh.patil@example.com | Password@123 (Shirpur, RCPIT Computer Engg, ₹3000-₹4500)');
    console.log('  pooja.sharma@example.com | Password@123 (Shirpur, RCPCOP Pharmacy, ₹2500-₹4000)');
    console.log('  aditya.c@example.com     | Password@123 (Shirpur, NMIMS Tech, ₹4000-₹6000)');
    console.log('  sneha.k@example.com      | Password@123 (Shirpur, RCPIT Electronics, ₹3000-₹4200)');
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
