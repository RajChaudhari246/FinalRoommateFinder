/**
 * Database Layer - Embedded SQLite Engine (with optional MySQL fallback)
 * Provides zero-configuration, file-based database for instant local & cloud deployment.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR = path.join(__dirname, '../../database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const SQLITE_FILE = process.env.SQLITE_PATH || path.join(DB_DIR, 'roommate.sqlite');

console.log(`[Database] Initializing SQLite embedded database at: ${SQLITE_FILE}`);
const db = new sqlite3.Database(SQLITE_FILE);

// Enable WAL mode and foreign keys for high concurrency and relational integrity
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// Automatically initialize schema
function initSchema() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        account_status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status)`);

    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        age INTEGER NULL,
        gender TEXT NULL,
        city TEXT NOT NULL,
        preferred_location TEXT NOT NULL,
        college_or_workplace TEXT NULL,
        min_budget REAL NOT NULL DEFAULT 0.00,
        max_budget REAL NOT NULL DEFAULT 0.00,
        food_preference TEXT NOT NULL DEFAULT 'any',
        smoking_preference TEXT NOT NULL DEFAULT 'non-smoker',
        drinking_preference TEXT NOT NULL DEFAULT 'non-drinker',
        study_schedule TEXT NOT NULL DEFAULT 'flexible',
        sleeping_schedule TEXT NOT NULL DEFAULT 'flexible',
        cleanliness_preference TEXT NOT NULL DEFAULT 'moderate',
        preferred_roommate_count INTEGER NOT NULL DEFAULT 1,
        about_me TEXT NULL,
        profile_photo_path TEXT NULL,
        is_complete INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city)`);

    db.run(`
      CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        preferred_location TEXT NULL,
        min_budget REAL NULL,
        max_budget REAL NULL,
        preferred_food TEXT NOT NULL DEFAULT 'any',
        preferred_smoking_status TEXT NOT NULL DEFAULT 'any',
        preferred_study_schedule TEXT NOT NULL DEFAULT 'flexible',
        preferred_sleeping_schedule TEXT NOT NULL DEFAULT 'flexible',
        preferred_cleanliness TEXT NOT NULL DEFAULT 'any',
        preferred_roommate_count INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS interests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_user_id INTEGER NOT NULL,
        receiver_user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        message TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(sender_user_id, receiver_user_id)
      )
    `);

    // Seed sample profiles if empty
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (!err && row && row.count === 0) {
        console.log('[Database] Empty database detected. Seeding sample profiles...');
        seedDemoData();
      }
    });
  });
}

function seedDemoData() {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const hash = '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm'; // Password@123
    const demoUsers = [
      [1, 'Alex Chen', 'alex.chen@example.com', hash, 'active'],
      [2, 'Sarah Jenkins', 'sarah.j@example.com', hash, 'active'],
      [3, 'Maya Patel', 'maya.patel@example.com', hash, 'active'],
      [4, 'David Miller', 'david.m@example.com', hash, 'active'],
      [5, 'Elena Rostova', 'elena.r@example.com', hash, 'active'],
      [6, 'Marcus Johnson', 'marcus.j@example.com', hash, 'active'],
      [7, 'Chloe Zhang', 'chloe.z@example.com', hash, 'active'],
      [8, 'Liam O Connor', 'liam.o@example.com', hash, 'active']
    ];

    const userStmt = db.prepare('INSERT OR IGNORE INTO users (id, full_name, email, password_hash, account_status) VALUES (?, ?, ?, ?, ?)');
    demoUsers.forEach(u => userStmt.run(u));
    userStmt.finalize();

    const demoProfiles = [
      [1, 24, 'Male', 'New York', 'Brooklyn / Manhattan Downtown', 'Tech Corp NY', 1200.0, 1600.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Software engineer working in FinTech. I keep common areas tidy, love home cooking, and respect quiet study hours.', 1],
      [2, 22, 'Female', 'Boston', 'Cambridge / Allston', 'Harvard University', 800.0, 1200.0, 'non-vegetarian', 'outside-only', 'occasional', 'late-night', 'night-owl', 'moderate', 2, 'Biochem grad student. Often in the lab during the day. Friendly, easygoing, and love sharing coffee & movie nights on weekends.', 1],
      [3, 26, 'Female', 'San Francisco', 'Mission District / SOMA', 'Design Studio SF', 1500.0, 2200.0, 'vegan', 'non-smoker', 'occasional', 'afternoon', 'flexible', 'very-clean', 1, 'Product designer passionate about plant care, yoga, and calm aesthetics. Looking for a mindful, tidy roommate.', 1],
      [4, 28, 'Male', 'Chicago', 'Lincoln Park / Lakeview', 'Northwestern Memorial Hospital', 900.0, 1300.0, 'non-vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'moderate', 1, 'Pediatric resident doctor. Very quiet at home, sleep early, values dependable roommates and shared grocery ordering.', 1],
      [5, 25, 'Female', 'Austin', 'Downtown / South Congress', 'Austin Data Lab', 1000.0, 1400.0, 'vegetarian', 'non-smoker', 'occasional', 'flexible', 'flexible', 'moderate', 1, 'Data analyst working hybrid. Love live music, cycling, and trying local food trucks. Looking for a neat and friendly roommate.', 1],
      [6, 27, 'Male', 'New York', 'Astoria / Long Island City', 'Midtown Media Agency', 1300.0, 1800.0, 'any', 'non-smoker', 'occasional', 'afternoon', 'night-owl', 'moderate', 1, 'Digital marketing strategist. Enjoy casual cooking, gaming, and exploring art galleries. Very respectful of boundaries.', 1],
      [7, 23, 'Female', 'Boston', 'Fenway / Back Bay', 'Boston Architectural College', 850.0, 1250.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Architecture master student. Neat, organized, and focused on studies. Looking for a quiet, considerate roommate.', 1],
      [8, 26, 'Male', 'New York', 'Upper East Side / Yorkville', 'Wall Street Advisory', 1400.0, 1900.0, 'non-vegetarian', 'outside-only', 'regular', 'flexible', 'flexible', 'moderate', 2, 'Financial consultant who travels frequently for business. Friendly, respectful, and looking for reliable roommates.', 1]
    ];

    const profStmt = db.prepare(`
      INSERT OR IGNORE INTO profiles (
        user_id, age, gender, city, preferred_location, college_or_workplace,
        min_budget, max_budget, food_preference, smoking_preference, drinking_preference,
        study_schedule, sleeping_schedule, cleanliness_preference, preferred_roommate_count,
        about_me, is_complete
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    demoProfiles.forEach(p => profStmt.run(p));
    profStmt.finalize();

    const demoPrefs = [
      [1, 'Brooklyn / Manhattan Downtown', 1100.0, 1700.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [2, 'Cambridge / Allston', 750.0, 1250.0, 'any', 'outside-only', 'flexible', 'night-owl', 'moderate', 2],
      [3, 'Mission District / SOMA', 1400.0, 2300.0, 'vegan', 'non-smoker', 'flexible', 'flexible', 'very-clean', 1],
      [4, 'Lincoln Park / Lakeview', 850.0, 1350.0, 'any', 'non-smoker', 'morning', 'early-bird', 'moderate', 1],
      [5, 'Downtown / South Congress', 950.0, 1450.0, 'vegetarian', 'non-smoker', 'flexible', 'flexible', 'moderate', 1],
      [6, 'Astoria / Long Island City', 1200.0, 1900.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1],
      [7, 'Fenway / Back Bay', 800.0, 1300.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [8, 'Upper East Side / Yorkville', 1300.0, 2000.0, 'any', 'any', 'flexible', 'flexible', 'moderate', 2]
    ];

    const prefStmt = db.prepare(`
      INSERT OR IGNORE INTO preferences (
        user_id, preferred_location, min_budget, max_budget, preferred_food,
        preferred_smoking_status, preferred_study_schedule, preferred_sleeping_schedule,
        preferred_cleanliness, preferred_roommate_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    demoPrefs.forEach(p => prefStmt.run(p));
    prefStmt.finalize();

    db.run('COMMIT', (err) => {
      if (!err) console.log('[Database] Seed data loaded successfully.');
    });
  });
}

initSchema();

// Normalize parameters for SQLite (e.g. booleans to 1/0, undefined to null)
function sanitizeParams(params) {
  if (!params) return [];
  return (Array.isArray(params) ? params : [params]).map(v => {
    if (v === true) return 1;
    if (v === false) return 0;
    if (v === undefined) return null;
    return v;
  });
}

// Convert MySQL query dialect differences to SQLite
function sanitizeSql(sql) {
  let cleaned = sql
    .replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT OR IGNORE INTO')
    .replace(/BOOLEAN/gi, 'INTEGER')
    .replace(/TRUE/gi, '1')
    .replace(/FALSE/gi, '0');
  return cleaned;
}

// Promisified query helper matching mysql2/promise signature [rows]
function executeQuery(sql, params) {
  return new Promise((resolve, reject) => {
    const finalSql = sanitizeSql(sql);
    const finalParams = sanitizeParams(params);
    const trimmed = finalSql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('SHOW')) {
      db.all(finalSql, finalParams, (err, rows) => {
        if (err) return reject(err);
        resolve([rows || [], []]);
      });
    } else {
      db.run(finalSql, finalParams, function(err) {
        if (err) return reject(err);
        resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
      });
    }
  });
}

// Pool interface compatible with mysql2/promise
const pool = {
  query: executeQuery,
  getConnection: async () => {
    return {
      query: executeQuery,
      beginTransaction: () => executeQuery('BEGIN TRANSACTION'),
      commit: () => executeQuery('COMMIT'),
      rollback: () => executeQuery('ROLLBACK'),
      release: () => {}
    };
  },
  end: () => {
    return new Promise(resolve => db.close(resolve));
  }
};

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('[Database] Connected to SQLite database.');
    return true;
  } catch (err) {
    console.error('[Database Error] Failed to connect to SQLite:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  dbConfig: {
    database: 'roommate.sqlite',
    host: 'embedded',
    port: 0
  }
};
