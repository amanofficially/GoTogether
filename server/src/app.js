const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const { clientUrl, isProd } = require('./config/env');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Trust first proxy (needed on Render/Heroku/Nginx for correct secure cookies & IPs)
app.set('trust proxy', 1);

// ---------- Security middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: clientUrl,
    credentials: true, // allow the refresh-token cookie to be sent
  })
);
app.use(mongoSanitize()); // strips $ and . operators from req.body/query/params
app.use(hpp()); // protects against HTTP parameter pollution

// ---------- Body parsing ----------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// ---------- Logging ----------
app.use(
  morgan(isProd ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http?.(msg.trim()) || logger.info(msg.trim()) },
  })
);

// ---------- Rate limiting (applies to all /api routes) ----------
app.use('/api', apiLimiter);

// ---------- Health check ----------
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'GoTogether API is healthy', timestamp: new Date() });
});

// ---------- API routes ----------
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/rides`, rideRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/ratings`, ratingRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// ---------- 404 + error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
