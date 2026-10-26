-- =====================================================================
-- Roommate Finder Database Schema
-- Database: SQLite 3 (Zero-configuration file-based relational database)
-- Compatible with SQLite embedded engine
-- =====================================================================

-- Enable Foreign Key constraints
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Table 1: users
-- Core authentication and user account record
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);

-- ---------------------------------------------------------------------
-- Table 2: profiles
-- User lifestyle, budget, location, and personality characteristics
-- ---------------------------------------------------------------------
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
  food_preference TEXT NOT NULL DEFAULT 'any' CHECK (food_preference IN ('vegetarian', 'non-vegetarian', 'vegan', 'any')),
  smoking_preference TEXT NOT NULL DEFAULT 'non-smoker' CHECK (smoking_preference IN ('non-smoker', 'smoker', 'outside-only')),
  drinking_preference TEXT NOT NULL DEFAULT 'non-drinker' CHECK (drinking_preference IN ('non-drinker', 'occasional', 'regular')),
  study_schedule TEXT NOT NULL DEFAULT 'flexible' CHECK (study_schedule IN ('morning', 'afternoon', 'late-night', 'flexible')),
  sleeping_schedule TEXT NOT NULL DEFAULT 'flexible' CHECK (sleeping_schedule IN ('early-bird', 'night-owl', 'flexible')),
  cleanliness_preference TEXT NOT NULL DEFAULT 'moderate' CHECK (cleanliness_preference IN ('very-clean', 'moderate', 'relaxed')),
  preferred_roommate_count INTEGER NOT NULL DEFAULT 1,
  about_me TEXT NULL,
  profile_photo_path TEXT NULL,
  is_complete INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (min_budget >= 0 AND max_budget >= min_budget)
);

CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_budget ON profiles(min_budget, max_budget);
CREATE INDEX IF NOT EXISTS idx_profiles_food ON profiles(food_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_smoking ON profiles(smoking_preference);

-- ---------------------------------------------------------------------
-- Table 3: preferences
-- Roommate criteria desired by the user
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  preferred_location TEXT NULL,
  min_budget REAL NULL,
  max_budget REAL NULL,
  preferred_food TEXT DEFAULT 'any' CHECK (preferred_food IN ('vegetarian', 'non-vegetarian', 'vegan', 'any')),
  preferred_smoking_status TEXT DEFAULT 'non-smoker' CHECK (preferred_smoking_status IN ('non-smoker', 'smoker', 'outside-only', 'any')),
  preferred_study_schedule TEXT DEFAULT 'flexible' CHECK (preferred_study_schedule IN ('morning', 'afternoon', 'late-night', 'flexible')),
  preferred_sleeping_schedule TEXT DEFAULT 'flexible' CHECK (preferred_sleeping_schedule IN ('early-bird', 'night-owl', 'flexible')),
  preferred_cleanliness TEXT DEFAULT 'moderate' CHECK (preferred_cleanliness IN ('very-clean', 'moderate', 'relaxed', 'any')),
  preferred_roommate_count INTEGER NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (min_budget IS NULL OR max_budget IS NULL OR (min_budget >= 0 AND max_budget >= min_budget))
);

CREATE INDEX IF NOT EXISTS idx_preferences_location ON preferences(preferred_location);

-- ---------------------------------------------------------------------
-- Table 4: interests
-- Connecting users expressing interest in rooming together
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_user_id INTEGER NOT NULL,
  receiver_user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (sender_user_id <> receiver_user_id),
  UNIQUE(sender_user_id, receiver_user_id)
);

CREATE INDEX IF NOT EXISTS idx_interests_sender ON interests(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_interests_receiver ON interests(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_interests_status ON interests(status);

-- ---------------------------------------------------------------------
-- Table 5: sessions
-- Local session store for express-session (connect-sqlite3 format)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY NOT NULL,
  expired INTEGER NOT NULL,
  sess TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
