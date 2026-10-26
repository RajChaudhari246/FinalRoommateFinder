# Roommate Finder

A full-stack web application designed to help college students and working professionals find compatible roommates based on location, budget, diet, study habits, sleeping schedule, and living preferences.

---

## 1. Project Introduction & Problem Statement

Finding a compatible roommate is one of the most critical decisions in shared apartment living. Traditional listing websites and classifieds focus exclusively on physical real estate rather than roommate lifestyle harmony. As a result, roommates frequently encounter irreconcilable conflicts over sleeping hours, cleanliness expectations, kitchen usage, noise levels, and non-overlapping budget ranges.

**Roommate Finder** solves this problem by providing a transparent, rule-based matching engine that evaluates living compatibility before lease signing.

---

## 2. Project Objectives

- Provide secure user registration, session management, and profile customization.
- Enable users to separate their personal habits from their desired roommate criteria.
- Deliver real-time multi-filter search backed by parameterized MySQL queries.
- Implement an explainable, deterministic compatibility engine (0–100%) that highlights why two people match.
- Provide a full interest and connection workflow where users can express interest, include an introductory note, and accept or decline requests.

---

## 3. Technology Stack

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Design System, Responsive Flexbox & Grid, CSS variables), Vanilla JavaScript (ES6+), Fetch API.
- **Backend**: Node.js (v18+ or v24+), Express.js.
- **Database**: MySQL 8.0+ with `mysql2/promise` connection pool.
- **Session & Security**: `express-session` backed by `express-mysql-session` persistent store, `bcryptjs` password hashing, `helmet` HTTP security headers, and `express-rate-limit` endpoint protection.
- **Testing**: Built-in `node:test` and `node:assert`.

---

## 4. Architecture & System Flow

```
                      +---------------------------------------+
                      |               BROWSER                 |
                      |   HTML5 + Vanilla CSS3 + Vanilla JS   |
                      +---------------------------------------+
                                          |
                      Same-Origin HTTP & Session Cookie ('roommate_sid')
                                          |
                                          v
                      +---------------------------------------+
                      |         EXPRESS.JS BACKEND            |
                      | - Helmet Security Headers             |
                      | - Rate Limiting & Auth Middleware     |
                      | - Route Handlers (Auth, Profile, etc.)|
                      | - Compatibility Engine (Rule-Based)   |
                      | - Static Asset Serving                |
                      +---------------------------------------+
                                     |         |
               Session Storage Pool  |         |  Application Data Queries
                                     v         v
                      +---------------------------------------+
                      |            MYSQL 8.0+                 |
                      | - users                               |
                      | - profiles                            |
                      | - preferences                         |
                      | - interests                           |
                      | - sessions                            |
                      +---------------------------------------+
```

---

## 5. Folder Structure

```
RoommateFinal_final/
├── frontend/
│   ├── index.html              # Landing page (Hero, Features, FAQ, Footer)
│   ├── login.html              # Login form with toggle password visibility
│   ├── register.html           # Account creation with input validation
│   ├── dashboard.html          # User dashboard with progress meter & metrics
│   ├── profile.html            # Profile overview & lifestyle attributes
│   ├── edit-profile.html       # Profile editor with multi-section forms
│   ├── preferences.html        # Desired roommate criteria editor
│   ├── find-roommates.html     # Multi-filter roommate discovery & cards
│   ├── roommate-details.html   # Detailed profile & factor compatibility breakdown
│   ├── interests.html          # Incoming & outgoing connection requests
│   ├── settings.html           # Password management & account settings
│   │
│   ├── css/
│   │   ├── style.css           # Global design system tokens, typography, utilities
│   │   ├── auth.css            # Authentication form styling & spinner animations
│   │   ├── dashboard.css       # Metrics cards & progress bars
│   │   ├── profile.css         # Profile attributes & form grids
│   │   └── roommates.css       # Search layout, cards, and factor indicators
│   │
│   ├── js/
│   │   ├── api.js              # Centralized Fetch API client wrapper
│   │   ├── auth.js             # Navigation bar rendering & route guards
│   │   ├── register.js         # Register form controller
│   │   ├── login.js            # Login form controller
│   │   ├── dashboard.js        # Dashboard state & recommendation loader
│   │   ├── profile.js          # Profile view & editor logic
│   │   ├── preferences.js      # Roommate criteria form handler
│   │   ├── roommates.js        # Multi-filter search & interest modals
│   │   ├── compatibility.js    # Detailed factor breakdown view
│   │   ├── interests.js        # Tabbed requests manager (accept/reject/withdraw)
│   │   └── settings.js         # Security updates & deactivation handler
│   │
│   └── assets/
│       └── logo.svg            # Platform logo
│
├── backend/
│   ├── server.js               # Entry point with DB test & graceful shutdown
│   ├── app.js                  # Express middleware, sessions & routes
│   │
│   ├── config/
│   │   └── database.js         # MySQL2 connection pool configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── preferences.controller.js
│   │   ├── roommates.controller.js
│   │   ├── interests.controller.js
│   │   └── settings.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── preferences.routes.js
│   │   ├── roommates.routes.js
│   │   ├── interests.routes.js
│   │   └── settings.routes.js
│   │
│   ├── services/
│   │   └── compatibility.service.js   # 0-100% weighted matching algorithm
│   │
│   └── tests/
│       ├── compatibility.test.js      # Compatibility engine unit tests
│       ├── validators.test.js         # Security & input tests
│       └── routes.test.js             # Server integration & route tests
│
├── database/
│   ├── schema.sql              # Relational tables, indexes, constraints
│   ├── seed.sql                # 8 realistic sample roommate profiles
│   ├── init.js                 # Automated database initialization script
│   ├── seed.js                 # Automated seed data loader script
│   └── README.md               # Detailed database documentation
│
├── .env.example                # Template for environment configuration
├── .gitignore                  # Prevents secrets and node_modules from committing
├── package.json                # Project dependencies and operational scripts
└── README.md                   # Full documentation
```

