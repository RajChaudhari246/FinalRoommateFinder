/**
 * Database Layer - Embedded SQLite Engine
 * Provides a zero-configuration, file-based database for local & cloud deployment
 * with an async/await query/execute wrapper matching mysql2's [rows, fields] return signature.
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
 * Ensures security protocol columns exist in profiles and preferences tables
 */
async function ensureSecurityColumns(db) {
  try {
    const profCols = await db.all('PRAGMA table_info(profiles)');
    if (profCols && profCols.length > 0) {
      const existingProfCols = new Set(profCols.map(r => r.name));
      const profNeeded = [
        ['security_curfew', 'TEXT'],
        ['security_visitor_policy', 'TEXT'],
        ['security_amenities', 'TEXT'],
        ['security_emergency_contact', 'TEXT'],
        ['security_notes', 'TEXT']
      ];
      for (const [col, type] of profNeeded) {
        if (!existingProfCols.has(col)) {
          await db.run(`ALTER TABLE profiles ADD COLUMN ${col} ${type}`);
        }
      }
    }

    const prefCols = await db.all('PRAGMA table_info(preferences)');
    if (prefCols && prefCols.length > 0) {
      const existingPrefCols = new Set(prefCols.map(r => r.name));
      const prefNeeded = [
        ['preferred_gender', 'TEXT'],
        ['pref_security_visitor_policy', 'TEXT'],
        ['pref_security_curfew', 'TEXT'],
        ['pref_security_amenities', 'TEXT']
      ];
      for (const [col, type] of prefNeeded) {
        if (!existingPrefCols.has(col)) {
          await db.run(`ALTER TABLE preferences ADD COLUMN ${col} ${type}`);
        }
      }
    }
  } catch (err) {
    console.error('[Database Column Warning]:', err.message);
  }
}

/**
 * Backfills demo security protocols if they are currently null
 */
