// import path from 'path'; // Currently unused

import dotenv from 'dotenv';

// Load environment variables
const result = dotenv.config();

if (result.error && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn('Warning: .env file not found. Using default values.');
}

const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sudoqmaestro',
  
  // Session Configuration
  sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret-change-in-production',
  
  // OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  
  // Security Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    path: process.env.UPLOAD_PATH || 'uploads/',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  // Logging
  log: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
  
  // Validation
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate required environment variables
const requiredVars = [];
if (config.isProduction) {
  requiredVars.push('SESSION_SECRET', 'JWT_SECRET', 'MONGODB_URI');
}

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default config;
