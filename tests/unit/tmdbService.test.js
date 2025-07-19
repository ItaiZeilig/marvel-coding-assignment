import { jest } from "@jest/globals";

// Mock Redis
const mockCache = {
  getNamespaced: jest.fn(),
  setNamespaced: jest.fn(),
};

const mockRedisCache = {
  getInstance: jest.fn(() => mockCache),
};

jest.unstable_mockModule("../../src/infrastructure/redis.js", () => ({
  RedisCache: mockRedisCache,
}));

// Mock axios
const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
};

jest.unstable_mockModule("axios", () => ({
  default: mockAxios,
}));

const { TMDBService } = await import("../../src/clients/tmdbService.js");

describe("TMDBService", () => {
  let tmdbService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton instance before each test
    TMDBService.instance = null;

    // Get fresh instance
    tmdbService = TMDBService.getInstance();
  });

  describe("singleton pattern", () => {
    it("should return the same instance when getInstance is called multiple times", () => {
      const instance1 = TMDBService.getInstance();
      const instance2 = TMDBService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with Redis cache and axios client", () => {
      expect(tmdbService.redis).toBeDefined();
      expect(tmdbService.client).toBeDefined();
      expect(mockAxios.create).toHaveBeenCalled();
    });
  });

  describe("getMovieDetails", () => {
    it("should return cached movie data when available", async () => {
      const movieId = 1726;
      const cachedData = { id: movieId, title: "Iron Man" };
      mockCache.getNamespaced.mockResolvedValue(cachedData);

      const result = await tmdbService.getMovieDetails(movieId);

      expect(result).toEqual(cachedData);
      expect(mockCache.getNamespaced).toHaveBeenCalledWith(
        "tmdb",
        `movie:${movieId}`
      );
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it("should fetch and cache movie data when not cached", async () => {
      const movieId = 1726;
      const movieData = { id: movieId, title: "Iron Man" };
      mockCache.getNamespaced.mockResolvedValue(null);
      mockAxiosInstance.get.mockResolvedValue({ data: movieData });

      const result = await tmdbService.getMovieDetails(movieId);

      expect(result).toEqual(movieData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/movie/${movieId}`, {
        params: { append_to_response: "credits" },
      });
      expect(mockCache.setNamespaced).toHaveBeenCalledWith(
        "tmdb",
        `movie:${movieId}`,
        movieData
      );
    });
  });

  describe("axios interceptor configuration", () => {
    it("should configure request and response interceptors", () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it("should configure request interceptor to add API key", () => {
      // Verify that the request interceptor was called with a function
      const requestInterceptorCall =
        mockAxiosInstance.interceptors.request.use.mock.calls[0];
      expect(requestInterceptorCall).toBeDefined();
      expect(typeof requestInterceptorCall[0]).toBe("function");

      // Test the interceptor function
      const interceptorFn = requestInterceptorCall[0];
      const mockConfig = { params: { existing: "param" } };
      const result = interceptorFn(mockConfig);

      expect(result.params).toHaveProperty("api_key");
      expect(result.params.existing).toBe("param");
    });

    it("should configure response interceptor for logging and error handling", () => {
      // Verify that the response interceptor was called with success and error handlers
      const responseInterceptorCall =
        mockAxiosInstance.interceptors.response.use.mock.calls[0];
      expect(responseInterceptorCall).toBeDefined();
      expect(typeof responseInterceptorCall[0]).toBe("function"); // success handler
      expect(typeof responseInterceptorCall[1]).toBe("function"); // error handler
    });
  });

  describe("getAllMoviesData", () => {
    beforeEach(() => {
      // Reset singleton instance for each test
      TMDBService.instance = null;
    });

    it("should fetch and process all movies data successfully", async () => {
      const mockMoviesData = {
        1726: { id: 1726, title: "Iron Man" },
        1724: { id: 1724, title: "The Incredible Hulk" },
      };

      // Mock the fetchMovieBatchConcurrently method instead
      const mockFetchMovieBatchConcurrently = jest.fn().mockResolvedValue([
        { movieId: 1726, movieData: mockMoviesData[1726] },
        { movieId: 1724, movieData: mockMoviesData[1724] },
      ]);

      tmdbService.fetchMovieBatchConcurrently = mockFetchMovieBatchConcurrently;

      const result = await tmdbService.getAllMoviesData();

      expect(mockFetchMovieBatchConcurrently).toHaveBeenCalled();
      expect(result).toHaveProperty("Iron Man");
      expect(result).toHaveProperty("The Incredible Hulk");
    });

    it("should handle rate limiting with delays between batches", async () => {
      // Mock delay method
      const mockDelayExecution = jest.fn().mockResolvedValue();
      tmdbService.delayExecution = mockDelayExecution;

      // Mock fetchMovieBatchConcurrently to simulate multiple batches
      const mockFetchMovieBatchConcurrently = jest
        .fn()
        .mockResolvedValueOnce([
          { movieId: 1, movieData: { id: 1, title: "Movie 1" } },
        ])
        .mockResolvedValueOnce([
          { movieId: 2, movieData: { id: 2, title: "Movie 2" } },
        ]);

      tmdbService.fetchMovieBatchConcurrently = mockFetchMovieBatchConcurrently;

      // Mock a scenario with multiple batches (more than 20 movies)
      jest.doMock("../../dataForQuestions.js", () => ({
        movies: Object.fromEntries(
          Array.from({ length: 25 }, (_, i) => [`Movie ${i + 1}`, i + 1])
        ),
      }));

      await tmdbService.getAllMoviesData();

      // Should call delay between batches (not after the last one)
      expect(mockDelayExecution).toHaveBeenCalled();
    });

    it("should handle empty movies list", async () => {
      // Mock fetchMovieBatchConcurrently to return empty array
      const mockFetchMovieBatchConcurrently = jest.fn().mockResolvedValue([]);

      tmdbService.fetchMovieBatchConcurrently = mockFetchMovieBatchConcurrently;

      try {
        await tmdbService.getAllMoviesData();
        fail("Should have thrown an error for empty results");
      } catch (error) {
        expect(error.message).toBe(
          "Could not retrieve movie data from TMDB API"
        );
      }
    });

    it("should handle API errors for individual movies", async () => {
      // Mock fetchMovieBatchConcurrently to simulate partial failures
      const mockFetchMovieBatchConcurrently = jest.fn().mockResolvedValue([
        { movieId: 1726, movieData: { id: 1726, title: "Iron Man" } },
        // Note: failed requests return null and are filtered out
      ]);

      tmdbService.fetchMovieBatchConcurrently = mockFetchMovieBatchConcurrently;

      jest.doMock("../../dataForQuestions.js", () => ({
        movies: {
          "Iron Man": 1726,
          "Invalid Movie": 9999,
        },
      }));

      const result = await tmdbService.getAllMoviesData();

      // Should continue processing other movies even if one fails
      expect(Object.keys(result)).toContain("Iron Man");
      expect(mockFetchMovieBatchConcurrently).toHaveBeenCalled();
    });

    it("should throw error when no movies are retrieved", async () => {
      tmdbService.getMovieDetails = jest
        .fn()
        .mockRejectedValue(new Error("API Error"));

      jest.doMock("../../dataForQuestions.js", () => ({
        movies: { "Test Movie": 1 },
      }));

      await expect(tmdbService.getAllMoviesData()).rejects.toThrow(
        "Could not retrieve movie data from TMDB API"
      );
    });
  });

  describe("fetchMovieBatchConcurrently", () => {
    it("should process movies concurrently for better performance", async () => {
      const batch = [1726, 1724];
      const mockMovieData = [
        { id: 1726, title: "Iron Man" },
        { id: 1724, title: "The Incredible Hulk" },
      ];

      const mockGetMovieDetails = jest
        .fn()
        .mockResolvedValueOnce(mockMovieData[0])
        .mockResolvedValueOnce(mockMovieData[1]);

      tmdbService.getMovieDetails = mockGetMovieDetails;

      const result = await tmdbService.fetchMovieBatchConcurrently(batch);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ movieId: 1726, movieData: mockMovieData[0] });
      expect(result[1]).toEqual({ movieId: 1724, movieData: mockMovieData[1] });
      expect(mockGetMovieDetails).toHaveBeenCalledTimes(2);
    });

    it("should continue processing when individual movie fails", async () => {
      const batch = [1726, 9999];
      const mockMovieData = { id: 1726, title: "Iron Man" };

      const mockGetMovieDetails = jest
        .fn()
        .mockResolvedValueOnce(mockMovieData)
        .mockRejectedValueOnce(new Error("Movie not found"));

      tmdbService.getMovieDetails = mockGetMovieDetails;

      const result = await tmdbService.fetchMovieBatchConcurrently(batch);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ movieId: 1726, movieData: mockMovieData });
    });

    it("should handle empty batch", async () => {
      const result = await tmdbService.fetchMovieBatchConcurrently([]);
      expect(result).toEqual([]);
    });
  });

  describe("delayExecution", () => {
    it("should delay for specified milliseconds", async () => {
      const startTime = Date.now();
      await tmdbService.delayExecution(10);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(9); // Allow for small timing variations
    });

    it("should handle zero delay", async () => {
      const startTime = Date.now();
      await tmdbService.delayExecution(0);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5);
    });
  });

  describe("error handling", () => {
    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network Error");
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(tmdbService.getMovieDetails(1726)).rejects.toThrow(
        "Network Error"
      );
    });

    it("should handle timeout errors", async () => {
      const timeoutError = new Error("Timeout");
      timeoutError.code = "ECONNABORTED";
      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      await expect(tmdbService.getMovieDetails(1726)).rejects.toThrow(
        "Timeout"
      );
    });
  });
});
