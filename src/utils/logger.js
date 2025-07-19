import winston from "winston";
import config from "./config.js";

/**
 * Logger configuration with different levels and formats
 * Supports both console and file logging with appropriate formatting
 */

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for different log levels
const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to winston
winston.addColors(logColors);

// Create custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

// Create custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level based on environment
const determineLogLevelByEnvironment = () => {
  if (config.server.env === "production") {
    return "info";
  } else if (config.server.env === "test") {
    return "error";
  }
  return "debug";
};

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: determineLogLevelByEnvironment(),
    format: consoleFormat,
  }),
];

// Add file transport in production
if (config.server.env === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: determineLogLevelByEnvironment(),
  format: fileFormat,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Create a stream for HTTP request logging (for morgan or similar)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
