// Vercel API handler - this is the entry point for all requests
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Import routes
const authRoutes = require('../routes/auth');
const tokenRoutes = require('../routes/tokens');
const userRoutes = require('../routes/users');
const rewardRoutes = require('../routes/rewards');
const feedbackRoutes = require('../routes/feedback');

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
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint for testing
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Token of Thanks API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is healthy'
  });
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    await connectDB();
    
    // Test a simple query
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
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

// MongoDB connection for serverless
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) {
    console.log('📊 MongoDB already connected, reusing connection');
    return;
  }
  
  if (connectionPromise) {
    console.log('📊 MongoDB connection in progress, waiting...');
    return connectionPromise;
  }
  
  console.log('📊 Attempting to connect to MongoDB...');
  console.log('📊 MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('📊 NODE_ENV:', process.env.NODE_ENV);
  
  connectionPromise = (async () => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds timeout
      });
      
      isConnected = true;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`✅ Database: ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      console.error('❌ Full error:', error);
      isConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();
  
  return connectionPromise;
};

// Connect to MongoDB on first request
app.use(async (req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Checking MongoDB connection`);
  
  try {
    await connectDB();
    console.log('✅ MongoDB connection verified');
    next();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

module.exports = app;
