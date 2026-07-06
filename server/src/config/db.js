const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectDB(retryCount = 0) {
  try {
    await mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== 'production', // build indexes only in dev
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    if (retryCount < MAX_RETRIES) {
      logger.warn(`Retrying MongoDB connection (${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_DELAY_MS}ms...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      logger.error('❌ Max MongoDB connection retries reached. Exiting process.');
      process.exit(1);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 MongoDB reconnected');
});

module.exports = connectDB;
