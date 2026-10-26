# Roommate Finder - Database Documentation

## Database Architecture
The application uses **MySQL 8.0+** with relational integrity, foreign key constraints, unique indexes, and check constraints.

### Schema Entity Relationship
```
+--------------------+            +------------------------+
|      users         | 1        1 |       profiles         |
+--------------------+------------+------------------------+
| id (PK)            |            | id (PK)                |
| full_name          |            | user_id (FK -> users)  |
| email (UNIQUE)     |            | min_budget, max_budget |
| password_hash      |            | city, location         |
| account_status     |            | food, smoking, sleep   |
+--------------------+            +------------------------+
         | 1                                 |
         |                                   |
         | 1                                 |
+--------------------+            +------------------------+
|    preferences     |            |       interests        |
+--------------------+            +------------------------+
| id (PK)            |            | id (PK)                |
| user_id (FK)       |            | sender_user_id (FK)    |
| preferred_location |            | receiver_user_id (FK)  |
| min/max budget     |            | status (pending, etc.) |
| food, smoking, etc.|            | message                |
+--------------------+            +------------------------+
```

## How to Initialize

1. Make sure your MySQL service is running.
2. Ensure you have created a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Update `DB_USER` and `DB_PASSWORD` to your MySQL credentials.
4. Run the automated database initializer:
   ```bash
   npm run db:init
   ```
5. Optionally seed the demo roommate profiles:
   ```bash
   npm run db:seed
   ```

## Manual SQL Execution (Alternative)
If you prefer running SQL scripts using the MySQL command-line or MySQL Workbench:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
