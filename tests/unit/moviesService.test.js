import { jest } from "@jest/globals";

// Mock utility functions
const mockFilterRelevantActors = jest.fn();
const mockFindActorMatch = jest.fn();
const mockHasMultipleDistinctCharacters = jest.fn();
const mockNormalizeCharacterForGrouping = jest.fn();

jest.unstable_mockModule("../../src/utils/movies.js", () => ({
  filterRelevantActors: mockFilterRelevantActors,
  findActorMatch: mockFindActorMatch,
  hasMultipleDistinctCharacters: mockHasMultipleDistinctCharacters,
  normalizeCharacterForGrouping: mockNormalizeCharacterForGrouping,
}));

// Mock TMDB Service
const mockGetAllMoviesData = jest.fn();
const mockTMDBService = {
  getInstance: jest.fn(() => ({
    getAllMoviesData: mockGetAllMoviesData,
  })),
};

jest.unstable_mockModule("../../src/clients/tmdbService.js", () => ({
  TMDBService: mockTMDBService,
}));

// Mock Redis
const mockCache = {
  getNamespaced: jest.fn(),
  setNamespaced: jest.fn(),
  invalidateNamespaces: jest.fn(),
};

const mockRedisCache = {
  getInstance: jest.fn(() => mockCache),
};

jest.unstable_mockModule("../../src/infrastructure/redis.js", () => ({
  RedisCache: mockRedisCache,
}));

const { MoviesService } = await import("../../src/services/moviesService.js");

