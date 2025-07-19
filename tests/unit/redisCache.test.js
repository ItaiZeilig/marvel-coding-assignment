import { jest } from "@jest/globals";
import { RedisCache } from "../../src/infrastructure/redis.js";

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  flushDb: jest.fn(),
  info: jest.fn(),
  keys: jest.fn(),
  mGet: jest.fn(),
  multi: jest.fn(),
};

// Mock Redis module
jest.mock("redis", () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe("RedisCache", () => {
  let redisCache;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create RedisCache with required config
    redisCache = new RedisCache({
      url: "redis://localhost:6379",
      defaultTTL: 3600,
    });
    redisCache.client = mockRedisClient;
    redisCache.isConnected = true;
  });

  describe("setNamespaced", () => {
    it("should set data with namespaced key", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      const result = await redisCache.setNamespaced("test", "id1", {
        data: "value",
      });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "test:id1",
        3600,
        JSON.stringify({ data: "value" })
      );
      expect(result).toBe(true);
    });

    it("should use custom TTL", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await redisCache.setNamespaced("test", "id1", { data: "value" }, 7200);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "test:id1",
        7200,
        JSON.stringify({ data: "value" })
      );
    });
  });

  describe("getNamespaced", () => {
    it("should get data with namespaced key", async () => {
      const testData = { data: "value" };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await redisCache.getNamespaced("test", "id1");

      expect(mockRedisClient.get).toHaveBeenCalledWith("test:id1");
      expect(result).toEqual(testData);
    });

    it("should return null for non-existent key", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisCache.getNamespaced("test", "id1");

      expect(result).toBeNull();
    });
  });

  describe("invalidateNamespaces", () => {
    it("should invalidate specific namespaces", async () => {
      const allKeys = ["user:1", "user:2", "session:1", "other:1"];
      mockRedisClient.keys.mockResolvedValue(allKeys);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await redisCache.invalidateNamespaces(["user", "session"]);

      expect(mockRedisClient.keys).toHaveBeenCalledWith("*");
      expect(mockRedisClient.del).toHaveBeenCalledWith([
        "user:1",
        "user:2",
        "session:1",
      ]);
      expect(result).toBe(3);
    });

    it("should handle empty namespace list", async () => {
      mockRedisClient.keys.mockResolvedValue(["user:1", "user:2"]);

      const result = await redisCache.invalidateNamespaces([]);

      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe("isAvailable", () => {
    it("should return true when connected", () => {
      redisCache.isConnected = true;
      expect(redisCache.isAvailable()).toBe(true);
    });

    it("should return false when not connected", () => {
      redisCache.isConnected = false;
      expect(redisCache.isAvailable()).toBe(false);
    });

    it("should return false when client is null", () => {
      redisCache.client = null;
      redisCache.isConnected = true;
      expect(redisCache.isAvailable()).toBe(false);
    });
  });

  describe("set method", () => {
    it("should store data with default TTL", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      const result = await redisCache.set("testKey", { data: "value" });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "testKey",
        3600,
        JSON.stringify({ data: "value" })
      );
      expect(result).toBe(true);
    });

    it("should store data with custom TTL", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      const result = await redisCache.set("testKey", { data: "value" }, 7200);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "testKey",
        7200,
        JSON.stringify({ data: "value" })
      );
      expect(result).toBe(true);
    });

    it("should handle complex objects", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");
      const complexData = {
        nested: { data: "value" },
        array: [1, 2, 3],
        number: 42,
        boolean: true,
      };

      await redisCache.set("complexKey", complexData);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "complexKey",
        3600,
        JSON.stringify(complexData)
      );
    });

    it("should throw error when Redis is not connected", async () => {
      redisCache.isConnected = false;

      await expect(redisCache.set("key", "value")).rejects.toThrow(
        "Redis client is not connected"
      );
    });

    it("should handle Redis errors", async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis error"));

      await expect(redisCache.set("key", "value")).rejects.toThrow(
        "Redis error"
      );
    });
  });

  describe("get method", () => {
    it("should retrieve and parse data", async () => {
      const testData = { data: "value" };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await redisCache.get("testKey");

      expect(mockRedisClient.get).toHaveBeenCalledWith("testKey");
      expect(result).toEqual(testData);
    });

    it("should return null when key doesn't exist", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisCache.get("nonExistentKey");

      expect(result).toBeNull();
    });

    it("should return null when Redis is not available", async () => {
      redisCache.isConnected = false;

      const result = await redisCache.get("testKey");

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it("should handle JSON parsing errors gracefully", async () => {
      mockRedisClient.get.mockResolvedValue("invalid json");

      const result = await redisCache.get("testKey");

      expect(result).toBeNull();
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

      const result = await redisCache.get("testKey");

      expect(result).toBeNull();
    });
  });

  describe("connect method", () => {
    beforeEach(() => {
      // Reset the cache instance for connection tests but keep the mock
      redisCache.isConnected = false;
      // Don't set client to null, keep the mock
    });

    it("should skip connection if already connected", async () => {
      redisCache.client = mockRedisClient;
      redisCache.isConnected = true;

      await redisCache.connect();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
    });
  });

  describe("disconnect method", () => {
    it("should disconnect successfully", async () => {
      redisCache.isConnected = true;
      mockRedisClient.disconnect.mockResolvedValue();

      await redisCache.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
      expect(redisCache.isConnected).toBe(false);
    });

    it("should handle disconnect when not connected", async () => {
      redisCache.client = null;
      redisCache.isConnected = false;

      await redisCache.disconnect();

      expect(mockRedisClient.disconnect).not.toHaveBeenCalled();
    });

    it("should handle disconnect errors gracefully", async () => {
      redisCache.isConnected = true;
      mockRedisClient.disconnect.mockRejectedValue(
        new Error("Disconnect error")
      );

      await redisCache.disconnect();

      // Should not throw, just log the error
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });

  describe("ensureRedisConnected method", () => {
    it("should not throw when connected", () => {
      redisCache.isConnected = true;
      redisCache.client = mockRedisClient;

      expect(() => redisCache.ensureRedisConnected()).not.toThrow();
    });

    it("should throw when not connected", () => {
      redisCache.isConnected = false;

      expect(() => redisCache.ensureRedisConnected()).toThrow(
        "Redis client is not connected"
      );
    });

    it("should throw when client is null", () => {
      redisCache.client = null;
      redisCache.isConnected = true;

      expect(() => redisCache.ensureRedisConnected()).toThrow(
        "Redis client is not connected"
      );
    });
  });

  describe("edge cases and error scenarios", () => {
    it("should handle null data in set method", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await redisCache.set("nullKey", null);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "nullKey",
        3600,
        "null"
      );
    });

    it("should handle undefined data in set method", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await redisCache.set("undefinedKey", undefined);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "undefinedKey",
        3600,
        JSON.stringify(undefined) // This actually becomes undefined, then string "undefined"
      );
    });

    it("should handle very large data objects", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");
      const largeData = { data: "x".repeat(10000) };

      await redisCache.set("largeKey", largeData);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "largeKey",
        3600,
        JSON.stringify(largeData)
      );
    });

    it("should handle special characters in keys", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await redisCache.set("key:with:colons", "value");
      await redisCache.set("key with spaces", "value");
      await redisCache.set("key-with-dashes", "value");

      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(3);
    });
  });
});
