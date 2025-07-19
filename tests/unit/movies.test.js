import { jest } from "@jest/globals";
import {
  filterRelevantActors,
  normalizeActorName,
  normalizeCharacterName,
  findActorMatch,
  parseCharacterNames,
  extractPrimaryCharacterName,
  hasMultipleDistinctCharacters,
  normalizeCharacterForGrouping,
} from "../../src/utils/movies.js";

describe("Movies Utilities", () => {
  describe("normalizeActorName", () => {
    it("should normalize actor names correctly", () => {
      expect(normalizeActorName("  Robert Downey Jr.  ")).toBe("robert downey jr");
      expect(normalizeActorName("Chris Evans")).toBe("chris evans");
      expect(normalizeActorName("Scarlett Johansson!")).toBe("scarlett johansson");
    });

    it("should handle null and undefined", () => {
      expect(normalizeActorName(null)).toBe("");
      expect(normalizeActorName(undefined)).toBe("");
    });

    it("should handle empty string", () => {
      expect(normalizeActorName("")).toBe("");
    });

    it("should handle unicode characters", () => {
      expect(normalizeActorName("José García")).toBe("jose garcia");
      expect(normalizeActorName("Zoe Saldaña")).toBe("zoe saldana");
    });
  });

  describe("normalizeCharacterName", () => {
    it("should normalize character names correctly", () => {
      expect(normalizeCharacterName("  Tony Stark / Iron Man  ")).toBe("tony stark / iron man");
      expect(normalizeCharacterName("Bruce Banner (Hulk)")).toBe("bruce banner hulk");
      expect(normalizeCharacterName("Peter Parker [Spider-Man]")).toBe("peter parker spiderman");
      expect(normalizeCharacterName("")).toBe("");
      expect(normalizeCharacterName(null)).toBe("");
    });

    it("should handle unicode characters", () => {
      expect(normalizeCharacterName("José García")).toBe("jose garcia");
      expect(normalizeCharacterName("Zoe Saldaña")).toBe("zoe saldana");
    });

    it("should remove special characters but preserve slashes", () => {
      expect(normalizeCharacterName("Tony Stark!@#$%")).toBe("tony stark");
      expect(normalizeCharacterName("Character-Name_123")).toBe("charactername123");
      expect(normalizeCharacterName("Steve Rogers / Captain America")).toBe("steve rogers / captain america");
    });
  });

  describe("parseCharacterNames", () => {
    it("should parse single character names", () => {
      expect(parseCharacterNames("Tony Stark")).toEqual(["Tony Stark"]);
      expect(parseCharacterNames("Bruce Banner")).toEqual(["Bruce Banner"]);
    });

    it("should parse multiple character identities", () => {
      expect(parseCharacterNames("Steve Rogers / Captain America")).toEqual([
        "Steve Rogers",
        "Captain America",
      ]);
      expect(parseCharacterNames("Tony Stark / Iron Man")).toEqual([
        "Tony Stark",
        "Iron Man",
      ]);
    });

    it("should handle extra spaces", () => {
      expect(parseCharacterNames("  Steve Rogers  /  Captain America  ")).toEqual([
        "Steve Rogers",
        "Captain America",
      ]);
    });

    it("should handle empty and null inputs", () => {
      expect(parseCharacterNames("")).toEqual([]);
      expect(parseCharacterNames(null)).toEqual([]);
      expect(parseCharacterNames(undefined)).toEqual([]);
    });

    it("should handle three or more identities", () => {
      expect(parseCharacterNames("A / B / C")).toEqual(["A", "B", "C"]);
    });
  });

  describe("extractPrimaryCharacterName", () => {
    it("should extract the first character name", () => {
      expect(extractPrimaryCharacterName("Steve Rogers / Captain America")).toBe("Steve Rogers");
      expect(extractPrimaryCharacterName("Tony Stark / Iron Man")).toBe("Tony Stark");
      expect(extractPrimaryCharacterName("Bruce Banner")).toBe("Bruce Banner");
    });

    it("should handle empty inputs", () => {
      expect(extractPrimaryCharacterName("")).toBe("");
      expect(extractPrimaryCharacterName(null)).toBe("");
    });
  });

  describe("hasMultipleDistinctCharacters", () => {
    it("should return false for single character", () => {
      expect(hasMultipleDistinctCharacters(["Tony Stark"])).toBe(false);
      expect(hasMultipleDistinctCharacters(["Tony Stark / Iron Man"])).toBe(false);
    });

    it("should return false for same primary character", () => {
      expect(hasMultipleDistinctCharacters([
        "Tony Stark / Iron Man",
        "Tony Stark"
      ])).toBe(false);
      
      expect(hasMultipleDistinctCharacters([
        "Steve Rogers / Captain America",
        "Steve Rogers"
      ])).toBe(false);
    });

    it("should return true for multiple distinct characters", () => {
      expect(hasMultipleDistinctCharacters([
        "Tony Stark / Iron Man",
        "Bruce Banner / Hulk"
      ])).toBe(true);
      
      expect(hasMultipleDistinctCharacters([
        "Steve Rogers / Captain America",
        "Johnny Storm / Human Torch"
      ])).toBe(true);
    });

    it("should return true for different primary character names", () => {
      // These have different primary names so are distinct characters
      expect(hasMultipleDistinctCharacters([
        "James Rhodes",
        "Lieutenant James Rhodes", 
        "Colonel James Rhodes"
      ])).toBe(true); // "James Rhodes", "Lieutenant James Rhodes", "Colonel James Rhodes" are all different primary names
      
      expect(hasMultipleDistinctCharacters([
        "Natasha Romanoff",
        "Natalie Rushman"
      ])).toBe(true); // Different primary names
    });

    it("should handle edge cases", () => {
      expect(hasMultipleDistinctCharacters([])).toBe(false);
      expect(hasMultipleDistinctCharacters([""])).toBe(false);
      expect(hasMultipleDistinctCharacters([null, undefined])).toBe(false);
    });
  });

  describe("normalizeCharacterForGrouping", () => {
    it("should normalize primary character names for grouping", () => {
      expect(normalizeCharacterForGrouping("Steve Rogers / Captain America")).toBe("steve rogers");
      expect(normalizeCharacterForGrouping("Tony Stark / Iron Man")).toBe("tony stark");
      expect(normalizeCharacterForGrouping("Bruce Banner")).toBe("bruce banner");
    });

    it("should handle complex character strings", () => {
      expect(normalizeCharacterForGrouping("James 'Rhodey' Rhodes / War Machine")).toBe("james rhodey rhodes");
    });
  });

  describe("findActorMatch", () => {
    const relevantActors = ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo"];

    it("should find exact matches", () => {
      const castMember = { name: "Robert Downey Jr." };
      expect(findActorMatch(castMember, relevantActors)).toBe("Robert Downey Jr.");
    });

    it("should find case-insensitive matches", () => {
      const castMember = { name: "robert downey jr." };
      expect(findActorMatch(castMember, relevantActors)).toBe("Robert Downey Jr.");
    });

    it("should return undefined for no match", () => {
      const castMember = { name: "Unknown Actor" };
      expect(findActorMatch(castMember, relevantActors)).toBeUndefined();
    });

    it("should handle null cast member", () => {
      expect(findActorMatch(null, relevantActors)).toBeUndefined();
    });

    it("should handle cast member without name", () => {
      expect(findActorMatch({}, relevantActors)).toBeUndefined();
    });
  });

  describe("filterRelevantActors", () => {
    const relevantActors = ["Robert Downey Jr.", "Chris Evans"];
    const cast = [
      { name: "Robert Downey Jr.", character: "Tony Stark" },
      { name: "Gwyneth Paltrow", character: "Pepper Potts" },
      { name: "Chris Evans", character: "Steve Rogers" },
    ];

    it("should filter relevant actors", () => {
      const result = filterRelevantActors(cast, relevantActors);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Robert Downey Jr.");
      expect(result[1].name).toBe("Chris Evans");
    });

    it("should handle empty cast list", () => {
      const result = filterRelevantActors([], relevantActors);
      expect(result).toEqual([]);
    });

    it("should handle empty relevant actors list", () => {
      const result = filterRelevantActors(cast, []);
      expect(result).toEqual([]);
    });

    it("should handle case insensitive matching", () => {
      const caseInsensitiveCast = [
        { name: "robert downey jr.", character: "Tony Stark" },
        { name: "CHRIS EVANS", character: "Steve Rogers" },
      ];
      const result = filterRelevantActors(caseInsensitiveCast, relevantActors);
      expect(result).toHaveLength(2);
    });
  });
});