async function backfillDemoSecurity(db) {
  try {
    const demoSecurityProfiles = [
      [1, 'strict-curfew', 'no-overnight-guests', 'strict-lock-discipline', 'split-bill-discipline', 'Focused on academics and placement prep. Strict door locking discipline and prompt split of bills.'],
      [2, 'moderate-curfew', 'female-friends-only', 'gated-cctv', 'verified-guardian', 'Looking for a female pharmacy/engineering student flatmate. Building has 24/7 security guard and biometric gate.'],
      [3, 'flexible', 'prior-consent', 'cctv-parking', 'split-bill-discipline', 'Tech student at NMIMS. Quiet during night hours, responsible with keys and apartment safety.'],
      [4, 'strict-curfew', 'no-male-guests', 'gated-cctv', 'verified-guardian', 'Strictly women-only flat. Very peaceful, safe environment near RCPIT with 9 PM gate timing.'],
      [5, 'night-owl', 'weekend-friends-only', 'cctv-parking', 'split-bill-discipline', 'MBA student. Easygoing flatmate, responsible with apartment security and bills.'],
      [6, 'flexible', 'pre-informed-daytime', 'secure-lock', 'verified-guardian', 'Data Science student at NMIMS. Safe apartment with digital keypad lock and CCTV.'],
      [7, 'strict-curfew', 'no-overnight-guests', 'strict-lock-discipline', 'split-bill-discipline', 'Civil Engineering student. Clean and quiet space, always lock main door and balcony.'],
      [8, 'moderate-curfew', 'female-friends-only', 'safe-colony', 'verified-guardian', 'Pharmacy student. Looking for a responsible female flatmate for a safe, shared flat near market.']
    ];

    for (const [userId, curfew, visitor, amenities, contact, notes] of demoSecurityProfiles) {
      await db.run(`
        UPDATE profiles
        SET security_curfew = COALESCE(security_curfew, ?),
            security_visitor_policy = COALESCE(security_visitor_policy, ?),
            security_amenities = COALESCE(security_amenities, ?),
            security_emergency_contact = COALESCE(security_emergency_contact, ?),
            security_notes = COALESCE(security_notes, ?)
        WHERE user_id = ?
      `, [curfew, visitor, amenities, contact, notes, userId]);
    }

    const demoSecurityPrefs = [
      [1, 'Male', 'no-overnight-guests', 'strict-curfew', 'strict-lock-discipline'],
      [2, 'Female', 'female-friends-only', 'moderate-curfew', 'gated-cctv'],
      [3, 'Male', 'prior-consent', 'flexible', 'cctv-parking'],
      [4, 'Female', 'no-male-guests', 'strict-curfew', 'gated-cctv'],
      [5, 'Male', 'weekend-friends-only', 'night-owl', 'cctv-parking'],
      [6, 'Female', 'pre-informed-daytime', 'flexible', 'secure-lock'],
      [7, 'Male', 'no-overnight-guests', 'strict-curfew', 'strict-lock-discipline'],
      [8, 'Female', 'female-friends-only', 'moderate-curfew', 'safe-colony']
    ];

    for (const [userId, prefGender, visitor, curfew, amenities] of demoSecurityPrefs) {
      await db.run(`
        UPDATE preferences
        SET preferred_gender = COALESCE(preferred_gender, ?),
            pref_security_visitor_policy = COALESCE(pref_security_visitor_policy, ?),
            pref_security_curfew = COALESCE(pref_security_curfew, ?),
            pref_security_amenities = COALESCE(pref_security_amenities, ?)
        WHERE user_id = ?
      `, [prefGender, visitor, curfew, amenities, userId]);
    }
  } catch (err) {
    console.error('[Database Security Backfill Warning]:', err.message);
  }
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

      // Enable Write-Ahead Logging (WAL) for concurrency and foreign keys for integrity
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

      // Ensure security columns exist
      await ensureSecurityColumns(db);

      // Check if demo seed is needed
      try {
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount && userCount.count === 0) {
          await seedDemoData(db);
        } else {
          await backfillDemoSecurity(db);
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
      [1, 21, 'Male', 'Shirpur', 'Karwand Naka / RCPIT Campus', 'R. C. Patel Institute of Technology (RCPIT), Shirpur', 3000.0, 4500.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Final year Computer Engineering student at RCPIT Shirpur. Focused on studies, quiet room, pure veg, and keeps common areas organized.', 'strict-curfew', 'no-overnight-guests', 'strict-lock-discipline', 'split-bill-discipline', 'Focused on academics and placement prep. Strict door locking discipline and prompt split of bills.', 1],
      [2, 20, 'Female', 'Shirpur', 'Nimzari Naka / Subhash Nagar', 'R. C. Patel Institute of Pharmacy (RCPCOP), Shirpur', 2500.0, 4000.0, 'vegetarian', 'non-smoker', 'non-drinker', 'late-night', 'night-owl', 'moderate', 2, 'B.Pharm student at RCPCOP Shirpur. Friendly and studious. Looking for a female roommate for a shared flat near Nimzari Naka.', 'moderate-curfew', 'female-friends-only', 'gated-cctv', 'verified-guardian', 'Looking for a female pharmacy/engineering student flatmate. Building has 24/7 security guard and biometric gate.', 1],
      [3, 22, 'Male', 'Shirpur', 'NMIMS Campus / Mukesh Patel Park', 'NMIMS Mukesh Patel School of Technology, Shirpur', 4000.0, 6000.0, 'any', 'non-smoker', 'non-drinker', 'afternoon', 'flexible', 'very-clean', 1, 'B.Tech IT student at NMIMS Shirpur. Looking for a neat, disciplined flatmate near Mukesh Patel Park area. Non-smoker only.', 'flexible', 'prior-consent', 'cctv-parking', 'split-bill-discipline', 'Tech student at NMIMS. Quiet during night hours, responsible with keys and apartment safety.', 1],
      [4, 21, 'Female', 'Shirpur', 'Karwand Naka / R. C. Patel Area', 'RCPIT Shirpur', 3000.0, 4200.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Electronics student at RCPIT. Early riser, respectful of personal space and study schedule. Looking for a clean shared room.', 'strict-curfew', 'no-male-guests', 'gated-cctv', 'verified-guardian', 'Strictly women-only flat. Very peaceful, safe environment near RCPIT with 9 PM gate timing.', 1],
      [5, 23, 'Male', 'Shahada Road / College Corner', 'Shirpur', 'H. R. Patel Institute, Shirpur', 2500.0, 3800.0, 'non-vegetarian', 'non-smoker', 'occasional', 'late-night', 'night-owl', 'moderate', 1, 'MBA student in Shirpur. Easygoing, loves cricket and fitness, cooperative with sharing room rent and daily expenses.', 'night-owl', 'weekend-friends-only', 'cctv-parking', 'split-bill-discipline', 'MBA student. Easygoing flatmate, responsible with apartment security and bills.', 1],
      [6, 20, 'Female', 'Shirpur', 'NMIMS Campus Area', 'NMIMS Shirpur', 4500.0, 6500.0, 'vegetarian', 'non-smoker', 'non-drinker', 'flexible', 'flexible', 'moderate', 1, 'Data Science student at NMIMS. Friendly, fond of listening to music with headphones, seeking a cooperative female roommate.', 'flexible', 'pre-informed-daytime', 'secure-lock', 'verified-guardian', 'Data Science student at NMIMS. Safe apartment with digital keypad lock and CCTV.', 1],
      [7, 22, 'Male', 'Shirpur', 'Karwand Naka / Main Road', 'RCPIT Shirpur', 2800.0, 4000.0, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Civil Engineering student. Organized, hygienic, non-smoker. Looking to share an apartment near Karwand Naka.', 'strict-curfew', 'no-overnight-guests', 'strict-lock-discipline', 'split-bill-discipline', 'Civil Engineering student. Clean and quiet space, always lock main door and balcony.', 1],
      [8, 21, 'Female', 'Shirpur', 'Nimzari Naka / Market Area', 'RCPCOP Shirpur', 3000.0, 4500.0, 'vegetarian', 'non-smoker', 'non-drinker', 'afternoon', 'flexible', 'moderate', 2, 'Pharmacy student. Looking for a responsible, friendly roommate for shared accommodation with good study environment.', 'moderate-curfew', 'female-friends-only', 'safe-colony', 'verified-guardian', 'Pharmacy student. Looking for a responsible female flatmate for a safe, shared flat near market.', 1]
    ];

    for (const p of demoProfiles) {
      await db.run(`
        INSERT OR IGNORE INTO profiles (
          user_id, age, gender, city, preferred_location, college_or_workplace,
          min_budget, max_budget, food_preference, smoking_preference, drinking_preference,
          study_schedule, sleeping_schedule, cleanliness_preference, preferred_roommate_count,
          about_me, security_curfew, security_visitor_policy, security_amenities,
          security_emergency_contact, security_notes, is_complete
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, p);
    }

    const demoPrefs = [
      [1, 'Male', 'Karwand Naka / RCPIT Campus', 2800.0, 4800.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1, 'no-overnight-guests', 'strict-curfew', 'strict-lock-discipline'],
      [2, 'Female', 'Nimzari Naka / Subhash Nagar', 2200.0, 4200.0, 'vegetarian', 'non-smoker', 'flexible', 'night-owl', 'moderate', 2, 'female-friends-only', 'moderate-curfew', 'gated-cctv'],
      [3, 'Male', 'NMIMS Campus / Mukesh Patel Park', 3800.0, 6200.0, 'any', 'non-smoker', 'flexible', 'flexible', 'very-clean', 1, 'prior-consent', 'flexible', 'cctv-parking'],
      [4, 'Female', 'Karwand Naka / R. C. Patel Area', 2800.0, 4500.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1, 'no-male-guests', 'strict-curfew', 'gated-cctv'],
      [5, 'Male', 'Shahada Road / College Corner', 2200.0, 4000.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1, 'weekend-friends-only', 'night-owl', 'cctv-parking'],
      [6, 'Female', 'NMIMS Campus Area', 4000.0, 6800.0, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1, 'pre-informed-daytime', 'flexible', 'secure-lock'],
      [7, 'Male', 'Karwand Naka / Main Road', 2500.0, 4200.0, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1, 'no-overnight-guests', 'strict-curfew', 'strict-lock-discipline'],
      [8, 'Female', 'Nimzari Naka / Market Area', 2800.0, 4800.0, 'vegetarian', 'non-smoker', 'flexible', 'flexible', 'moderate', 2, 'female-friends-only', 'moderate-curfew', 'safe-colony']
    ];

    for (const pr of demoPrefs) {
      await db.run(`
        INSERT OR IGNORE INTO preferences (
          user_id, preferred_gender, preferred_location, min_budget, max_budget, preferred_food,
          preferred_smoking_status, preferred_study_schedule, preferred_sleeping_schedule,
          preferred_cleanliness, preferred_roommate_count, pref_security_visitor_policy,
          pref_security_curfew, pref_security_amenities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
