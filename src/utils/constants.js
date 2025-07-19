/**
 * Application constants
 * Centralized location for all constant values used throughout the application
 */

// Cache namespaces
export const CACHE_NAMESPACES = {
  MOVIES: 'movies',
  TMDB: 'tmdb',
};

// Cache keys
export const CACHE_KEYS = {
  MOVIES_PER_ACTOR: 'moviesPerActor',
  ACTORS_WITH_MULTIPLE_CHARACTERS: 'actorsWithMultipleCharacters',
  CHARACTERS_WITH_MULTIPLE_ACTORS: 'charactersWithMultipleActors',
};

// API endpoints
export const API_ENDPOINTS = {
  MOVIES_PER_ACTOR: '/moviesPerActor',
  ACTORS_WITH_MULTIPLE_CHARACTERS: '/actorsWithMultipleCharacters',
  CHARACTERS_WITH_MULTIPLE_ACTORS: '/charactersWithMultipleActors',
  HEALTH: '/health',
  ROOT: '/',
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// TMDB API constants
export const TMDB_CONFIG = {
  BATCH_SIZE: 20, // Safe concurrent batch size (well under 50 req/sec limit)
  BATCH_DELAY_MS: 250, // Delay between batches to stay well under rate limit
  RATE_LIMIT_PER_SECOND: 50, // TMDB API rate limit
};

// Application messages
export const MESSAGES = {
  NO_MOVIES_PER_ACTOR: 'No movies per actor data found',
  NO_ACTORS_WITH_MULTIPLE_CHARACTERS: 'No actors with multiple characters found',
  NO_CHARACTERS_WITH_MULTIPLE_ACTORS: 'No characters with multiple actors found',
  COULD_NOT_RETRIEVE_MOVIES_PER_ACTOR: 'Could not retrieve movies per actor',
  COULD_NOT_RETRIEVE_ACTORS_WITH_MULTIPLE_CHARACTERS: 'Could not retrieve actors with multiple characters',
  COULD_NOT_RETRIEVE_CHARACTERS_WITH_MULTIPLE_ACTORS: 'Could not retrieve characters with multiple actors',
  INTERNAL_SERVER_ERROR: 'Internal server error',
};