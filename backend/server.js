/**
 * Server Entry Point
 * Validates environment, tests database connection, and starts Express HTTP server.
 */
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { testConnection, pool } = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function startServer() {
  console.log('==================================================');
  console.log('       ROOMMATE FINDER - SERVER STARTUP          ');
  console.log('==================================================');

  // Verify Database Connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.warn('\n[Warning] Could not establish connection to SQLite database.');
    console.warn('The application is starting, but database queries may fail.');
    console.warn('Run "npm run db:init" to initialize your database.\n');
  } else {
    console.log('[Database] Ready to process requests.');
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`\n✓ Server running successfully!`);
    console.log(`  Local URL:   http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('==================================================\n');
  });

  // Graceful Shutdown
  function handleGracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await pool.end();
        console.log('SQLite database connection closed.');
      } catch (err) {
        console.error('Error closing SQLite database:', err.message);
      }
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
