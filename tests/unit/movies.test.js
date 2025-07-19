import { jest } from "@jest/globals";
import {
  filterRelevantActors,
  normalizeActorName,
  normalizeCharacterName,
  findActorMatch,
  trimCharacterName,
  isMoreThanOneCharacter,
} from "../../src/utils/movies.js";

describe("Movies Utilities", () => {
  describe("trimCharacterName", () => {
    it("should trim character names correctly", () => {
      expect(trimCharacterName("Tony Stark / Iron Man")).toBe("Tony Stark");
      expect(trimCharacterName("Bruce Banner (Hulk)")).toBe("Bruce Banner");
      expect(trimCharacterName("Peter Parker [Spider-Man]")).toBe(
        "Peter Parker"
      );
      expect(trimCharacterName("  Steve Rogers  ")).toBe("Steve Rogers");
      expect(trimCharacterName("")).toBe("");
      expect(trimCharacterName(null)).toBe("");
    });

    it("should handle complex character names", () => {
      expect(trimCharacterName("Tony Stark / Iron Man (Mark III)")).toBe(
        "Tony Stark"
      );
      expect(trimCharacterName("Bruce Banner / Hulk [CGI]")).toBe(
        "Bruce Banner"
      );
      expect(trimCharacterName("Multiple   Spaces   Name")).toBe(
        "Multiple Spaces Name"
      );
    });
  });

  describe("isMoreThanOneCharacter", () => {
    it("should return false for single character", () => {
      expect(isMoreThanOneCharacter(["Tony Stark"])).toBe(false);
      expect(isMoreThanOneCharacter(["Tony Stark", "Tony Stark"])).toBe(false);
    });

    it("should return true for multiple distinct characters", () => {
      expect(isMoreThanOneCharacter(["Tony Stark", "Bruce Banner"])).toBe(true);
      expect(
        isMoreThanOneCharacter(["Iron Man", "Tony Stark", "Peter Parker"])
      ).toBe(true);
    });

    it("should handle character variations correctly", () => {
      expect(
        isMoreThanOneCharacter(["Tony Stark", "Tony Stark (Iron Man)"])
      ).toBe(false);
      expect(
        isMoreThanOneCharacter(["Bruce Banner", "Bruce Banner / Hulk"])
      ).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isMoreThanOneCharacter([])).toBe(false);
      expect(isMoreThanOneCharacter([""])).toBe(false);
      expect(isMoreThanOneCharacter([null, undefined])).toBe(false);
    });
  });

  describe("normalizeActorName", () => {
    it("should normalize actor names correctly", () => {
      expect(normalizeActorName("  Robert Downey Jr.  ")).toBe(
        "robert downey jr"
      );
      expect(normalizeActorName("Chris Evans")).toBe("chris evans");
      expect(normalizeActorName("Scarlett Johansson!")).toBe(
        "scarlett johansson"
      );
    });
  });

  describe("findActorMatch", () => {
    const relevantActors = ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo"];

    it("should find exact matches", () => {
      const castMember = { name: "Robert Downey Jr." };
      expect(findActorMatch(castMember, relevantActors)).toBe(
        "Robert Downey Jr."
      );
    });

    it("should find partial matches", () => {
      const castMember = { name: "robert downey jr." };
      expect(findActorMatch(castMember, relevantActors)).toBe(
        "Robert Downey Jr."
      );
    });

    it("should return undefined for no match", () => {
      const castMember = { name: "Unknown Actor" };
      expect(findActorMatch(castMember, relevantActors)).toBeUndefined();
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

    it("should handle no matching actors", () => {
      const irrelevantActors = ["Unknown Actor", "Another Actor"];
      const result = filterRelevantActors(cast, irrelevantActors);
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

    it("should handle actors with extra spaces", () => {
      const spacedCast = [
        { name: "  Robert Downey Jr.  ", character: "Tony Stark" },
        { name: "Chris Evans   ", character: "Steve Rogers" },
      ];
      const result = filterRelevantActors(spacedCast, relevantActors);
      expect(result).toHaveLength(2);
    });
  });

  describe("normalizeCharacterName", () => {
    it("should normalize character names correctly", () => {
      expect(normalizeCharacterName("  Tony Stark / Iron Man  ")).toBe(
        "tony stark / iron man"
      );
      expect(normalizeCharacterName("Bruce Banner (Hulk)")).toBe(
        "bruce banner hulk"
      );
      expect(normalizeCharacterName("Peter Parker [Spider-Man]")).toBe(
        "peter parker spiderman"
      );
      expect(normalizeCharacterName("")).toBe("");
      expect(normalizeCharacterName(null)).toBe("");
    });

    it("should handle unicode characters", () => {
      expect(normalizeCharacterName("José García")).toBe("jose garcia");
      expect(normalizeCharacterName("Zoe Saldaña")).toBe("zoe saldana");
    });

    it("should remove special characters", () => {
      expect(normalizeCharacterName("Tony Stark!@#$%")).toBe("tony stark");
      expect(normalizeCharacterName("Character-Name_123")).toBe(
        "charactername123"
      );
    });
  });

  describe("normalizeActorName - additional edge cases", () => {
    it("should handle null and undefined", () => {
      expect(normalizeActorName(null)).toBe("");
      expect(normalizeActorName(undefined)).toBe("");
    });

    it("should handle empty string", () => {
      expect(normalizeActorName("")).toBe("");
    });

    it("should handle only spaces", () => {
      expect(normalizeActorName("   ")).toBe("");
    });

    it("should handle numbers in names", () => {
      expect(normalizeActorName("Actor Number 1")).toBe("actor number 1");
    });

    it("should handle special characters", () => {
      expect(normalizeActorName("Robert Downey Jr.!@#$%")).toBe(
        "robert downey jr"
      );
    });

    it("should handle unicode characters", () => {
      // The implementation converts accented characters to their base forms
      expect(normalizeActorName("José García")).toBe("jose garcia");
      expect(normalizeActorName("Zoe Saldaña")).toBe("zoe saldana");
    });
  });

  describe("findActorMatch - comprehensive testing", () => {
    const relevantActors = [
      "Robert Downey Jr.",
      "Chris Evans",
      "Mark Ruffalo",
      "José García",
    ];

    it("should handle null cast member", () => {
      expect(findActorMatch(null, relevantActors)).toBeUndefined();
    });

    it("should handle cast member without name", () => {
      expect(findActorMatch({}, relevantActors)).toBeUndefined();
    });

    it("should handle empty name", () => {
      expect(findActorMatch({ name: "" }, relevantActors)).toBeUndefined();
    });

    it("should handle names with different punctuation", () => {
      const castMember = { name: "Robert Downey Jr" }; // No period
      expect(findActorMatch(castMember, relevantActors)).toBe(
        "Robert Downey Jr."
      );
    });

    it("should handle names with extra characters", () => {
      const castMember = { name: "Robert Downey Jr.!!!" };
      expect(findActorMatch(castMember, relevantActors)).toBe(
        "Robert Downey Jr."
      );
    });

    it("should handle unicode characters", () => {
      const castMember = { name: "José García" };
      expect(findActorMatch(castMember, relevantActors)).toBe("José García");
    });

    it("should handle partial name matches", () => {
      const castMember = { name: "R. Downey Jr." };
      expect(findActorMatch(castMember, relevantActors)).toBeUndefined(); // Should not match partial
    });

    it("should handle middle names", () => {
      const castMember = { name: "Robert John Downey Jr." };
      expect(findActorMatch(castMember, relevantActors)).toBeUndefined(); // Should not match with extra names
    });
  });

  describe("trimCharacterName - extensive edge cases", () => {
    it("should handle nested parentheses", () => {
      expect(trimCharacterName("Tony Stark (Iron Man (Mark III))")).toBe(
        "Tony Stark"
      );
    });

    it("should handle mixed brackets", () => {
      expect(trimCharacterName("Bruce Banner [Hulk] (CGI)")).toBe(
        "Bruce Banner"
      );
    });

    it("should handle multiple slashes", () => {
      expect(trimCharacterName("Peter Parker / Spider-Man / Web-Slinger")).toBe(
        "Peter Parker"
      );
    });

    it("should handle only special characters", () => {
      expect(trimCharacterName("(uncredited)")).toBe("");
      expect(trimCharacterName("[voice]")).toBe("");
      expect(trimCharacterName("/ / /")).toBe("");
    });

    it("should handle character names with numbers", () => {
      expect(trimCharacterName("Terminator T-800 / Model 101")).toBe(
        "Terminator T-800"
      );
    });

    it("should handle very long character names", () => {
      const longName =
        "Very Long Character Name That Goes On And On / Alias1 / Alias2";
      expect(trimCharacterName(longName)).toBe(
        "Very Long Character Name That Goes On And On"
      );
    });

    it("should handle character names with apostrophes", () => {
      expect(trimCharacterName("Tony 'Iron Man' Stark / Superhero")).toBe(
        "Tony 'Iron Man' Stark"
      );
    });
  });

  describe("isMoreThanOneCharacter - comprehensive scenarios", () => {
    it("should handle mixed case variations of same character", () => {
      expect(
        isMoreThanOneCharacter(["tony stark", "Tony Stark", "TONY STARK"])
      ).toBe(false);
    });

    it("should handle character names with different punctuation", () => {
      // These should be treated as the same character after normalization
      expect(
        isMoreThanOneCharacter(["Tony Stark", "Tony Stark.", "Tony Stark!"])
      ).toBe(false);
    });

    it("should handle character aliases correctly", () => {
      // These should be detected as the same core character (Tony Stark)
      expect(
        isMoreThanOneCharacter([
          "Tony Stark / Iron Man",
          "Tony Stark",
          "Iron Man",
        ])
      ).toBe(false);
    });

    it("should detect truly different characters", () => {
      expect(
        isMoreThanOneCharacter(["Tony Stark", "Bruce Banner", "Steve Rogers"])
      ).toBe(true);
    });

    it("should handle character names with parentheses", () => {
      // These should be detected as the same core character (Bruce Banner)
      expect(
        isMoreThanOneCharacter(["Bruce Banner", "Bruce Banner (Hulk)", "Hulk"])
      ).toBe(false);
    });

    it("should handle very similar but different characters", () => {
      expect(
        isMoreThanOneCharacter([
          "Peter Parker",
          "Peter Parker (Spider-Man)",
          "Miles Morales (Spider-Man)",
        ])
      ).toBe(true);
    });

    it("should handle Marvel character variations correctly", () => {
      // Steve Rogers / Captain America variations should be treated as same character
      expect(
        isMoreThanOneCharacter([
          "Steve Rogers",
          "Captain America",
          "Loki as Captain America",
        ])
      ).toBe(false);

      // James Rhodes variations should be treated as same character
      expect(
        isMoreThanOneCharacter([
          "James Rhodes",
          "Lieutenant James Rhodes",
          "Lt Col James Rhodey Rhodes",
          "Colonel James Rhodes",
          "Rhodey",
        ])
      ).toBe(false);

      // Natasha Romanoff variations should be treated as same character
      expect(
        isMoreThanOneCharacter([
          "Natasha Romanoff",
          "Natalie Rushman",
          "Black Widow",
        ])
      ).toBe(false);
    });

    it("should detect truly different Marvel characters", () => {
      expect(isMoreThanOneCharacter(["Johnny Storm", "Erik Killmonger"])).toBe(
        true
      );

      expect(
        isMoreThanOneCharacter(["Tony Stark", "Bruce Banner", "Steve Rogers"])
      ).toBe(true);
    });

    it("should handle large character lists", () => {
      const manyCharacters = Array(100).fill("Tony Stark");
      expect(isMoreThanOneCharacter(manyCharacters)).toBe(false);
    });

    it("should handle mixed null and undefined values", () => {
      expect(isMoreThanOneCharacter([null, undefined, "", "Tony Stark"])).toBe(
        false
      );
    });
  });

  describe("performance and stress testing", () => {
    it("should handle large cast lists efficiently", () => {
      const largeCast = Array(1000)
        .fill()
        .map((_, i) => ({
          name: `Actor ${i}`,
          character: `Character ${i}`,
        }));
      const relevantActors = ["Actor 500"];

      const startTime = Date.now();
      const result = filterRelevantActors(largeCast, relevantActors);
      const endTime = Date.now();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it("should handle large relevant actors list efficiently", () => {
      const cast = [{ name: "Test Actor", character: "Test Character" }];
      const largeRelevantActors = Array(1000)
        .fill()
        .map((_, i) => `Actor ${i}`);
      largeRelevantActors.push("Test Actor");

      const startTime = Date.now();
      const result = filterRelevantActors(cast, largeRelevantActors);
      const endTime = Date.now();

      expect(result).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
