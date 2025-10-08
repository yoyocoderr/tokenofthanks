const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');
const userRoutes = require('./routes/users');
const rewardRoutes = require('./routes/rewards');
const feedbackRoutes = require('./routes/feedback');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();
const additionalAllowedOrigins = [
  'https://tokenofthankss.vercel.app'
];

// Log the FRONTEND_URL for debugging
console.log('🔍 FRONTEND_URL:', JSON.stringify(allowedOrigin));
console.log('🔍 FRONTEND_URL length:', allowedOrigin.length);
console.log('🔍 FRONTEND_URL char codes:', Array.from(allowedOrigin).map(c => c.charCodeAt(0)));

// Validate the origin URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

if (!isValidUrl(allowedOrigin)) {
  console.error('❌ Invalid FRONTEND_URL:', allowedOrigin);
  console.error('❌ Please check your environment variables for extra spaces or newlines');
  process.exit(1);
}

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [allowedOrigin, ...additionalAllowedOrigins];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('🚫 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is healthy'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('❌ Stack:', err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'CORS error'
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email notifications: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer(); 