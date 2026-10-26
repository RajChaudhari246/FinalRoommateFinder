/**
 * Roommate Finder - Automated Database Seeder
 * Populates database with realistic sample roommate profiles
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seedDatabase() {
  console.log('--- Roommate Finder: Database Seeder ---');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'roommate_finder';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true
    });

    console.log(`Connected to database '${database}'. Applying seed data...`);

    const seedPath = path.join(__dirname, 'seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`);
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);

    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [profileRows] = await connection.query('SELECT COUNT(*) as count FROM profiles');

    console.log('✓ Seeding complete!');
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
