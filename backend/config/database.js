/**
 * Database Layer - Embedded SQLite Engine
 * Provides a zero-configuration, file-based database (acting like an H2 database for Node.js)
 * with an async/await query/execute wrapper that matches mysql2's [rows, fields] return signature.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const DB_DIR = path.join(__dirname, '../../database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const SQLITE_FILE = process.env.SQLITE_PATH || path.join(DB_DIR, 'roommate.sqlite');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

let dbInstance = null;
let initPromise = null;

/**
 * Sanitizes input parameters for SQLite compatibility:
 * - Converts boolean true/false to integer 1/0
 * - Converts undefined to null to prevent bind errors
 */
function sanitizeParams(params) {
  if (!params) return [];
  const list = Array.isArray(params) ? params : [params];
  return list.map(val => {
    if (val === true) return 1;
    if (val === false) return 0;
    if (val === undefined) return null;
    return val;
  });
}

/**
 * Translates common MySQL dialect expressions into SQLite compatible SQL:
 * - Converts `INSERT IGNORE INTO` to `INSERT OR IGNORE INTO`
 */
function sanitizeSql(sql) {
  return sql
    .replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT OR IGNORE INTO')
    .replace(/BOOLEAN/gi, 'INTEGER')
    .replace(/TRUE/gi, '1')
    .replace(/FALSE/gi, '0');
}

/**
 * Returns the open SQLite database connection with WAL mode and Foreign Keys enabled.
 * Automatically runs schema.sql if the database is newly created or empty.
 */
async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const db = await open({
        filename: SQLITE_FILE,
        driver: sqlite3.Database
      });

      // Enable Write-Ahead Logging (WAL) for high concurrency and foreign keys for integrity
      await db.run('PRAGMA journal_mode = WAL;');
      await db.run('PRAGMA foreign_keys = ON;');

      // Auto-initialize schema if tables do not exist
      const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      if (!tableCheck) {
        if (fs.existsSync(SCHEMA_FILE)) {
          const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
          await db.exec(schemaSql);
        }
      }

      // Check if demo seed is needed
      try {
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount && userCount.count === 0) {
          await seedDemoData(db);
        }
      } catch (e) {
        // Ignore table check errors during initialization
      }

      dbInstance = db;
      return db;
    })();
  }

  return initPromise;
}

/**
 * Seed demo profiles if the database is empty
 */
