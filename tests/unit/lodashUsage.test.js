import _ from "lodash";

describe("Lodash Usage Validation", () => {
  describe("Core Lodash Functions", () => {
    it("should demonstrate chain operations", () => {
      const data = [
        { name: "Robert Downey Jr.", movies: ["Iron Man", "Avengers"] },
        { name: "Chris Evans", movies: ["Captain America", "Avengers"] },
        { name: "Mark Ruffalo", movies: ["Avengers"] },
      ];

      const result = _.chain(data)
        .filter((actor) => actor.movies.length > 1)
        .map("name")
        .sortBy()
        .value();

      expect(result).toEqual(["Chris Evans", "Robert Downey Jr."]);
    });

    it("should demonstrate groupBy operations", () => {
      const cast = [
        { name: "Robert Downey Jr.", movie: "Iron Man" },
        { name: "Robert Downey Jr.", movie: "Avengers" },
        { name: "Chris Evans", movie: "Captain America" },
        { name: "Chris Evans", movie: "Avengers" },
      ];

      const grouped = _.groupBy(cast, "name");

      expect(Object.keys(grouped)).toContain("Robert Downey Jr.");
      expect(Object.keys(grouped)).toContain("Chris Evans");
      expect(grouped["Robert Downey Jr."]).toHaveLength(2);
    });

    it("should demonstrate collection operations", () => {
      const movies = ["Iron Man", "Captain America", "Thor", "Avengers"];

      expect(_.take(movies, 2)).toEqual(["Iron Man", "Captain America"]);
      expect(_.drop(movies, 2)).toEqual(["Thor", "Avengers"]);
      expect(_.includes(movies, "Thor")).toBe(true);
    });

    it("should demonstrate string operations", () => {
      const characterName = "  Tony Stark / Iron Man (Mark III)  ";

      const cleaned = _.chain(characterName)
        .trim()
        .split("/")
        .head()
        .replace(/\([^)]*\)/g, "")
        .trim()
        .value();

      expect(cleaned).toBe("Tony Stark");
    });
  });

  describe("Data Transformation", () => {
    it("should transform nested data structures", () => {
      const moviesData = {
        "Iron Man": { cast: [{ name: "Robert Downey Jr." }] },
        Avengers: {
          cast: [{ name: "Robert Downey Jr." }, { name: "Chris Evans" }],
        },
      };

      const actorMovies = _.chain(moviesData)
        .flatMap((movie, title) =>
          _.map(movie.cast, (actor) => ({ actor: actor.name, movie: title }))
        )
        .groupBy("actor")
        .mapValues((entries) => _.map(entries, "movie"))
        .value();

      expect(actorMovies).toEqual({
        "Robert Downey Jr.": ["Iron Man", "Avengers"],
        "Chris Evans": ["Avengers"],
      });
    });

    it("should handle complex filtering with pickBy", () => {
      const actorData = {
        "Robert Downey Jr.": ["Iron Man", "Avengers"],
        "Chris Evans": ["Captain America", "Avengers"],
        "Mark Ruffalo": ["Avengers"],
      };

      const multipleMovies = _.pickBy(actorData, (movies) => movies.length > 1);

      expect(Object.keys(multipleMovies)).toEqual([
        "Robert Downey Jr.",
        "Chris Evans",
      ]);
    });
  });

  describe("Mathematical Operations", () => {
    it("should perform statistical calculations", () => {
      const castSizes = [5, 8, 12, 6, 9, 15];

      expect(_.mean(castSizes)).toBe(9.166666666666666);
      expect(_.max(castSizes)).toBe(15);
      expect(_.min(castSizes)).toBe(5);
      expect(_.sum(castSizes)).toBe(55);
    });

    it("should find extremes with criteria", () => {
      const movies = [
        { title: "Iron Man", year: 2008, cast: 5 },
        { title: "Avengers", year: 2012, cast: 15 },
        { title: "Thor", year: 2011, cast: 8 },
      ];

      const oldestMovie = _.minBy(movies, "year");
      const biggestCast = _.maxBy(movies, "cast");

      expect(oldestMovie.title).toBe("Iron Man");
      expect(biggestCast.title).toBe("Avengers");
    });
  });

  describe("Array Operations", () => {
    it("should handle array chunking and flattening", () => {
      const movieIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const batches = _.chunk(movieIds, 3);
      expect(batches).toHaveLength(4);
      expect(batches[0]).toEqual([1, 2, 3]);

      const flattened = _.flatten(batches);
      expect(flattened).toEqual(movieIds);
    });

    it("should remove duplicates and nulls", () => {
      const data = [1, 2, null, 3, 2, undefined, 4, null, 1];

      const unique = _.uniq(data);
      const compact = _.compact(data);

      expect(unique).toEqual([1, 2, null, 3, undefined, 4]);
      expect(compact).toEqual([1, 2, 3, 2, 4, 1]);
    });
  });

  describe("Object Operations", () => {
    it("should manipulate object keys and values", () => {
      const movies = { "Iron Man": 1726, Thor: 10195, Avengers: 24428 };

      const keys = _.keys(movies);
      const values = _.values(movies);
      const pairs = _.toPairs(movies);

      expect(keys).toEqual(["Iron Man", "Thor", "Avengers"]);
      expect(values).toEqual([1726, 10195, 24428]);
      expect(pairs).toEqual([
        ["Iron Man", 1726],
        ["Thor", 10195],
        ["Avengers", 24428],
      ]);
    });

    it("should create objects from arrays", () => {
      const keys = ["name", "age", "role"];
      const values = ["Tony Stark", 45, "Iron Man"];

      const obj = _.zipObject(keys, values);

      expect(obj).toEqual({
        name: "Tony Stark",
        age: 45,
        role: "Iron Man",
      });
    });
  });

  describe("Type Checking", () => {
    it("should validate data types", () => {
      const data = {
        string: "test",
        number: 42,
        array: [1, 2, 3],
        object: { key: "value" },
        empty: null,
      };

      expect(_.isString(data.string)).toBe(true);
      expect(_.isNumber(data.number)).toBe(true);
      expect(_.isArray(data.array)).toBe(true);
      expect(_.isObject(data.object)).toBe(true);
      expect(_.isEmpty(data.empty)).toBe(true);
    });
  });
});
