const express = require('express');
require('dotenv').config();

const { initializeDatabase, configurePassport } = require('./config');
const { setupMiddleware } = require('./middlewares');
const routes = require('./routes');
require('./cron');

// Configuration constants
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Setup middleware and passport
setupMiddleware(app);
configurePassport();

// Route setup
app.use(routes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();