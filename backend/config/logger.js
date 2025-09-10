import winston from 'winston';

import config from './env.js';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

// Create logger configuration
const loggerConfig = {
  level: config.log.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'sudoqmaestro-backend' },
  transports: []
};

// Console transport for development
if (config.isDevelopment) {
  loggerConfig.transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    })
  );
}

// File transports for production
if (config.isProduction) {
  loggerConfig.format = combine(
    loggerConfig.format,
    json()
  );
  
  loggerConfig.transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  );
} else {
  // Also add console for non-production
  loggerConfig.transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    })
  );
}

// Create logger instance
const logger = winston.createLogger(loggerConfig);

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