async function seedDemoData(db) {
  try {
    const hash = '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm'; // Password@123
    const demoUsers = [
      [1, 'Rajesh Patil', 'rajesh.patil@example.com', hash, 'active'],
      [2, 'Pooja Sharma', 'pooja.sharma@example.com', hash, 'active'],
      [3, 'Aditya Chaudhari', 'aditya.c@example.com', hash, 'active'],
      [4, 'Sneha Kulkarni', 'sneha.k@example.com', hash, 'active'],
      [5, 'Rohit Deshmukh', 'rohit.d@example.com', hash, 'active'],
      [6, 'Neha Marathe', 'neha.m@example.com', hash, 'active'],
      [7, 'Chetan Ahire', 'chetan.a@example.com', hash, 'active'],
      [8, 'Priyanka Mali', 'priyanka.m@example.com', hash, 'active']
    ];

    for (const u of demoUsers) {
      await db.run(
        'INSERT OR IGNORE INTO users (id, full_name, email, password_hash, account_status) VALUES (?, ?, ?, ?, ?)',
        u
      );
    }

    const demoProfiles = [
      [1, 21, 'Male', 'Shirpur', 'Karwand Naka / RCPIT Campus', 'R. C. Patel Institute of Technology (RCPIT), Shirpur', 3000.0, 4500.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Final year Computer Engineering student at RCPIT Shirpur. Focused on studies, quiet room, pure veg, and keeps common areas organized.', 1],
      [2, 20, 'Female', 'Shirpur', 'Nimzari Naka / Subhash Nagar', 'R. C. Patel Institute of Pharmacy (RCPCOP), Shirpur', 2500.0, 4000.0, 'vegetarian', 'non-smoker', 'non-drinker', 'late-night', 'night-owl', 'moderate', 2, 'B.Pharm student at RCPCOP Shirpur. Friendly and studious. Looking for a female roommate for a shared flat near Nimzari Naka.', 1],
      [3, 22, 'Male', 'Shirpur', 'NMIMS Campus / Mukesh Patel Park', 'NMIMS Mukesh Patel School of Technology, Shirpur', 4000.0, 6000.0, 'any', 'non-smoker', 'non-drinker', 'afternoon', 'flexible', 'very-clean', 1, 'B.Tech IT student at NMIMS Shirpur. Looking for a neat, disciplined flatmate near Mukesh Patel Park area. Non-smoker only.', 1],
      [4, 21, 'Female', 'Shirpur', 'Karwand Naka / R. C. Patel Area', 'RCPIT Shirpur', 3000.0, 4200.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Electronics student at RCPIT. Early riser, respectful of personal space and study schedule. Looking for a clean shared room.', 1],
      [5, 23, 'Male', 'Shirpur', 'Shahada Road / College Corner', 'H. R. Patel Institute, Shirpur', 2500.0, 3800.0, 'non-vegetarian', 'non-smoker', 'occasional', 'late-night', 'night-owl', 'moderate', 1, 'MBA student in Shirpur. Easygoing, loves cricket and fitness, cooperative with sharing room rent and daily expenses.', 1],
      [6, 20, 'Female', 'Shirpur', 'NMIMS Campus Area', 'NMIMS Shirpur', 4500.0, 6500.0, 'vegetarian', 'non-smoker', 'non-drinker', 'flexible', 'flexible', 'moderate', 1, 'Data Science student at NMIMS. Friendly, fond of listening to music with headphones, seeking a cooperative female roommate.', 1],
      [7, 22, 'Male', 'Shirpur', 'Karwand Naka / Main Road', 'RCPIT Shirpur', 2800.0, 4000.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Civil Engineering student. Organized, hygienic, non-smoker. Looking to share an apartment near Karwand Naka.', 1],
      [8, 21, 'Female', 'Shirpur', 'Nimzari Naka / Market Area', 'RCPCOP Shirpur', 3000.0, 4500.0, 'vegetarian', 'non-smoker', 'non-drinker', 'afternoon', 'flexible', 'moderate', 2, 'Pharmacy student. Looking for a responsible, friendly roommate for shared accommodation with good study environment.', 1]
    ];

    for (const p of demoProfiles) {
      await db.run(`
        INSERT OR IGNORE INTO profiles (
          user_id, age, gender, city, preferred_location, college_or_workplace,
          min_budget, max_budget, food_preference, smoking_preference, drinking_preference,
          study_schedule, sleeping_schedule, cleanliness_preference, preferred_roommate_count,
          about_me, is_complete
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, p);
    }

    const demoPrefs = [
      [1, 'Karwand Naka / RCPIT Campus', 2800.0, 4800.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [2, 'Nimzari Naka / Subhash Nagar', 2200.0, 4200.0, 'vegetarian', 'non-smoker', 'flexible', 'night-owl', 'moderate', 2],
      [3, 'NMIMS Campus / Mukesh Patel Park', 3800.0, 6200.0, 'any', 'non-smoker', 'flexible', 'flexible', 'very-clean', 1],
      [4, 'Karwand Naka / R. C. Patel Area', 2800.0, 4500.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [5, 'Shahada Road / College Corner', 2200.0, 4000.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1],
      [6, 'NMIMS Campus Area', 4000.0, 6800.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1],
      [7, 'Karwand Naka / Main Road', 2500.0, 4200.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [8, 'Nimzari Naka / Market Area', 2800.0, 4800.0, 'vegetarian', 'non-smoker', 'flexible', 'flexible', 'moderate', 2]
    ];

    for (const pr of demoPrefs) {
      await db.run(`
        INSERT OR IGNORE INTO preferences (
          user_id, preferred_location, min_budget, max_budget, preferred_food,
          preferred_smoking_status, preferred_study_schedule, preferred_sleeping_schedule,
          preferred_cleanliness, preferred_roommate_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, pr);
    }
  } catch (err) {
    console.error('[Database Seed Warning]:', err.message);
  }
}

/**
 * Async query/execute helper that mimics mysql2's [rows, fields] return structure.
 * - For SELECT, PRAGMA, EXPLAIN queries: returns [rows, []]
 * - For INSERT, UPDATE, DELETE queries: returns [{ insertId, affectedRows, changedRows }, []]
 */
async function executeQuery(sql, params) {
  const db = await getDb();
  const cleanedSql = sanitizeSql(sql);
  const cleanedParams = sanitizeParams(params);
  const trimmed = cleanedSql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN')) {
    const rows = await db.all(cleanedSql, cleanedParams);
    return [rows || [], []];
  } else {
    const result = await db.run(cleanedSql, cleanedParams);
    const resultPacket = {
      insertId: result.lastID,
      affectedRows: result.changes,
      changedRows: result.changes
    };
    return [resultPacket, []];
  }
}

/**
 * Pool object providing identical interface to mysql2/promise pool
 */
const pool = {
  query: executeQuery,
  execute: executeQuery,
  getConnection: async () => {
    return {
      query: executeQuery,
      execute: executeQuery,
      beginTransaction: () => executeQuery('BEGIN TRANSACTION'),
      commit: () => executeQuery('COMMIT'),
      rollback: () => executeQuery('ROLLBACK'),
      release: () => {}
    };
  },
  end: async () => {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
      initPromise = null;
    }
  }
};

/**
 * Tests database connectivity
 */
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log(`[Database] SQLite connected successfully (${SQLITE_FILE})`);
    return true;
  } catch (err) {
    console.error('[Database Error] Failed to connect to SQLite:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  getDb,
  SQLITE_FILE,
  dbConfig: {
    database: 'roommate.sqlite',
    type: 'sqlite',
    dialect: 'sqlite3'
  }
};
