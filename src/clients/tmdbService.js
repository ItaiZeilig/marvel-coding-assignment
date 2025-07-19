import axios from "axios";
import _ from "lodash";
import config from "../utils/config.js";
import logger from "../utils/logger.js";
import { RedisCache } from "../infrastructure/redis.js";
import { CACHE_NAMESPACES, TMDB_CONFIG } from "../utils/constants.js";
import { movies } from "../../dataForQuestions.js";

/**
 * TMDB Service singleton class
 * Handles all TMDB API interactions and movie data processing
 */
export class TMDBService {
  static instance = null;

  constructor() {
    this.redis = RedisCache.getInstance();
    this.client = axios.create({
      baseURL: config.tmdb.baseUrl,
      timeout: config.tmdb.timeout,
    });
    
    this.configureAxiosInterceptors();
  }

  /**
   * Configure axios interceptors for API key injection and logging
   * @private
   */
  configureAxiosInterceptors() {
    // Add API key to all requests
    this.client.interceptors.request.use((requestConfig) => {
      requestConfig.params = { ...requestConfig.params, api_key: config.tmdb.apiKey };
      return requestConfig;
    });

    // Log responses and handle errors
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`TMDB API: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`TMDB API Error: ${error.response?.status} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get singleton instance of TMDBService
   * @returns {TMDBService} The singleton instance
   */
  static getInstance() {
    if (!TMDBService.instance) {
      TMDBService.instance = new TMDBService();
    }
    return TMDBService.instance;
  }

  /**
   * Get movie details by ID with caching
   * @param {number} movieId - TMDB movie ID
   * @returns {Promise<Object>} Movie data with credits
   */
  async getMovieDetails(movieId) {
    // Check cache for existing movie data
    const cachedMovie = await this.redis.getNamespaced(CACHE_NAMESPACES.TMDB, `movie:${movieId}`);
    if (cachedMovie) {
      logger.debug(`Cache hit for movie ID: ${movieId}`);
      return cachedMovie;
    }

    // Fetch from TMDB API (interceptors handle logging and errors)
    const response = await this.client.get(`/movie/${movieId}`, {
      params: {
        append_to_response: "credits",
      },
    });

    // Store movie data in cache for future requests
    await this.redis.setNamespaced(CACHE_NAMESPACES.TMDB, `movie:${movieId}`, response.data);
    logger.debug(`Cached movie data for ID: ${movieId}`);

    return response.data;
  }

  /**
   * Get all Marvel movies data in batches
   * @returns {Promise<Object>} Object with movie names as keys and movie data as values
   */
  async getAllMoviesData() {
    try {
      const movieIds = _.values(movies);
      const movieIdToName = _.invert(movies);
      const batchSize = TMDB_CONFIG.BATCH_SIZE;
      const results = [];

      logger.info(
        `Fetching data for ${movieIds.length} Marvel movies in batches of ${batchSize}`
      );

      const batches = _.chunk(movieIds, batchSize);

      for (const batch of batches) {
        const batchResult = await this.fetchMovieBatchConcurrently(batch);
        results.push(batchResult);
        
        // Only add delay between batches, not after the last one
        if (batches.indexOf(batch) < batches.length - 1) {
          logger.debug(`Batch completed, applying rate limit delay`, {
            batchSize: batch.length,
          });
          await this.delayExecution(TMDB_CONFIG.BATCH_DELAY_MS);
        }
      }

      const flattenedResults = _.flatten(results);

      if (_.isEmpty(flattenedResults)) {
        throw new Error("Could not retrieve movie data from TMDB API");
      }

      const movieMap = _.chain(flattenedResults)
        .keyBy("movieId")
        .mapKeys((value, key) => movieIdToName[key])
        .mapValues("movieData")
        .value();

      logger.info(
        `Successfully fetched data for ${flattenedResults.length} movies`
      );
      return movieMap;
    } catch (error) {
      logger.error("Error fetching all movies data:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Fetch movie data for a batch of movie IDs concurrently with rate limiting
   * @param {Array} batch - Array of movie IDs
   * @returns {Promise<Array>} Array of movie data objects
   * @private
   */
  async fetchMovieBatchConcurrently(batch) {
    // Process all movies in batch concurrently since batch size (20) is well under rate limit (50/sec)
    const moviePromises = batch.map(async (movieId) => {
      try {
        const movieData = await this.getMovieDetails(movieId);
        return { movieId, movieData };
      } catch (error) {
        logger.error(`Error fetching movie data for ID ${movieId}:`, {
          error: error.message,
        });
        return null; // Return null for failed requests to maintain array structure
      }
    });
    
    const results = await Promise.all(moviePromises);
    // Filter out null results from failed requests
    return results.filter(result => result !== null);
  }

  /**
   * Delay execution for specified milliseconds to implement rate limiting
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @private
   */
  delayExecution(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

}
