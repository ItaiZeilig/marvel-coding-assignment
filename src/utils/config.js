import dotenv from "dotenv";
import _ from "lodash";

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration object that centralizes all application settings
 * Uses environment variables with fallback defaults
 */
const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
  },

  // TMDB API Configuration
  tmdb: {
    apiKey: process.env.TMDB_API_KEY,
    baseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
    timeout: parseInt(process.env.TMDB_TIMEOUT_MS) || 500,
    batchSize: 20, // Safe concurrent batch size (well under 50 req/sec limit)
    batchDelayMs: 250, // Delay between batches to stay well under rate limit
    rateLimitPerSecond: 50, // TMDB API rate limit
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === "true",
  },

  // Note: Rate limiting is handled by AWS API Gateway
};

/**
 * Validates that all required configuration values are present using Lodash
 * @throws {Error} If required configuration is missing
 */
function validateRequiredConfig() {
  const requiredFields = [
    { field: "tmdb.apiKey", value: config.tmdb.apiKey, name: "TMDB_API_KEY" },
    { field: "redis.url", value: config.redis.url, name: "REDIS_URL" },
  ];

  const missingFields = _.filter(requiredFields, ({ value }) =>
    _.isEmpty(value)
  );

  if (!_.isEmpty(missingFields)) {
    const missingFieldNames = _.map(missingFields, "name").join(", ");
    throw new Error(
      `Missing required environment variables: ${missingFieldNames}. Please check your .env file.`
    );
  }
}


// Validate configuration on module load
validateRequiredConfig();

export default config;
