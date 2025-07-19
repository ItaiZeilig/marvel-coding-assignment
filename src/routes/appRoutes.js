import express from "express";
import _ from "lodash";
import config from "../utils/config.js";
import logger from "../utils/logger.js";
import { RedisCache } from "../infrastructure/redis.js";
import { MoviesService } from "../services/moviesService.js";

const router = express.Router();

// Initialize singleton service
const moviesService = MoviesService.getInstance();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get("/health", (req, res) => {
  const redisCache = RedisCache.getInstance();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    services: {
      redis: redisCache.isAvailable() ? "connected" : "disconnected",
      cache: "enabled",
    },
  });
});

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Movies API",
    documentation: `/docs`,
    endpoints: {
      moviesPerActor: "/moviesPerActor",
      actorsWithMultipleCharacters: "/actorsWithMultipleCharacters",
      charactersWithMultipleActors: "/charactersWithMultipleActors",
    },
  });
});


/**
 * @swagger
 * /moviesPerActor:
 *   get:
 *     summary: Get movies per actor
 *     description: Returns a list of Movies movies each actor has appeared in
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               "Robert Downey Jr.": ["Iron Man", "Iron Man 2", "The Avengers"]
 *               "Chris Evans": ["Captain America: The First Avenger", "The Avengers"]
 *       500:
 *         description: Internal server error
 */
router.get("/moviesPerActor", async (req, res) => {
  try {
    logger.debug("Processing request for movies per actor");
    const result = await moviesService.getMoviesPerActor();

    if (_.isEmpty(result)) {
      logger.warn("No movies per actor data found");
      return res.status(404).json({ msg: "No movies per actor data found" });
    }

    res.json(result);
    logger.debug("Successfully returned movies per actor data", {
      actorCount: _.keys(result).length,
    });
  } catch (error) {
    logger.error("Error in /moviesPerActor endpoint:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ msg: "Could not retrieve movies per actor" });
  }
});

/**
 * @swagger
 * /actorsWithMultipleCharacters:
 *   get:
 *     summary: Get actors with multiple characters
 *     description: Returns actors who have played more than one Movies character
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get("/actorsWithMultipleCharacters", async (req, res) => {
  try {
    logger.debug("Processing request for actors with multiple characters");
    const result = await moviesService.getActorsWithMultipleCharacters();

    if (_.isEmpty(result)) {
      logger.warn("No actors with multiple characters found");
      return res
        .status(404)
        .json({ msg: "No actors with multiple characters found" });
    }

    res.json(result);
    logger.debug("Successfully returned actors with multiple characters data", {
      actorCount: _.keys(result).length,
    });
  } catch (error) {
    logger.error("Error in /actorsWithMultipleCharacters endpoint:", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ msg: "Could not retrieve actors with multiple characters" });
  }
});

/**
 * @swagger
 * /charactersWithMultipleActors:
 *   get:
 *     summary: Get characters with multiple actors
 *     description: Returns characters that have been played by more than one actor
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.get("/charactersWithMultipleActors", async (req, res) => {
  try {
    logger.debug("Processing request for characters with multiple actors");
    const result = await moviesService.getCharactersWithMultipleActors();

    if (_.isEmpty(result)) {
      logger.warn("No characters with multiple actors found");
      return res
        .status(404)
        .json({ msg: "No characters with multiple actors found" });
    }

    res.json(result);
    logger.debug("Successfully returned characters with multiple actors data", {
      characterCount: _.keys(result).length,
    });
  } catch (error) {
    logger.error("Error in /charactersWithMultipleActors endpoint:", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ msg: "Could not retrieve characters with multiple actors" });
  }
});

export default router;
