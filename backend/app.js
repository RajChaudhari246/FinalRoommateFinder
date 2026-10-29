/**
 * Express Application Setup & Middleware Orchestration
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');

const { pool, dbConfig } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Route Handlers
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const preferencesRoutes = require('./routes/preferences.routes');
const roommatesRoutes = require('./routes/roommates.routes');
const interestsRoutes = require('./routes/interests.routes');
const settingsRoutes = require('./routes/settings.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Enable trust proxy for Render / reverse proxies (required for HTTPS cookies and rate limiting)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Persistent Session Store in SQLite (connect-sqlite3)
const sessionStore = new SQLiteStore({
  db: 'sessions.sqlite',
  table: 'sessions',
  dir: path.join(__dirname, '../database'),
  concurrentDb: true,
  createDirIfNotExists: true
});

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    key: 'roommate_sid',
    secret: process.env.SESSION_SECRET || 'fallback_development_session_secret_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Set true in HTTPS production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Global API rate limiting
app.use('/api', apiLimiter);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/roommates', roommatesRoutes);
app.use('/api/interests', interestsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Static Frontend Asset Serving
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// Clean URL routing helpers for user-facing HTML pages
const pages = [
  'login',
  'register',
  'dashboard',
  'profile',
  'edit-profile',
  'preferences',
  'find-roommates',
  'roommate-details',
  'interests',
  'settings',
  'admin'
];

pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(frontendDir, `${page}.html`));
  });
});

// Root Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
