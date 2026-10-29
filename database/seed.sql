-- =====================================================================
-- Roommate Finder Seed Data
-- Demo accounts password for all: Password@123
-- Hash: $2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm
-- =====================================================================

USE roommate_finder;

-- Insert Users
INSERT INTO users (id, full_name, email, password_hash, account_status) VALUES
(1, 'Rajesh Patil', 'rajesh.patil@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(2, 'Pooja Sharma', 'pooja.sharma@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(3, 'Aditya Chaudhari', 'aditya.c@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(4, 'Sneha Kulkarni', 'sneha.k@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(5, 'Rohit Deshmukh', 'rohit.d@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(6, 'Neha Marathe', 'neha.m@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(7, 'Chetan Ahire', 'chetan.a@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active'),
(8, 'Priyanka Mali', 'priyanka.m@example.com', '$2a$10$ACXIcW3ACVF1sJRCpyvQduxWcqLVEHL1vCC1e5JvKBl.uKvxKnbfm', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Insert Profiles
INSERT INTO profiles (user_id, age, gender, city, preferred_location, college_or_workplace, min_budget, max_budget, food_preference, smoking_preference, drinking_preference, study_schedule, sleeping_schedule, cleanliness_preference, preferred_roommate_count, about_me, is_complete) VALUES
(1, 21, 'Male', 'Shirpur', 'Karwand Naka / RCPIT Campus', 'R. C. Patel Institute of Technology (RCPIT), Shirpur', 3000.00, 4500.00, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Final year Computer Engineering student at RCPIT Shirpur. Focused on studies, quiet room, pure veg, and keeps common areas organized.', TRUE),
(2, 20, 'Female', 'Shirpur', 'Nimzari Naka / Subhash Nagar', 'R. C. Patel Institute of Pharmacy (RCPCOP), Shirpur', 2500.00, 4000.00, 'vegetarian', 'non-smoker', 'non-drinker', 'late-night', 'night-owl', 'moderate', 2, 'B.Pharm student at RCPCOP Shirpur. Friendly and studious. Looking for a female roommate for a shared flat near Nimzari Naka.', TRUE),
(3, 22, 'Male', 'Shirpur', 'NMIMS Campus / Mukesh Patel Park', 'NMIMS Mukesh Patel School of Technology, Shirpur', 4000.00, 6000.00, 'any', 'non-smoker', 'non-drinker', 'afternoon', 'flexible', 'very-clean', 1, 'B.Tech IT student at NMIMS Shirpur. Looking for a neat, disciplined flatmate near Mukesh Patel Park area. Non-smoker only.', TRUE),
(4, 21, 'Female', 'Shirpur', 'Karwand Naka / R. C. Patel Area', 'RCPIT Shirpur', 3000.00, 4200.00, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Electronics student at RCPIT. Early riser, respectful of personal space and study schedule. Looking for a clean shared room.', TRUE),
(5, 23, 'Male', 'Shirpur', 'Shahada Road / College Corner', 'H. R. Patel Institute, Shirpur', 2500.00, 3800.00, 'non-vegetarian', 'non-smoker', 'occasional', 'late-night', 'night-owl', 'moderate', 1, 'MBA student in Shirpur. Easygoing, loves cricket and fitness, cooperative with sharing room rent and daily expenses.', TRUE),
(6, 20, 'Female', 'Shirpur', 'NMIMS Campus Area', 'NMIMS Shirpur', 4500.00, 6500.00, 'vegetarian', 'non-smoker', 'non-drinker', 'flexible', 'flexible', 'moderate', 1, 'Data Science student at NMIMS. Friendly, fond of listening to music with headphones, seeking a cooperative female roommate.', TRUE),
(7, 22, 'Male', 'Shirpur', 'Karwand Naka / Main Road', 'RCPIT Shirpur', 2800.00, 4000.00, 'vegetarian', 'non-smoker', 'non-drinker', 'morning', 'early-bird', 'very-clean', 1, 'Civil Engineering student. Organized, hygienic, non-smoker. Looking to share an apartment near Karwand Naka.', TRUE),
(8, 21, 'Female', 'Shirpur', 'Nimzari Naka / Market Area', 'RCPCOP Shirpur', 3000.00, 4500.00, 'vegetarian', 'non-smoker', 'non-drinker', 'afternoon', 'flexible', 'moderate', 2, 'Pharmacy student. Looking for a responsible, friendly roommate for shared accommodation with good study environment.', TRUE)
ON DUPLICATE KEY UPDATE city = VALUES(city), min_budget = VALUES(min_budget), max_budget = VALUES(max_budget);

-- Insert Desired Preferences
INSERT INTO preferences (user_id, preferred_location, min_budget, max_budget, preferred_food, preferred_smoking_status, preferred_study_schedule, preferred_sleeping_schedule, preferred_cleanliness, preferred_roommate_count) VALUES
(1, 'Karwand Naka / RCPIT Campus', 2800.00, 4800.00, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1),
(2, 'Nimzari Naka / Subhash Nagar', 2200.00, 4200.00, 'vegetarian', 'non-smoker', 'flexible', 'night-owl', 'moderate', 2),
(3, 'NMIMS Campus / Mukesh Patel Park', 3800.00, 6200.00, 'any', 'non-smoker', 'flexible', 'flexible', 'very-clean', 1),
(4, 'Karwand Naka / R. C. Patel Area', 2800.00, 4500.00, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1),
(5, 'Shahada Road / College Corner', 2200.00, 4000.00, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1),
(6, 'NMIMS Campus Area', 4000.00, 6800.00, 'any', 'non-smoker', 'flexible', 'flexible', 'moderate', 1),
(7, 'Karwand Naka / Main Road', 2500.00, 4200.00, 'vegetarian', 'non-smoker', 'morning', 'early-bird', 'very-clean', 1),
(8, 'Nimzari Naka / Market Area', 2800.00, 4800.00, 'vegetarian', 'non-smoker', 'flexible', 'flexible', 'moderate', 2)
ON DUPLICATE KEY UPDATE min_budget = VALUES(min_budget), max_budget = VALUES(max_budget);

-- Sample initial same-wing interests for demonstration (strict gender safety compliance)
INSERT INTO interests (sender_user_id, receiver_user_id, status, message) VALUES
(1, 3, 'pending', 'Hey Aditya! I saw you study at NMIMS and prefer disciplined non-smoker flatmates. Would love to discuss sharing a 2BHK near campus!'),
(5, 7, 'accepted', 'Hi Chetan, our monthly rent budget and location preferences align nicely. Let us coordinate a visit to the Karwand Naka flat!'),
(2, 4, 'accepted', 'Hi Sneha! I noticed our study schedules and Girls Wing safety standards match closely. Looking forward to rooming together!'),
(6, 8, 'pending', 'Hello Priyanka, I saw your profile in the Girls Safe Wing. Our budget and gate curfew preferences align well. Would love to connect!')
ON DUPLICATE KEY UPDATE status = VALUES(status);