describe("MoviesService", () => {
  let moviesService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create service instance using singleton pattern
    moviesService = MoviesService.getInstance();

    // Set up default mock implementations
    mockCache.getNamespaced.mockResolvedValue(null);
    mockCache.setNamespaced.mockResolvedValue(true);

    mockGetAllMoviesData.mockResolvedValue({
      "Iron Man": {
        credits: {
          cast: [
            { name: "Robert Downey Jr.", character: "Tony Stark / Iron Man" },
          ],
        },
      },
    });

    // Mock utility functions
    mockFilterRelevantActors.mockReturnValue([
      { name: "Robert Downey Jr.", character: "Tony Stark / Iron Man" },
    ]);
    mockFindActorMatch.mockReturnValue("Robert Downey Jr.");
    mockHasMultipleDistinctCharacters.mockReturnValue(true);
    mockNormalizeCharacterForGrouping.mockImplementation((char) => char.toLowerCase());
  });

  describe("singleton pattern", () => {
    it("should return the same instance when getInstance is called multiple times", () => {
      const instance1 = MoviesService.getInstance();
      const instance2 = MoviesService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with Redis and TMDB service dependencies", () => {
      expect(moviesService.redis).toBeDefined();
      expect(moviesService.tmdbService).toBeDefined();
    });
  });

  describe("getMoviesPerActor", () => {
    it("should return cached data when available", async () => {
      const cachedData = { "Robert Downey Jr.": ["Iron Man"] };
      mockCache.getNamespaced.mockResolvedValue(cachedData);

      const result = await moviesService.getMoviesPerActor();

      expect(result).toEqual(cachedData);
      expect(mockCache.getNamespaced).toHaveBeenCalledWith(
        "movies",
        "moviesPerActor"
      );
      expect(mockGetAllMoviesData).not.toHaveBeenCalled();
    });

    it("should fetch and process data when not cached", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Iron Man": {
          credits: {
            cast: [
              { name: "Robert Downey Jr.", character: "Tony Stark / Iron Man" },
              { name: "Gwyneth Paltrow", character: "Pepper Potts" },
            ],
          },
        },
        "The Avengers": {
          credits: {
            cast: [
              { name: "Robert Downey Jr.", character: "Tony Stark / Iron Man" },
              {
                name: "Chris Evans",
                character: "Steve Rogers / Captain America",
              },
            ],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([
        { name: "Robert Downey Jr.", character: "Tony Stark / Iron Man" },
      ]);
      mockFindActorMatch.mockReturnValue("Robert Downey Jr.");

      const result = await moviesService.getMoviesPerActor();

      expect(result).toEqual({
        "Robert Downey Jr.": ["Iron Man", "The Avengers"],
      });
      expect(mockCache.setNamespaced).toHaveBeenCalledWith(
        "movies",
        "moviesPerActor",
        expect.any(Object)
      );
    });

    it("should handle empty movie data", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({});

      const result = await moviesService.getMoviesPerActor();

      expect(result).toEqual({});
      expect(mockCache.setNamespaced).toHaveBeenCalledWith(
        "movies",
        "moviesPerActor",
        {}
      );
    });

    it("should handle movies with no relevant actors", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Unknown Movie": {
          credits: {
            cast: [{ name: "Unknown Actor", character: "Unknown Character" }],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([]);
      mockFindActorMatch.mockReturnValue(null);

      const result = await moviesService.getMoviesPerActor();

      expect(result).toEqual({});
    });

    it("should handle multiple actors in multiple movies", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Iron Man": {
          credits: {
            cast: [
              { name: "Robert Downey Jr.", character: "Tony Stark" },
              { name: "Gwyneth Paltrow", character: "Pepper Potts" },
            ],
          },
        },
        "Captain America": {
          credits: {
            cast: [{ name: "Chris Evans", character: "Steve Rogers" }],
          },
        },
        "The Avengers": {
          credits: {
            cast: [
              { name: "Robert Downey Jr.", character: "Tony Stark" },
              { name: "Chris Evans", character: "Steve Rogers" },
            ],
          },
        },
      });

      mockFilterRelevantActors
        .mockReturnValueOnce([
          { name: "Robert Downey Jr.", character: "Tony Stark" },
          { name: "Gwyneth Paltrow", character: "Pepper Potts" },
        ])
        .mockReturnValueOnce([
          { name: "Chris Evans", character: "Steve Rogers" },
        ])
        .mockReturnValueOnce([
          { name: "Robert Downey Jr.", character: "Tony Stark" },
          { name: "Chris Evans", character: "Steve Rogers" },
        ]);

      mockFindActorMatch
        .mockReturnValueOnce("Robert Downey Jr.")
        .mockReturnValueOnce("Gwyneth Paltrow")
        .mockReturnValueOnce("Chris Evans")
        .mockReturnValueOnce("Robert Downey Jr.")
        .mockReturnValueOnce("Chris Evans");

      const result = await moviesService.getMoviesPerActor();

      expect(result).toEqual({
        "Chris Evans": ["Captain America", "The Avengers"],
        "Gwyneth Paltrow": ["Iron Man"],
        "Robert Downey Jr.": ["Iron Man", "The Avengers"],
      });
    });

    it("should handle cache errors gracefully", async () => {
      mockCache.getNamespaced.mockRejectedValue(new Error("Cache error"));

      await expect(moviesService.getMoviesPerActor()).rejects.toThrow(
        "Cache error"
      );
    });

    it("should sort results alphabetically", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Zebra Movie": {
          credits: {
            cast: [{ name: "Zebra Actor", character: "Character Z" }],
          },
        },
        "Alpha Movie": {
          credits: {
            cast: [{ name: "Alpha Actor", character: "Character A" }],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([
        { name: "Zebra Actor", character: "Character Z" },
      ]);
      mockFindActorMatch
        .mockReturnValueOnce("Zebra Actor")
        .mockReturnValueOnce("Alpha Actor");

      const result = await moviesService.getMoviesPerActor();

      // Results should be sorted alphabetically by actor name
      const actorNames = Object.keys(result);
      expect(actorNames[0]).toBe("Alpha Actor");
      expect(actorNames[1]).toBe("Zebra Actor");
    });

    it("should handle TMDB API errors", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockRejectedValue(new Error("TMDB API error"));

      await expect(moviesService.getMoviesPerActor()).rejects.toThrow(
        "TMDB API error"
      );
    });
  });

  describe("getActorsWithMultipleCharacters", () => {
    it("should return cached data when available", async () => {
      const cachedData = {
        "Robert Downey Jr.": [
          { movieName: "Iron Man", characterName: "Tony Stark" },
          { movieName: "Iron Man 2", characterName: "Tony Stark / Iron Man" },
        ],
      };
      mockCache.getNamespaced.mockResolvedValue(cachedData);

      const result = await moviesService.getActorsWithMultipleCharacters();

      expect(result).toEqual(cachedData);
      expect(mockCache.getNamespaced).toHaveBeenCalledWith(
        "movies",
        "actorsWithMultipleCharacters"
      );
      expect(mockGetAllMoviesData).not.toHaveBeenCalled();
    });

    it("should fetch and process data when not cached", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Iron Man": {
          credits: {
            cast: [{ name: "Robert Downey Jr.", character: "Tony Stark" }],
          },
        },
        "Iron Man 2": {
          credits: {
            cast: [
              { name: "Robert Downey Jr.", character: "Tony Stark / Iron Man" },
            ],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([
        { name: "Robert Downey Jr.", character: "Tony Stark" },
      ]);
      mockFindActorMatch.mockReturnValue("Robert Downey Jr.");
      mockHasMultipleDistinctCharacters.mockReturnValue(true);
      mockNormalizeCharacterForGrouping.mockImplementation((char) => char.split(" / ")[0].toLowerCase());

      const result = await moviesService.getActorsWithMultipleCharacters();

      expect(mockCache.setNamespaced).toHaveBeenCalledWith(
        "movies",
        "actorsWithMultipleCharacters",
        expect.any(Object)
      );
      expect(mockHasMultipleDistinctCharacters).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({});
      mockHasMultipleDistinctCharacters.mockReturnValue(false);

      const result = await moviesService.getActorsWithMultipleCharacters();

      expect(result).toEqual({});
    });

    it("should handle API errors", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockRejectedValue(new Error("API error"));

      await expect(
        moviesService.getActorsWithMultipleCharacters()
      ).rejects.toThrow("API error");
    });
  });

  describe("getCharactersWithMultipleActors", () => {
    it("should return cached data when available", async () => {
      const cachedData = {
        "Spider-Man": [
          { movieName: "Spider-Man", actorName: "Tobey Maguire" },
          { movieName: "The Amazing Spider-Man", actorName: "Andrew Garfield" },
        ],
      };
      mockCache.getNamespaced.mockResolvedValue(cachedData);

      const result = await moviesService.getCharactersWithMultipleActors();

      expect(result).toEqual(cachedData);
      expect(mockCache.getNamespaced).toHaveBeenCalledWith(
        "movies",
        "charactersWithMultipleActors"
      );
      expect(mockGetAllMoviesData).not.toHaveBeenCalled();
    });

    it("should fetch and process data when not cached", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Spider-Man": {
          credits: {
            cast: [
              { name: "Tobey Maguire", character: "Spider-Man / Peter Parker" },
            ],
          },
        },
        "The Amazing Spider-Man": {
          credits: {
            cast: [
              {
                name: "Andrew Garfield",
                character: "Spider-Man / Peter Parker",
              },
            ],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([
        { name: "Tobey Maguire", character: "Spider-Man / Peter Parker" },
      ]);
      mockFindActorMatch
        .mockReturnValueOnce("Tobey Maguire")
        .mockReturnValueOnce("Andrew Garfield");
      mockNormalizeCharacterForGrouping.mockReturnValue("spiderman");

      const result = await moviesService.getCharactersWithMultipleActors();

      expect(mockCache.setNamespaced).toHaveBeenCalledWith(
        "movies",
        "charactersWithMultipleActors",
        expect.any(Object)
      );
    });

    it("should handle characters with single actors", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Iron Man": {
          credits: {
            cast: [{ name: "Robert Downey Jr.", character: "Tony Stark" }],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([
        { name: "Robert Downey Jr.", character: "Tony Stark" },
      ]);
      mockFindActorMatch.mockReturnValue("Robert Downey Jr.");
      mockNormalizeCharacterForGrouping.mockReturnValue("tony stark");

      const result = await moviesService.getCharactersWithMultipleActors();

      expect(result).toEqual({});
    });

    it("should handle API errors", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockRejectedValue(new Error("API error"));

      await expect(
        moviesService.getCharactersWithMultipleActors()
      ).rejects.toThrow("API error");
    });

    it("should preserve original character names in results", async () => {
      mockCache.getNamespaced.mockResolvedValue(null);
      mockGetAllMoviesData.mockResolvedValue({
        "Spider-Man": {
          credits: {
            cast: [
              { name: "Tobey Maguire", character: "Spider-Man / Peter Parker" },
            ],
          },
        },
        "The Amazing Spider-Man": {
          credits: {
            cast: [
              {
                name: "Andrew Garfield",
                character: "Spider-Man / Peter Parker",
              },
            ],
          },
        },
      });

      mockFilterRelevantActors.mockReturnValue([
        { name: "Tobey Maguire", character: "Spider-Man / Peter Parker" },
      ]);
      mockFindActorMatch
        .mockReturnValueOnce("Tobey Maguire")
        .mockReturnValueOnce("Andrew Garfield");
      mockNormalizeCharacterForGrouping.mockReturnValue("spiderman");

      const result = await moviesService.getCharactersWithMultipleActors();

      // Should use original character name as key, not trimmed version
      expect(Object.keys(result)).toContain("Spider-Man / Peter Parker");
    });
  });
});
