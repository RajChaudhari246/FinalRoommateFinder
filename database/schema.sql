-- =====================================================================
-- Roommate Finder Database Schema
-- Database: roommate_finder
-- MySQL 8.0+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS roommate_finder
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE roommate_finder;

-- ---------------------------------------------------------------------
-- Table 1: users
-- Core authentication and user account record
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  account_status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 2: profiles
-- User's own lifestyle, budget, location, and personality characteristics
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  age INT NULL,
  gender VARCHAR(50) NULL,
  city VARCHAR(100) NOT NULL,
  preferred_location VARCHAR(150) NOT NULL,
  college_or_workplace VARCHAR(150) NULL,
  min_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  food_preference ENUM('vegetarian', 'non-vegetarian', 'vegan', 'any') NOT NULL DEFAULT 'any',
  smoking_preference ENUM('non-smoker', 'smoker', 'outside-only') NOT NULL DEFAULT 'non-smoker',
  drinking_preference ENUM('non-drinker', 'occasional', 'regular') NOT NULL DEFAULT 'non-drinker',
  study_schedule ENUM('morning', 'afternoon', 'late-night', 'flexible') NOT NULL DEFAULT 'flexible',
  sleeping_schedule ENUM('early-bird', 'night-owl', 'flexible') NOT NULL DEFAULT 'flexible',
  cleanliness_preference ENUM('very-clean', 'moderate', 'relaxed') NOT NULL DEFAULT 'moderate',
  preferred_roommate_count INT NOT NULL DEFAULT 1,
  about_me TEXT NULL,
  profile_photo_path VARCHAR(255) NULL,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_profiles_budget CHECK (min_budget >= 0 AND max_budget >= min_budget),
  INDEX idx_profiles_city (city),
  INDEX idx_profiles_budget (min_budget, max_budget),
  INDEX idx_profiles_food (food_preference),
  INDEX idx_profiles_smoking (smoking_preference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 3: preferences
-- Roommate criteria desired by the user
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  preferred_location VARCHAR(150) NULL,
  min_budget DECIMAL(10,2) NULL,
  max_budget DECIMAL(10,2) NULL,
  preferred_food ENUM('vegetarian', 'non-vegetarian', 'vegan', 'any') DEFAULT 'any',
  preferred_smoking_status ENUM('non-smoker', 'smoker', 'outside-only', 'any') DEFAULT 'non-smoker',
  preferred_study_schedule ENUM('morning', 'afternoon', 'late-night', 'flexible') DEFAULT 'flexible',
  preferred_sleeping_schedule ENUM('early-bird', 'night-owl', 'flexible') DEFAULT 'flexible',
  preferred_cleanliness ENUM('very-clean', 'moderate', 'relaxed', 'any') DEFAULT 'moderate',
  preferred_roommate_count INT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_preferences_budget CHECK (min_budget IS NULL OR max_budget IS NULL OR (min_budget >= 0 AND max_budget >= min_budget)),
  INDEX idx_preferences_location (preferred_location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 4: interests
-- Connecting users expressing interest in rooming together
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_user_id INT NOT NULL,
  receiver_user_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  message VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_interests_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_interests_receiver FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_interests_no_self CHECK (sender_user_id <> receiver_user_id),
  UNIQUE KEY unique_interest_pair (sender_user_id, receiver_user_id),
  INDEX idx_interests_sender (sender_user_id),
  INDEX idx_interests_receiver (receiver_user_id),
  INDEX idx_interests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 5: sessions
-- Express MySQL session store table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT(11) UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id),
  INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
