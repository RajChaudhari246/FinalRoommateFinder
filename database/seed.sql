-- =====================================================================
-- Roommate Finder Seed Data
-- Demo accounts password for all: Password@123
-- Hash: $2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm
-- =====================================================================

USE roommate_finder;

-- Insert Users
INSERT INTO users (id, full_name, email, password_hash, account_status) VALUES
(1, 'Alex Chen', 'alex.chen@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(2, 'Sarah Jenkins', 'sarah.j@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(3, 'Maya Patel', 'maya.patel@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(4, 'David Miller', 'david.m@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(5, 'Elena Rostova', 'elena.r@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(6, 'Marcus Johnson', 'marcus.j@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(7, 'Chloe Zhang', 'chloe.z@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(8, 'Liam O Connor', 'liam.o@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Insert Profiles
INSERT INTO profiles (user_id, age, gender, city, preferred_location, college_or_workplace, min_budget, max_budget, food_preference, smoking_preference, drinking_preference, study_schedule, sleeping_schedule, cleanliness_preference, preferred_roommate_count, about_me, is_complete) VALUES
(1, 24, 'Male', 'New York', 'Brooklyn / Manhattan Downtown', 'Tech Corp NY', 1200.00, 1600.00, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Software engineer working in FinTech. I keep common areas tidy, love home cooking, and respect quiet study hours.', TRUE),
(2, 22, 'Female', 'Boston', 'Cambridge / Allston', 'Harvard University', 800.00, 1200.00, 'non-vegetarian', 'outside-only', 'occasional', 'late-night', 'night-owl', 'moderate', 2, 'Biochem grad student. Often in the lab during the day. Friendly, easygoing, and love sharing coffee & movie nights on weekends.', TRUE),
(3, 26, 'Female', 'San Francisco', 'Mission District / SOMA', 'Design Studio SF', 1500.00, 2200.00, 'vegan', 'non-smoker', 'occasional', 'afternoon', 'flexible', 'very-clean', 1, 'Product designer passionate about plant care, yoga, and calm aesthetics. Looking for a mindful, tidy roommate.', TRUE),
(4, 28, 'Male', 'Chicago', 'Lincoln Park / Lakeview', 'Northwestern Memorial Hospital', 900.00, 1300.00, 'non-vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'moderate', 1, 'Pediatric resident doctor. Very quiet at home, sleep early, values dependable roommates and shared grocery ordering.', TRUE),
(5, 25, 'Female', 'Austin', 'Downtown / South Congress', 'Austin Data Lab', 1000.00, 1400.00, 'vegetarian', 'non-smoker', 'occasional', 'flexible', 'flexible', 'moderate', 1, 'Data analyst working hybrid. Love live music, cycling, and trying local food trucks. Looking for a neat and friendly roommate.', TRUE),
(6, 27, 'Male', 'New York', 'Astoria / Long Island City', 'Midtown Media Agency', 1300.00, 1800.00, 'any', 'non-smoker', 'occasional', 'afternoon', 'night-owl', 'moderate', 1, 'Digital marketing strategist. Enjoy casual cooking, gaming, and exploring art galleries. Very respectful of boundaries.', TRUE),
(7, 23, 'Female', 'Boston', 'Fenway / Back Bay', 'Boston Architectural College', 850.00, 1250.00, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Architecture master student. Neat, organized, and focused on studies. Looking for a quiet, considerate roommate.', TRUE),
(8, 26, 'Male', 'New York', 'Upper East Side / Yorkville', 'Wall Street Advisory', 1400.00, 1900.00, 'non-vegetarian', 'outside-only', 'regular', 'flexible', 'flexible', 'moderate', 2, 'Financial consultant who travels frequently for business. Friendly, respectful, and looking for reliable roommates.', TRUE)
ON DUPLICATE KEY UPDATE city = VALUES(city), min_budget = VALUES(min_budget), max_budget = VALUES(max_budget);

-- Insert Desired Preferences
INSERT INTO preferences (user_id, preferred_location, min_budget, max_budget, preferred_food, preferred_smoking_status, preferred_study_schedule, preferred_sleeping_schedule, preferred_cleanliness, preferred_roommate_count) VALUES
(1, 'Brooklyn / Manhattan Downtown', 1100.00, 1700.00, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1),
(2, 'Cambridge / Allston', 750.00, 1250.00, 'any', 'outside-only', 'flexible', 'night-owl', 'moderate', 2),
(3, 'Mission District / SOMA', 1400.00, 2300.00, 'vegan', 'non-smoker', 'flexible', 'flexible', 'very-clean', 1),
(4, 'Lincoln Park / Lakeview', 850.00, 1350.00, 'any', 'non-smoker', 'morning', 'early-bird', 'moderate', 1),
(5, 'Downtown / South Congress', 950.00, 1450.00, 'vegetarian', 'non-smoker', 'flexible', 'flexible', 'moderate', 1),
(6, 'Astoria / Long Island City', 1200.00, 1900.00, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1),
(7, 'Fenway / Back Bay', 800.00, 1300.00, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1),
(8, 'Upper East Side / Yorkville', 1300.00, 2000.00, 'any', 'any', 'flexible', 'flexible', 'moderate', 2)
ON DUPLICATE KEY UPDATE min_budget = VALUES(min_budget), max_budget = VALUES(max_budget);

-- Sample initial interests for demonstration
INSERT INTO interests (sender_user_id, receiver_user_id, status, message) VALUES
(2, 7, 'pending', 'Hi Chloe! I saw we both study in Boston and have similar schedules. Would love to connect!'),
(6, 1, 'accepted', 'Hey Alex, your Brooklyn location and budget match mine closely. Let me know if you are still looking.')
ON DUPLICATE KEY UPDATE status = VALUES(status);
