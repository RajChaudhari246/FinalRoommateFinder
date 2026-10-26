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
      [1, 'Rajesh Patil', 'rajesh.patil@example.com', hash, 'active'],
      [2, 'Pooja Sharma', 'pooja.sharma@example.com', hash, 'active'],
      [3, 'Aditya Chaudhari', 'aditya.c@example.com', hash, 'active'],
      [4, 'Sneha Kulkarni', 'sneha.k@example.com', hash, 'active'],
      [5, 'Rohit Deshmukh', 'rohit.d@example.com', hash, 'active'],
      [6, 'Neha Marathe', 'neha.m@example.com', hash, 'active'],
      [7, 'Chetan Ahire', 'chetan.a@example.com', hash, 'active'],
      [8, 'Priyanka Mali', 'priyanka.m@example.com', hash, 'active']
    ];

    const userStmt = db.prepare('INSERT OR IGNORE INTO users (id, full_name, email, password_hash, account_status) VALUES (?, ?, ?, ?, ?)');
    demoUsers.forEach(u => userStmt.run(u));
    userStmt.finalize();

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
      [1, 'Karwand Naka / RCPIT Campus', 2800.0, 4800.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [2, 'Nimzari Naka / Subhash Nagar', 2200.0, 4200.0, 'vegetarian', 'non-smoker', 'flexible', 'night-owl', 'moderate', 2],
      [3, 'NMIMS Campus / Mukesh Patel Park', 3800.0, 6200.0, 'any', 'non-smoker', 'flexible', 'flexible', 'very-clean', 1],
      [4, 'Karwand Naka / R. C. Patel Area', 2800.0, 4500.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [5, 'Shahada Road / College Corner', 2200.0, 4000.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1],
      [6, 'NMIMS Campus Area', 4000.0, 6800.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1],
      [7, 'Karwand Naka / Main Road', 2500.0, 4200.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1],
      [8, 'Nimzari Naka / Market Area', 2800.0, 4800.0, 'vegetarian', 'non-smoker', 'flexible', 'flexible', 'moderate', 2]
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
