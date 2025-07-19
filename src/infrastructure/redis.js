import { createClient } from "redis";
import _ from "lodash";
import logger from "../utils/logger.js";
import config from "../utils/config.js";

/**
 * Production-ready Redis cache implementation with singleton pattern
 * Provides caching functionality with JSON serialization, TTL support, and namespace organization
 * Supports both singleton usage and dependency injection for testing
 */
export class RedisCache {
  static instance = null;
  /**
   * Create a new RedisCache instance
   * @param {Object} config - Redis configuration
   * @param {string} config.url - Redis connection URL
   * @param {number} [config.defaultTTL=3600] - Default TTL in seconds
   * @param {number} [config.retryAttempts=3] - Number of retry attempts
   * @param {number} [config.retryDelay=1000] - Delay between retries in ms
   */
  constructor(config) {
    if (!config) {
      throw new Error("Configuration is required for RedisCache");
    }

    if (!config.url) {
      throw new Error("Redis URL is required in configuration");
    }

    this.client = null;
    this.isConnected = false;
    this.defaultTTL = config.defaultTTL || 3600;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Redis connection configuration
    this.config = {
      url: config.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error("Redis connection failed after 10 retries");
          }
          return Math.min(retries * 50, 1000);
        },
      },
    };
  }

  /**
   * Initialize Redis client connection
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (this.client && this.isConnected) {
        return;
      }

      this.client = createClient(this.config);

      // Set up error handlers
      this.client.on("error", (err) => {
        logger.error("Redis Client Error:", {
          error: err.message,
          stack: err.stack,
        });
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Redis client connected");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        logger.info("Redis client disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      logger.error("Failed to connect to Redis:", {
        error: error.message,
        stack: error.stack,
      });
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      logger.error("Error disconnecting from Redis:", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Check if Redis is connected and available
   * @returns {boolean} True if connected and available
   */
  isAvailable() {
    return !!(this.client && this.isConnected);
  }

  /**
   * Store data in Redis with JSON serialization and TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to store (will be JSON serialized)
   * @param {number} [ttl] - Time to live in seconds (optional)
   * @returns {Promise<boolean>} True if successful
   */
  async set(key, data, ttl = null) {
    this.ensureRedisConnected();

    try {
      const serializedData = JSON.stringify(data);
      const expiration = ttl || this.defaultTTL;
      await this.client.setEx(key, expiration, serializedData);
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, {
        error: error.message,
        key,
      });
      throw error;
    }
  }

  /**
   * Retrieve data from Redis with JSON deserialization
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Deserialized data or null if not found
   */
  async get(key) {
    if (!this.isAvailable()) {
      return null; // Return null when Redis is disconnected to allow graceful fallback
    }

    try {
      const serializedData = await this.client.get(key);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, {
        error: error.message,
        key,
      });
      return null; // Return null on error to allow application fallback behavior
    }
  }

  /**
   * Store data with a namespaced key format
   * @param {string} namespace - Namespace for the data (e.g., 'user', 'session', 'api')
   * @param {string} id - Unique identifier
   * @param {any} data - Data object to store
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<boolean>} True if successful
   */
  async setNamespaced(namespace, id, data, ttl = null) {
    const key = `${namespace}:${id}`;
    return await this.set(key, data, ttl);
  }

  /**
   * Retrieve data by namespace and id
   * @param {string} namespace - Namespace for the data
   * @param {string} id - Unique identifier
   * @returns {Promise<any|null>} Deserialized data or null if not found
   */
  async getNamespaced(namespace, id) {
    const key = `${namespace}:${id}`;
    return await this.get(key);
  }

  /**
   * Invalidate all cache entries for specific namespaces
   * @param {string[]} namespaces - Array of namespaces to invalidate
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateNamespaces(namespaces) {
    this.ensureRedisConnected();

    try {
      // Retrieve all keys and group by namespace for organized deletion
      const allKeys = await this.client.keys("*");

      const keysByNamespace = _.groupBy(allKeys, (key) => {
        const namespace = _.first(key.split(":"));
        return _.includes(namespaces, namespace) ? namespace : "other";
      });

      const keysToDelete = _.chain(keysByNamespace)
        .omit("other")
        .values()
        .flatten()
        .value();

      if (keysToDelete.length > 0) {
        await this.client.del(keysToDelete);

        const deletedByNamespace = _.chain(keysByNamespace)
          .omit("other")
          .mapValues((keys) => keys.length)
          .value();

        logger.info("Invalidated cache keys by namespace:", {
          ...deletedByNamespace,
          totalDeleted: keysToDelete.length,
        });
      }

      return keysToDelete.length;
    } catch (error) {
      logger.error("Error invalidating cache namespaces:", {
        error: error.message,
        namespaces,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Ensure Redis connection is available, throws error if not connected
   * @throws {Error} If Redis is not connected
   * @private
   */
  ensureRedisConnected() {
    if (!this.isAvailable()) {
      throw new Error("Redis client is not connected");
    }
  }

  /**
   * Get singleton instance of RedisCache
   * @returns {RedisCache} The singleton instance
   */
  static getInstance() {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache({
        url: config.redis.url,
        defaultTTL: config.cache.ttl,
      });
    }
    return RedisCache.instance;
  }
}

/**
 * Factory function to create RedisCache with configuration
 * @param {Object} config - Redis configuration
 * @returns {RedisCache} New RedisCache instance
 */
export function createRedisCache(config) {
  return new RedisCache(config);
}
