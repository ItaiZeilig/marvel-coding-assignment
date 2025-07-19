import { beforeAll, afterAll, describe, test, expect } from "@jest/globals";
import request from "supertest";
import express from "express";
import cors from "cors";
import appRoutes from "../../src/routes/appRoutes.js";
import { RedisCache } from "../../src/infrastructure/redis.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/", appRoutes);

describe("Movies API Integration Tests", () => {
  let redisCache;

  beforeAll(async () => {
    redisCache = RedisCache.getInstance();
    await redisCache.connect();
  });

  afterAll(async () => {
    if (redisCache) {
      await redisCache.disconnect();
    }
  });

  describe("Health Endpoint", () => {
    test("GET /health should return healthy status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("environment");
      expect(response.body).toHaveProperty("services");
      expect(response.body.services).toHaveProperty("redis");
      expect(response.body.services).toHaveProperty("cache", "enabled");
    });
  });

  describe("Root Endpoint", () => {
    test("GET / should return API information", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Movies API");
      expect(response.body).toHaveProperty("documentation", "/docs");
      expect(response.body).toHaveProperty("endpoints");
      expect(response.body.endpoints).toHaveProperty("moviesPerActor");
      expect(response.body.endpoints).toHaveProperty(
        "actorsWithMultipleCharacters"
      );
      expect(response.body.endpoints).toHaveProperty(
        "charactersWithMultipleActors"
      );
    });
  });

  describe("Movies Endpoints", () => {
    test("GET /moviesPerActor should return movies data", async () => {
      const response = await request(app).get("/moviesPerActor");

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe("object");
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });

    test("GET /actorsWithMultipleCharacters should return actors data", async () => {
      const response = await request(app).get("/actorsWithMultipleCharacters");

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe("object");
    });

    test("GET /charactersWithMultipleActors should return characters data", async () => {
      const response = await request(app).get("/charactersWithMultipleActors");

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe("object");
    });
  });

  describe("Cache Management", () => {
    test("POST /clearCache should clear cache successfully", async () => {
      const response = await request(app).post("/clearCache");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Cache cleared successfully"
      );
      expect(response.body).toHaveProperty("deletedKeys");
      expect(typeof response.body.deletedKeys).toBe("number");
    });
  });

  describe("Error Handling", () => {
    test("GET /nonexistent should return 404", async () => {
      const response = await request(app).get("/nonexistent");

      expect(response.status).toBe(404);
    });
  });
});