---

## 6. Software Prerequisites

1. **Node.js**: Version 18.0.0 or higher (v24 LTS tested).
2. **npm**: Version 9.0.0 or higher.
3. **MySQL**: Version 8.0 or higher, running locally on port 3306 (or configured host).

---

## 7. Step-by-Step Installation & Setup

### Step 1: Clone or Navigate to the Workspace
```bash
cd RoommateFinal_final
```

### Step 2: Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` in an editor and enter your MySQL credentials:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=roommate_finder
DB_USER=root
DB_PASSWORD=your_actual_mysql_password

SESSION_SECRET=replace_with_a_secure_random_string_32_chars
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Initialize MySQL Database Schema
Run the automated initialization script to create the `roommate_finder` database and tables:
```bash
npm run db:init
```

### Step 5: (Optional) Seed Sample Profiles
Populate the database with 8 diverse pre-configured roommate profiles across multiple cities (New York, Boston, San Francisco, Chicago, Austin):
```bash
npm run db:seed
```

All seeded accounts have the password: `Password@123`.

---

## 8. Starting the Application

### Development Mode (with automatic reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Accessing the Web Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 9. Automated Testing

Run the full automated test suite (unit and integration tests):
```bash
npm test
```

Test coverage includes:
- **Compatibility Engine**: Overlapping budgets, distance penalty, dietary match, smoking habits, early-bird vs night-owl sleep schedule conflicts, cleanliness standards, household size, and factor reason generation.
- **Input Validation**: Email RFC validation, password matching, minimum length requirements, and budget boundary constraints (`min_budget <= max_budget`).
- **Express Server & Routing**: Static HTML page rendering, route authentication guards (401 on unauthorized access), Helmet security headers, rate limiting, and 404 JSON handling.

---

## 10. API Documentation

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create account, hashes password, starts session | No |
| `POST` | `/api/auth/login` | Authenticates credentials, regenerates session | No |
| `POST` | `/api/auth/logout` | Destroys session, clears session cookie | Yes |
| `GET` | `/api/auth/me` | Returns current authenticated user and profile state | No |

### Profile Endpoints (`/api/profile`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/profile/me` | Fetch authenticated user's private and public profile | Yes |
| `PUT` | `/api/profile/me` | Update lifestyle traits, budget, location, and bio | Yes |
| `GET` | `/api/profiles/:id` | View public profile of another roommate | No |

### Preferences Endpoints (`/api/preferences`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/preferences/me` | Fetch desired roommate criteria | Yes |
| `PUT` | `/api/preferences/me` | Update desired roommate criteria | Yes |

### Roommate Discovery (`/api/roommates`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/roommates` | Search profiles with multi-filters and match scores | No |
| `GET` | `/api/roommates/:id/compatibility` | In-depth factor-by-factor compatibility score | Yes |

### Interest Requests (`/api/interests`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/interests` | Express interest with custom message | Yes |
| `GET` | `/api/interests/received` | List incoming connection requests | Yes |
| `GET` | `/api/interests/sent` | List outgoing requests | Yes |
| `PATCH` | `/api/interests/:id` | Update status (`accepted`, `rejected`, `withdrawn`) | Yes |

### Account Settings (`/api/settings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/settings/account` | View account details | Yes |
| `PUT` | `/api/settings/password` | Update account password | Yes |
| `POST` | `/api/settings/deactivate` | Deactivate account with password confirmation | Yes |

---

## 11. Security Features

1. **Bcrypt Password Hashing**: Passwords are never stored in plaintext and hashed with 10 salt rounds.
2. **Server-Side Session Store**: Sessions are persisted in the MySQL `sessions` table. No sensitive user IDs or authentication tokens are stored in browser `localStorage`.
3. **Session Fixation Defense**: Sessions are automatically regenerated upon login and registration.
4. **Parameterized SQL Queries**: All database interactions use prepared statements (`?` placeholders) to eliminate SQL injection vulnerabilities.
5. **Brute Force Rate Limiting**: Authentication endpoints are rate-limited via `express-rate-limit`.
6. **HTTP Security Headers**: Configured with `helmet` for strict MIME type sniffing defense and XSS mitigation.
7. **Strict Authorization**: Updating or deleting a profile operates exclusively on `req.session.userId`, preventing privilege escalation.

---

## 12. Troubleshooting & Common Issues

- **Access Denied for user 'root'@'localhost'**:
  Ensure the password in `.env` matches your MySQL root password. You can test connection by running `npm run db:init`.
- **MySQL Connection Refused (`ECONNREFUSED`)**:
  Verify the MySQL service is started (e.g. `Start-Service MySQL80` on Windows PowerShell or `services.msc`).
- **Session expires unexpectedly**:
  Check that cookies are permitted in your browser and your system clock is synchronized.
