-- =====================================================================
-- Roommate Finder - Dedicated Application User & Database Setup
-- Run this script in MySQL Workbench or MySQL Command Line Client
-- =====================================================================

-- 1. Create Application Database
CREATE DATABASE IF NOT EXISTS roommate_finder
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Create Dedicated Application User
CREATE USER IF NOT EXISTS 'roommate_app'@'localhost' IDENTIFIED BY 'Roommate@2026';

-- 3. Grant Specific Privileges for roommate_finder Only
GRANT ALL PRIVILEGES ON roommate_finder.* TO 'roommate_app'@'localhost';

-- 4. Flush Privileges to Apply Changes
FLUSH PRIVILEGES;
