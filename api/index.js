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
  'https://tokenofthankss.vercel.app',
  'https://tokenofthanks-rouge.vercel.app'
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
    console.log('🧪 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('🧪 Connection state before:', mongoose.connection.readyState);
    
    await connectDB();
    
    console.log('🧪 Connection state after:', mongoose.connection.readyState);
    
    // Test a simple query
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    
    // Test a findOne operation (the one that's failing)
    const testUser = await User.findOne({ email: 'test@example.com' }).lean();
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount: userCount,
      connectionState: mongoose.connection.readyState,
      connectionHost: mongoose.connection.host,
      connectionName: mongoose.connection.name,
      testQuerySuccess: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('❌ Error type:', error.name);
    console.error('❌ Connection state:', mongoose.connection.readyState);
    
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      errorType: error.name,
      connectionState: mongoose.connection.readyState,
      mongodbUriExists: !!process.env.MONGODB_URI
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
let retryCount = 0;
const MAX_RETRIES = 3;

const connectDB = async () => {
  // Check if already connected and connection is still alive
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📊 MongoDB already connected, reusing connection');
    return;
  }
  
  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log('📊 MongoDB connection in progress, waiting...');
    return connectionPromise;
  }
  
  console.log('📊 Attempting to connect to MongoDB...');
  console.log('📊 MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('📊 NODE_ENV:', process.env.NODE_ENV);
  console.log('📊 Retry count:', retryCount);
  
  connectionPromise = (async () => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      // Validate MongoDB URI format
      if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MongoDB URI format');
      }
      
      // Close any existing connection first
      if (mongoose.connection.readyState !== 0) {
        console.log('📊 Closing existing connection...');
        await mongoose.connection.close();
      }
      
      // Add retry delay for subsequent attempts
      if (retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Exponential backoff, max 10s
        console.log(`📊 Retrying connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // 30 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds timeout
        connectTimeoutMS: 30000, // 30 seconds connection timeout
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Maintain a minimum of 2 socket connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
        retryWrites: true, // Enable retryable writes
        w: 'majority', // Write concern
      });
      
      isConnected = true;
      retryCount = 0; // Reset retry count on successful connection
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`✅ Database: ${conn.connection.name}`);
      console.log(`✅ Connection state: ${mongoose.connection.readyState}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        isConnected = false;
        connectionPromise = null;
        retryCount++;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('📊 MongoDB disconnected');
        isConnected = false;
        connectionPromise = null;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('📊 MongoDB reconnected');
        isConnected = true;
        retryCount = 0;
      });
      
      return conn;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      console.error('❌ Error type:', error.name);
      console.error('❌ Full error:', error);
      
      retryCount++;
      isConnected = false;
      connectionPromise = null;
      
      // If we haven't exceeded max retries, don't throw error yet
      if (retryCount < MAX_RETRIES) {
        console.log(`📊 Will retry connection (${retryCount}/${MAX_RETRIES})`);
        return null; // Return null instead of throwing
      } else {
        console.error(`❌ Max retries (${MAX_RETRIES}) exceeded`);
        throw error;
      }
    }
  })();
  
  return connectionPromise;
};

// Connect to MongoDB on first request
app.use(async (req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Checking MongoDB connection`);
  
  try {
    const connection = await connectDB();
    
    // If connection returned null (retry scenario), wait a bit and try again
    if (connection === null) {
      console.log('📊 Connection in retry mode, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      const retryConnection = await connectDB();
      if (retryConnection === null) {
        throw new Error('Connection retry failed');
      }
    }
    
    console.log('✅ MongoDB connection verified');
    next();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('❌ Connection state:', mongoose.connection.readyState);
    
    // Provide more specific error messages
    let errorMessage = 'Database connection failed';
    if (error.message.includes('MONGODB_URI')) {
      errorMessage = 'Database configuration error';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Database connection timeout';
    } else if (error.message.includes('network')) {
      errorMessage = 'Database network error';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error',
      connectionState: mongoose.connection.readyState
    });
  }
});

module.exports = app;
