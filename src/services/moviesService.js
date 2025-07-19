import _ from "lodash";
import { TMDBService } from "../clients/tmdbService.js";
import logger from "../utils/logger.js";
import { RedisCache } from "../infrastructure/redis.js";
import {
  filterRelevantActors,
  findActorMatch,
  hasMultipleDistinctCharacters,
  normalizeCharacterForGrouping,
} from "../utils/movies.js";
import { CACHE_NAMESPACES, CACHE_KEYS } from "../utils/constants.js";
import { actors } from "../../dataForQuestions.js";

/**
 * Movies Service singleton class
 * Handles movies-specific business logic and data processing
 */
export class MoviesService {
  static instance = null;

  constructor() {
    this.redis = RedisCache.getInstance();
    this.tmdbService = TMDBService.getInstance();
  }

  /**
   * Get singleton instance of MoviesService
   * @returns {MoviesService} The singleton instance
   */
  static getInstance() {
    if (!MoviesService.instance) {
      MoviesService.instance = new MoviesService();
    }
    return MoviesService.instance;
  }

  /**
   * Get movies grouped by actor
   * @returns {Promise<Object>} Object with actor names as keys and movie arrays as values
   */
  async getMoviesPerActor() {
    try {
      const cachedData = await this.redis.getNamespaced(
        CACHE_NAMESPACES.MOVIES,
        CACHE_KEYS.MOVIES_PER_ACTOR
      );
      if (cachedData) {
        logger.debug("Returning cached movies per actor data");
        return cachedData;
      }

      logger.info("Processing movies per actor from TMDB API");
      const moviesData = await this.tmdbService.getAllMoviesData();

      const result = _.chain(moviesData)
        .mapValues((movieData, movieTitle) => {
          const relevantCast = filterRelevantActors(
            movieData.credits.cast,
            actors
          );
          return _.compact(
            _.map(relevantCast, (castMember) => {
              const matchedActor = findActorMatch(castMember, actors);
              return matchedActor
                ? { actor: matchedActor, movie: movieTitle }
                : null;
            })
          );
        })
        .values()
        .flatten()
        .groupBy("actor")
        .mapValues((entries) => _(entries).map("movie").uniq().sortBy().value())
        .value();

      const finalResult = _.chain(result)
        .toPairs()
        .sortBy(0)
        .fromPairs()
        .value();

      await this.redis.setNamespaced(
        CACHE_NAMESPACES.MOVIES,
        CACHE_KEYS.MOVIES_PER_ACTOR,
        finalResult
      );
      logger.debug("Cached movies per actor data");

      logger.info(
        `Processed movies for ${Object.keys(finalResult).length} actors`
      );
      return finalResult;
    } catch (error) {
      logger.error("Error getting movies per actor:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get actors who played multiple characters
   * @returns {Promise<Object>} Object with actor names as keys and character arrays as values
   */
  async getActorsWithMultipleCharacters() {
    try {
      const cachedData = await this.redis.getNamespaced(
        CACHE_NAMESPACES.MOVIES,
        CACHE_KEYS.ACTORS_WITH_MULTIPLE_CHARACTERS
      );
      if (cachedData) {
        logger.debug("Returning cached actors with multiple characters data");
        return cachedData;
      }

      logger.info("Processing actors with multiple characters from TMDB API");
      const moviesData = await this.tmdbService.getAllMoviesData();

      const actorCharacters = _.chain(moviesData)
        .flatMap((movieData, movieTitle) => {
          const relevantCast = filterRelevantActors(
            movieData.credits.cast,
            actors
          );
          return _.compact(
            _.map(relevantCast, (castMember) => {
              const matchedActor = findActorMatch(castMember, actors);
              return matchedActor && castMember.character
                ? {
                    actor: matchedActor,
                    movieName: movieTitle,
                    characterName: castMember.character,
                  }
                : null;
            })
          );
        })
        .groupBy("actor")
        .value();

      const result = _.chain(actorCharacters)
        .mapValues((characters) => _.uniqBy(characters, "characterName"))
        .pickBy((characters) => {
          const characterNames = _.map(characters, "characterName");
          return hasMultipleDistinctCharacters(characterNames);
        })
        .mapValues((characters) =>
          _.sortBy(characters, "movieName").map((char) => ({
            movieName: char.movieName,
            characterName: char.characterName,
          }))
        )
        .value();

      const finalResult = _.chain(result)
        .toPairs()
        .sortBy(0)
        .fromPairs()
        .value();

      await this.redis.setNamespaced(
        CACHE_NAMESPACES.MOVIES,
        CACHE_KEYS.ACTORS_WITH_MULTIPLE_CHARACTERS,
        finalResult
      );
      logger.debug("Cached actors with multiple characters data");

      logger.info(
        `Found ${
          Object.keys(finalResult).length
        } actors with multiple characters`
      );
      return finalResult;
    } catch (error) {
      logger.error("Error getting actors with multiple characters:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get characters played by multiple actors
   * @returns {Promise<Object>} Object with character names as keys and actor arrays as values
   */
  async getCharactersWithMultipleActors() {
    try {
      const cachedData = await this.redis.getNamespaced(
        CACHE_NAMESPACES.MOVIES,
        CACHE_KEYS.CHARACTERS_WITH_MULTIPLE_ACTORS
      );
      if (cachedData) {
        logger.debug("Returning cached characters with multiple actors data");
        return cachedData;
      }

      logger.info("Processing characters with multiple actors from TMDB API");
      const moviesData = await this.tmdbService.getAllMoviesData();

      const characterActors = {};
      const normalizedToOriginal = {};

      _.forEach(moviesData, (movieData, movieTitle) => {
        const relevantCast = filterRelevantActors(
          movieData.credits.cast,
          actors
        );

        _.forEach(relevantCast, (castMember) => {
          const matchedActor = findActorMatch(castMember, actors);
          if (matchedActor && castMember.character) {
            const normalizedCharacter = normalizeCharacterForGrouping(castMember.character);

            if (!characterActors[normalizedCharacter]) {
              characterActors[normalizedCharacter] = [];
              normalizedToOriginal[normalizedCharacter] = castMember.character;
            }

            characterActors[normalizedCharacter].push({
              movieName: movieTitle,
              actorName: matchedActor,
            });
          }
        });
      });

      const result = _.chain(characterActors)
        .mapValues((actors) => _.uniqBy(actors, "actorName"))
        .pickBy((actors) => actors.length > 1)
        .mapValues((actors) => _.sortBy(actors, "movieName"))
        .mapKeys((_, normalizedCharacter) => normalizedToOriginal[normalizedCharacter])
        .value();

      const finalResult = _.chain(result)
        .toPairs()
        .sortBy(0)
        .fromPairs()
        .value();

      await this.redis.setNamespaced(
        CACHE_NAMESPACES.MOVIES,
        CACHE_KEYS.CHARACTERS_WITH_MULTIPLE_ACTORS,
        finalResult
      );
      logger.debug("Cached characters with multiple actors data");

      logger.info(
        `Found ${
          Object.keys(finalResult).length
        } characters with multiple actors`
      );
      return finalResult;
    } catch (error) {
      logger.error("Error getting characters with multiple actors:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
