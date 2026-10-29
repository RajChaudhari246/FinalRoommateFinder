/**
 * Quick Database Viewer Utility
 * Displays all records from SQLite in formatted console tables.
 */
require('dotenv').config();
const { pool } = require('../backend/config/database');

async function viewDatabase() {
  console.log('\n==================================================');
  console.log('         ROOMMATE FINDER - DATABASE VIEWER        ');
  console.log('==================================================\n');

  try {
    // 1. Users
    console.log('📌 USERS TABLE:');
    const [users] = await pool.query('SELECT id, full_name, email, role, account_status, created_at FROM users');
    console.table(users);

    // 2. Profiles
    console.log('\n📌 PROFILES TABLE:');
    const [profiles] = await pool.query(`
      SELECT user_id, city, preferred_location, min_budget, max_budget, 
             food_preference, smoking_preference, study_schedule, sleeping_schedule, is_complete 
      FROM profiles
    `);
    console.table(profiles);

    // 3. Preferences
    console.log('\n📌 PREFERENCES TABLE:');
    const [preferences] = await pool.query(`
      SELECT user_id, preferred_location, min_budget, max_budget, 
             preferred_food, preferred_smoking_status, preferred_study_schedule 
      FROM preferences
    `);
    console.table(preferences);

    // 4. Interests
    console.log('\n📌 INTERESTS TABLE (Connection Requests):');
    const [interests] = await pool.query('SELECT id, sender_user_id, receiver_user_id, status, message, created_at FROM interests');
    if (interests.length === 0) {
      console.log('  (No interest requests sent yet)');
    } else {
      console.table(interests);
    }

    console.log('\n==================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Error viewing database:', err.message);
    process.exit(1);
  }
}

viewDatabase();
